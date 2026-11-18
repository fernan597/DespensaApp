<?php

namespace App\Http\Controllers;

use App\Enums\AccionAuditoria;
use App\Http\Requests\StoreCompraRequest;
use App\Http\Resources\CompraResource;
use App\Models\Caja;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\Product;
use App\Models\Proveedor;
use App\Services\AlertaStockService;
use App\Services\AuditoriaService;
use DomainException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class CompraController extends Controller
{
    /**
     * Constructor con inyección de dependencias.
     * Laravel inyecta automáticamente el AuditoriaService desde su contenedor de servicios.
     */
    public function __construct(
        protected AuditoriaService $auditoriaService
    ) {}

    /**
     * POST /api/compras
     * Registra una compra de mercadería al proveedor.
     * Puede ser CONTADO (descuenta de caja) o CUENTA_CORRIENTE (genera deuda con el proveedor).
     * Actualiza el stock de cada producto comprado y verifica alertas de stock.
     *
     * AlertaStockService se inyecta directamente en el método (inyección por parámetro)
     * porque solo se necesita aquí, no en todo el controlador.
     */
    public function store(StoreCompraRequest $request, AlertaStockService $alertaStockService): JsonResponse
    {
        // Normalizamos el tipo de pago a mayúsculas para evitar problemas con 'contado' vs 'CONTADO'.
        $tipoPagoInput = strtoupper($request->tipo_pago);

        // Booleano que simplifica la lectura del código: true si es contado, false si es crédito.
        $esContado = ($tipoPagoInput === 'CONTADO');

        try {
            // Iniciamos una transacción de base de datos.
            // Si cualquier operación dentro falla, todas se revierten (atomicidad).
            $compra = DB::transaction(function () use ($request, $esContado, $alertaStockService) {

                // Solo verificamos caja abierta si el pago es al contado,
                // ya que solo en ese caso necesitamos registrar un egreso de efectivo.
                $caja = null;
                if ($esContado) {
                    // lockForUpdate() bloquea la fila de la caja en la BD durante la transacción.
                    // Evita que otra transacción paralela lea o modifique la misma caja al mismo tiempo.
                    $caja = Caja::abierta()->lockForUpdate()->first();
                    if (! $caja) {
                        // DomainException señala un error de regla de negocio, no un bug técnico.
                        // Al lanzarla, la transacción se revierte automáticamente.
                        throw new DomainException(
                            'No hay caja abierta para registrar el egreso de una compra de contado. Abra la caja primero.'
                        );
                    }
                }

                // Bloqueamos el registro del proveedor para evitar condiciones de carrera
                // si múltiples compras al mismo proveedor corren en paralelo.
                $proveedor = Proveedor::lockForUpdate()->findOrFail($request->proveedor_id);

                // Verificamos que el proveedor esté activo antes de registrar la compra.
                if ( ! $proveedor->activo) {
                    throw new DomainException(
                        'El proveedor seleccionado se encuentra inactivo y no puede recibir compras.'
                    );
                }

                // Obtenemos los items del request (array de productos con cantidad y costo).
                $items = $request->items;

                // Extraemos solo los IDs de productos para hacer una única consulta a la BD.
                // sort() y values() garantizan un orden consistente, útil para evitar deadlocks
                // cuando múltiples transacciones bloquean las mismas filas en distinto orden.
                $productIds = collect($items)->pluck('producto_id')->sort()->values()->all();

                // Consultamos todos los productos de una sola vez (evitamos N+1 queries).
                // lockForUpdate() bloquea estas filas para actualizar el stock de forma segura.
                // keyBy('id') convierte la colección en un mapa id => producto para acceso O(1).
                $productosDb = Product::whereIn('id', $productIds)
                    ->orderBy('id')          // Mismo orden que los IDs: coherencia en el bloqueo.
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                // Variables para acumular el total y los productos procesados.
                $total = 0;
                $productosProcesados = [];

                // Recorremos cada item del pedido para calcular subtotales y validar existencia.
                foreach ($items as $item) {
                    $productoId = $item['producto_id'];

                    // Buscamos el producto en el mapa pre-cargado (sin nueva query a la BD).
                    $producto = $productosDb->get($productoId);

                    // Si el producto no existe en la BD, lanzamos error de dominio.
                    if (! $producto) {
                        throw new DomainException("El producto con ID {$productoId} no fue encontrado.");
                    }

                    // Casteamos a los tipos correctos para evitar problemas de tipos en PHP.
                    $cantidad = (int) $item['cantidad'];
                    $costoUnitario = (float) $item['costo_unitario'];

                    // Calculamos el subtotal del item y lo redondeamos a 2 decimales
                    // para evitar errores de punto flotante en la suma acumulativa.
                    $subtotal = round($cantidad * $costoUnitario, 2);

                    // Acumulamos al total general de la compra.
                    $total += $subtotal;

                    // Guardamos los datos procesados del producto para usarlos más adelante.
                    $productosProcesados[] = [
                        'modelo'         => $producto,       // Referencia al modelo Eloquent.
                        'cantidad'       => $cantidad,
                        'costo_unitario' => $costoUnitario,
                        'subtotal'       => $subtotal,
                    ];
                }

                // Redondeamos el total final por si hubo acumulación de decimales en el bucle.
                $total = round($total, 2);

                // Mapeamos el tipo de pago al valor que se guardará en la BD.
                $tipoPagoDb = $esContado ? 'CONTADO' : 'CUENTA_CORRIENTE';

                // Limpiamos el número de comprobante o lo dejamos null si está vacío.
                // trim() elimina espacios accidentales al inicio y al final.
                $numeroComprobante = ! empty($request->numero_comprobante)
                    ? trim($request->numero_comprobante)
                    : null;

                // Creamos el registro principal de la compra en la BD.
                $compra = Compra::create([
                    'user_id'            => $request->user()->id, // Usuario que registra la compra.
                    'proveedor_id'       => $proveedor->id,
                    'numero_comprobante' => $numeroComprobante,    // Puede ser null si no se proveyó.
                    'total'              => $total,
                    'tipo_pago'          => $tipoPagoDb,
                    'pendiente_pago'     => ! $esContado,          // true solo si es cuenta corriente.
                    'estado'             => 'RECIBIDA',            // La mercadería ya fue recibida.
                ]);

                // Recorremos los productos procesados para registrar el detalle y actualizar stock.
                foreach ($productosProcesados as $proc) {
                    $producto = $proc['modelo'];
                    $cantidad = $proc['cantidad'];
                    $costoUnitario = $proc['costo_unitario'];
                    $subtotal = $proc['subtotal'];

                    // Creamos el detalle de compra (tabla  entre compra y producto).
                    DetalleCompra::create([
                        'compra_id'         => $compra->id,
                        'product_id'        => $producto->id,
                        'cantidad'          => $cantidad,
                        'costo_adquisicion' => $costoUnitario, // Costo al que se compró en este momento.
                        'subtotal'          => $subtotal,
                    ]);

                    // Incrementamos el stock del producto de forma atómica en la BD.
                    // El segundo argumento de increment() permite actualizar otras columnas al mismo tiempo,
                    // en este caso actualizamos el precio_compra con el último costo pagado.
                    $producto->increment('stock_actual', $cantidad, [
                        'precio_compra' => $costoUnitario,
                    ]);

                    // Refrescamos el modelo desde la BD para obtener los valores actualizados
                    // (el stock y precio_compra que acaba de cambiar el increment).
                    $producto->refresh();

                    // Verificamos si el stock actualizado activa o desactiva una alerta de stock bajo.
                    // El servicio decide internamente si debe crear, actualizar o eliminar la alerta.
                    $alertaStockService->sincronizarProducto($producto);
                }

                // Registramos el movimiento financiero según el tipo de pago.
                if ($esContado) {
                    // Pago al contado: registramos el egreso de efectivo de la caja.
                    MovimientoCaja::create([
                        'caja_id'   => $caja->id,
                        'monto'     => $total,
                        'tipo'      => 'EGRESO_PAGO_PROVEEDOR', // Egresa dinero de la caja.
                        // Generamos un concepto descriptivo, incluyendo el comprobante si existe.
                        'concepto'  => "Compra de mercadería #{$compra->id}" . ($numeroComprobante ? " (Comp: {$numeroComprobante})" : "") . " - Proveedor: {$proveedor->razon_social}",
                        'compra_id' => $compra->id,
                    ]);
                } else {
                    // Pago en cuenta corriente: registramos la deuda con el proveedor.
                    // DEBITO significa que el negocio le debe al proveedor (incrementa la deuda).
                    MovimientoCuentaCorrienteProveedor::create([
                        'proveedor_id'    => $proveedor->id,
                        'monto'           => $total,
                        'tipo_movimiento' => 'DEBITO', // El negocio queda debiendo al proveedor.
                        'compra_id'       => $compra->id,
                    ]);

                    // Incrementamos el saldo adeudado al proveedor de forma atómica.
                    $proveedor->increment('saldo_adeudado', $total);
                }

                // Retornamos la compra creada para usarla fuera de la transacción.
                return $compra;
            });

            // Cargamos las relaciones para construir la respuesta JSON completa.
            // Incluimos el saldo_adeudado del proveedor para que el frontend lo muestre actualizado.
            $compra->load([
                'user:id,name',
                'proveedor:id,razon_social,saldo_adeudado',
                'detalles.producto:id,nombre,codigo_barra,stock_actual,precio_compra',
            ]);

            // Registramos la acción en el log de auditoría.
            $this->auditoriaService->registrar(
                AccionAuditoria::REGISTRAR_COMPRA,
                "Compra #{$compra->id} a {$compra->proveedor->razon_social} por $ {$compra->total} ({$compra->tipo_pago})."
            );

            // Respuesta exitosa 201 Created.
            return response()->json([
                'message' => 'Compra registrada correctamente.',
                'compra'  => new CompraResource($compra), // Formateamos la respuesta con el Resource.
            ], 201);

        } catch (DomainException $e) {
            // Capturamos errores de reglas de negocio (caja cerrada, proveedor inactivo, etc.).
            // Son errores esperados, no bugs, por eso devolvemos 422 y no reportamos al log.
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);

        } catch (QueryException $e) {
            // Capturamos errores de SQL, específicamente duplicados de comprobante.
            // El código 23000 es el código SQLSTATE estándar para violación de restricción de unicidad.
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'message' => "Ya existe una compra registrada con el comprobante '{$request->numero_comprobante}' para este proveedor.",
                ], 422);
            }

            // Si es otro error de BD (no duplicado), lo reportamos y damos respuesta genérica.
            report($e);
            return response()->json([
                'message' => 'Error de base de datos al registrar la compra.',
            ], 500);

        } catch (Throwable $e) {
            // Capturamos cualquier otro error inesperado (excepciones no previstas, errores PHP, etc.).
            report($e); // Enviamos al sistema de logging para que el equipo pueda investigarlo.
            return response()->json([
                'message' => 'Error interno al registrar la compra.',
            ], 500);
        }
    }

    /**
     * GET /api/compras
     * Devuelve el listado paginado de compras, ordenadas de la más reciente a la más antigua.
     * La paginación reduce la carga en la BD y el tiempo de respuesta cuando hay muchos registros.
     */
    public function index(Request $request): JsonResponse
    {
        $compras = Compra::with([
            // Eager loading: cargamos relaciones en una sola query adicional (evita N+1 queries).
            'user:id,name',
            'proveedor:id,razon_social',
            'detalles.producto:id,nombre',
        ])
        ->orderBy('id', 'desc') // La compra más reciente aparece primero.
        // paginate() divide los resultados en páginas. Por defecto 15 por página,
        // pero el cliente puede pedir otra cantidad con el parámetro ?per_page=N.
        ->paginate($request->integer('per_page', 15));

        return response()->json([
            // ->response()->getData(true) extrae los metadatos de paginación de Laravel
            // (current_page, last_page, total, etc.) junto con los datos en un solo array.
            'compras' => CompraResource::collection($compras)->response()->getData(true),
        ]);
    }

    /**
     * GET /api/compras/{id}
     * Devuelve el detalle completo de una compra específica por su ID.
     * A diferencia de VentaController::show(), aquí buscamos manualmente con find()
     * y manejamos el 404 de forma explícita (sin Route Model Binding automático).
     */
    public function show($id): JsonResponse
    {
        // Buscamos la compra con todas sus relaciones cargadas.
        // Incluimos movimientoCuentaCorriente para mostrar si generó deuda con el proveedor.
        $compra = Compra::with([
            'user:id,name',
            'proveedor',                        // Cargamos el proveedor completo para el detalle.
            'detalles.producto',                // Productos con todos sus datos.
            'movimientoCuentaCorriente',        // Movimiento de cuenta corriente generado (si existe).
        ])->find($id); // find() devuelve null si no existe (no lanza excepción como findOrFail)

        // Si la compra no existe, devolvemos 404 Not Found con mensaje claro.
        if (! $compra) {
            return response()->json([
                'message' => 'Compra no encontrada.',
            ], 404);
        }

        return response()->json([
            'compra' => new CompraResource($compra), // Formateamos la respuesta con el Resource.
        ]);
    }
}
