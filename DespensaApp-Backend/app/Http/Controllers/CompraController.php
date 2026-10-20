<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCompraRequest;
use App\Http\Resources\CompraResource;
use App\Models\Caja;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\Product;
use App\Models\Proveedor;
use DomainException;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class CompraController extends Controller
{
    /**
     * POST /api/compras
     *
     * Registra una compra de mercadería a un proveedor en una transacción atómica.
     *
     * Flujo dentro de la transacción:
     *  1. Bloquea filas de productos involucrados en orden por ID para prevenir deadlocks.
     *  2. Si es CONTADO: verifica y bloquea la caja activa con lockForUpdate().
     *  3. Valida y bloquea al proveedor.
     *  4. Crea la cabecera de la Compra (incluyendo numero_comprobante).
     *  5. Crea los DetallesCompra, incrementa el stock_actual y actualiza precio_compra en una sola consulta.
     *  6. Si es CONTADO: genera un MovimientoCaja de tipo EGRESO_PAGO_PROVEEDOR vinculado a compra_id.
     *  7. Si es CRÉDITO / CUENTA_CORRIENTE: genera un MovimientoCuentaCorrienteProveedor (DEBITO)
     *     e incrementa el saldo_adeudado del proveedor.
     */
    public function store(StoreCompraRequest $request): JsonResponse
    {
        $tipoPagoInput = strtoupper($request->tipo_pago);
        $esContado = ($tipoPagoInput === 'CONTADO');

        try {
            $compra = DB::transaction(function () use ($request, $esContado) {
                // 1. Si es pago contado, verificar y bloquear la caja abierta dentro de la transacción
                $caja = null;
                if ($esContado) {
                    $caja = Caja::abierta()->lockForUpdate()->first();
                    if (! $caja) {
                        throw new DomainException(
                            'No hay caja abierta para registrar el egreso de una compra de contado. Abra la caja primero.'
                        );
                    }
                }

                // 2. Bloquear proveedor dentro de la transacción
                $proveedor = Proveedor::lockForUpdate()->findOrFail($request->proveedor_id);
                if (isset($proveedor->activo) && ! $proveedor->activo) {
                    throw new DomainException(
                        'El proveedor seleccionado se encuentra inactivo y no puede recibir compras.'
                    );
                }

                // 3. Obtener y bloquear todos los productos en una sola consulta ordenados por ID (previene deadlocks)
                $items = $request->items;
                $productIds = collect($items)->pluck('producto_id')->sort()->values()->all();
                $productosDb = Product::whereIn('id', $productIds)
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get()
                    ->keyBy('id');

                $total = 0;
                $productosProcesados = [];

                foreach ($items as $item) {
                    $productoId = $item['producto_id'];
                    $producto = $productosDb->get($productoId);

                    if (! $producto) {
                        throw new DomainException("El producto con ID {$productoId} no fue encontrado.");
                    }

                    $cantidad = (int) $item['cantidad'];
                    $costoUnitario = (float) $item['costo_unitario'];
                    $subtotal = round($cantidad * $costoUnitario, 2);

                    $total += $subtotal;

                    $productosProcesados[] = [
                        'modelo'         => $producto,
                        'cantidad'       => $cantidad,
                        'costo_unitario' => $costoUnitario,
                        'subtotal'       => $subtotal,
                    ];
                }

                $total = round($total, 2);
                $tipoPagoDb = $esContado ? 'CONTADO' : 'CUENTA_CORRIENTE';
                $numeroComprobante = ! empty($request->numero_comprobante)
                    ? trim($request->numero_comprobante)
                    : null;

                // 4. Crear cabecera de la compra
                $compra = Compra::create([
                    'user_id'            => $request->user()->id,
                    'proveedor_id'       => $proveedor->id,
                    'numero_comprobante' => $numeroComprobante,
                    'total'              => $total,
                    'tipo_pago'          => $tipoPagoDb,
                    'pendiente_pago'     => ! $esContado,
                    'estado'             => 'RECIBIDA',
                ]);

                // 5. Crear detalles, incrementar stock y actualizar costo de adquisición en una sola operación por producto
                foreach ($productosProcesados as $proc) {
                    $producto = $proc['modelo'];
                    $cantidad = $proc['cantidad'];
                    $costoUnitario = $proc['costo_unitario'];
                    $subtotal = $proc['subtotal'];

                    DetalleCompra::create([
                        'compra_id'         => $compra->id,
                        'product_id'        => $producto->id,
                        'cantidad'          => $cantidad,
                        'costo_adquisicion' => $costoUnitario,
                        'subtotal'          => $subtotal,
                    ]);

                    // Incremento atómico de stock y actualización de costo en un solo UPDATE
                    $producto->increment('stock_actual', $cantidad, [
                        'precio_compra' => $costoUnitario,
                    ]);
                }

                // 6. Manejo según tipo de pago
                if ($esContado) {
                    // Egreso en la caja activa con enlace directo a la compra
                    MovimientoCaja::create([
                        'caja_id'   => $caja->id,
                        'monto'     => $total,
                        'tipo'      => 'EGRESO_PAGO_PROVEEDOR',
                        'concepto'  => "Compra de mercadería #{$compra->id}" . ($numeroComprobante ? " (Comp: {$numeroComprobante})" : "") . " - Proveedor: {$proveedor->razon_social}",
                        'compra_id' => $compra->id,
                    ]);
                } else {
                    // Débito en cuenta corriente del proveedor (genera deuda con el proveedor)
                    MovimientoCuentaCorrienteProveedor::create([
                        'proveedor_id'    => $proveedor->id,
                        'monto'           => $total,
                        'tipo_movimiento' => 'DEBITO',
                        'compra_id'       => $compra->id,
                    ]);

                    // Aumentar saldo adeudado del proveedor de forma atómica
                    $proveedor->increment('saldo_adeudado', $total);
                }

                return $compra;
            });

            // Cargar relaciones para la respuesta
            $compra->load([
                'user:id,name',
                'proveedor:id,razon_social,saldo_adeudado',
                'detalles.producto:id,nombre,codigo_barra,stock_actual,precio_compra',
            ]);

            return response()->json([
                'message' => 'Compra registrada correctamente.',
                'compra'  => new CompraResource($compra),
            ], 201);

        } catch (DomainException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        } catch (QueryException $e) {
            // Manejo de violación de clave única en numero_comprobante
            if ($e->getCode() == 23000 || str_contains($e->getMessage(), 'Duplicate entry')) {
                return response()->json([
                    'message' => "Ya existe una compra registrada con el comprobante '{$request->numero_comprobante}' para este proveedor.",
                ], 422);
            }

            report($e);
            return response()->json([
                'message' => 'Error de base de datos al registrar la compra.',
            ], 500);
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Error interno al registrar la compra.',
            ], 500);
        }
    }

    /**
     * GET /api/compras
     *
     * Listado histórico de compras.
     */
    public function index(Request $request): JsonResponse
    {
        $compras = Compra::with([
            'user:id,name',
            'proveedor:id,razon_social',
            'detalles.producto:id,nombre',
        ])
        ->orderBy('id', 'desc')
        ->paginate($request->integer('per_page', 15));

        return response()->json([
            'compras' => CompraResource::collection($compras)->response()->getData(true),
        ]);
    }

    /**
     * GET /api/compras/{id}
     *
     * Detalle de una compra específica.
     */
    public function show($id): JsonResponse
    {
        $compra = Compra::with([
            'user:id,name',
            'proveedor',
            'detalles.producto',
            'movimientoCuentaCorriente',
        ])->find($id);

        if (! $compra) {
            return response()->json([
                'message' => 'Compra no encontrada.',
            ], 404);
        }

        return response()->json([
            'compra' => new CompraResource($compra),
        ]);
    }
}
