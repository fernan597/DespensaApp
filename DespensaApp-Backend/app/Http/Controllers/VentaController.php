<?php

namespace App\Http\Controllers;

use App\Enums\AccionAuditoria;
use App\Exceptions\StockInsuficienteException;
use App\Http\Requests\StoreVentaContadoRequest;
use App\Http\Requests\StoreVentaCreditoRequest;
use App\Http\Resources\VentaResource;
use App\Models\Caja;
use App\Models\Cliente;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteCliente;
use App\Models\Venta;
use App\Services\AuditoriaService;
use App\Services\VentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class VentaController extends Controller
{
    /**
     * Constructor con inyección de dependencias.
     * Laravel resuelve automáticamente estas clases del contenedor de servicios (IoC Container).
     * Usamos 'protected' para que las propiedades sean accesibles en todos los métodos de esta clase.
     */
    public function __construct(
        protected VentaService $ventaService,         // Servicio con la lógica de ventas.
        protected AuditoriaService $auditoriaService  // Servicio para registrar auditoría de acciones.
    ) {}

    /**
     * POST /api/ventas/contado
     * Registra una venta al contado: descuenta stock, registra el movimiento en caja (si es efectivo)
     * y guarda la venta en la base de datos, todo dentro de una transacción atómica.
     */
    public function storeContado(StoreVentaContadoRequest $request): JsonResponse
    {
        // Buscamos si existe una caja abierta actualmente.
        // El scope 'abierta()' filtra las cajas cuyo estado es 'ABIERTA'.
        // Usamos ->first() porque solo puede haber una caja abierta a la vez.
        $caja = Caja::abierta()->first();

        // Si no hay caja abierta, no podemos registrar movimientos de dinero.
        // Devolvemos un error 422 (Unprocessable Entity) con un mensaje claro para el frontend.
        if (! $caja) {
            return response()->json([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ], 422);
        }

        try {
            // DB::transaction() garantiza que TODAS las operaciones dentro del bloque
            // se ejecuten de forma atómica: si algo falla, TODO se revierte (rollback).
            // Esto evita inconsistencias como descontar stock sin registrar la venta.
            $venta = DB::transaction(function () use ($request, $caja) {

                // Preparamos los items del request: validamos stock, calculamos subtotales y total.
                // Devuelve un array con 'total' y 'productos' (con datos listos para guardar).
                $preparacion = $this->ventaService->prepararItems($request->items);

                // Armamos el array de cabecera de la venta con los datos principales.
                $cabecera = [
                    'user_id'    => $request->user()->id,      // ID del usuario autenticado (vendedor).
                    'cliente_id' => $request->cliente_id ?? null, // Cliente opcional en ventas de contado.
                    'total'      => $preparacion['total'],      // Total calculado por el servicio.
                    'tipo_venta' => 'CONTADO',                  // Marcamos el tipo de venta.
                    'medio_pago' => $request->medio_pago,       // EFECTIVO, TARJETA, etc.
                    'estado'     => 'COMPLETADA',               // La venta queda completada inmediatamente.
                ];

                // Llamamos al servicio para persistir la venta y sus detalles en la base de datos.
                // También descuenta el stock de cada producto internamente.
                $venta = $this->ventaService->registrarVenta($cabecera, $preparacion['productos']);

                // Solo registramos movimiento en caja si el medio de pago es EFECTIVO,
                // ya que las tarjetas u otros medios no afectan el efectivo físico de la caja.
                if ($request->medio_pago === 'EFECTIVO') {
                    MovimientoCaja::create([
                        'caja_id'  => $caja->id,              // Asociamos el movimiento a la caja abierta.
                        'monto'    => $preparacion['total'],   // Monto que ingresa a la caja.
                        'tipo'     => 'INGRESO_VENTA',         // Tipo de movimiento para clasificar.
                        'concepto' => "Venta #" . $venta->id, // Descripción legible del movimiento.
                        'venta_id' => $venta->id,             // Referencia a la venta para trazabilidad.
                    ]);
                }

                // Retornamos la venta creada para usarla fuera de la transacción.
                return $venta;
            });

            // Cargamos las relaciones necesarias para la respuesta JSON (eager loading).
            // El formato 'relacion:columnas' evita traer columnas innecesarias (optimización).
            $venta->load([
                'user:id,name',                               // Datos básicos del vendedor.
                'cliente:id,nombre,apellido',                 // Datos básicos del cliente (si existe).
                'detalles.producto:id,nombre,codigo_barra',   // Detalles de cada producto vendido.
            ]);

            // Registramos la acción en el log de auditoría para trazabilidad.
            // Esto permite saber quién hizo qué y cuándo en el sistema.
            $this->auditoriaService->registrar(
                AccionAuditoria::VENTA_CONTADO,
                "Venta #{$venta->id} de contado por $ {$venta->total} ({$venta->medio_pago})."
            );

            return response()->json([
                'message' => 'Venta registrada correctamente.',
                'venta'   => new VentaResource($venta),
            ], 201);

        } catch (StockInsuficienteException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);

        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Ocurrió un error interno al registrar la venta.',
            ], 500);
        }
    }

    /**
     * POST /api/ventas/credito
     * Registra una venta a crédito (cuenta corriente): descuenta stock,
     * registra el débito en la cuenta corriente del cliente y actualiza su saldo.
     * No requiere pago inmediato ni movimiento de caja.
     */
    public function storeCredito(StoreVentaCreditoRequest $request): JsonResponse
    {
        // También verificamos que haya caja abierta para ventas a crédito.
        // Aunque no mueve efectivo, es una política del negocio operar con caja abierta.
        $caja = Caja::abierta()->first();

        if (! $caja) {
            return response()->json([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ], 422);
        }

        try {
            // Iniciamos la transacción: todo debe guardarse junto o nada se guarda.
            $venta = DB::transaction(function () use ($request) {

                // Bloqueamos el registro del cliente con lockForUpdate() para evitar
                // condiciones de carrera: si dos ventas al mismo cliente corren en paralelo,
                // una espera a que la otra termine antes de leer/modificar el saldo.
                $cliente = Cliente::lockForUpdate()->findOrFail($request->cliente_id);

                // Preparamos los items igual que en contado: validación de stock y cálculo de totales.
                $preparacion = $this->ventaService->prepararItems($request->items);

                // Cabecera de la venta a crédito.
                $cabecera = [
                    'user_id'    => $request->user()->id,
                    'cliente_id' => $cliente->id,          // El cliente es obligatorio en ventas a crédito.
                    'total'      => $preparacion['total'],
                    'tipo_venta' => 'CUENTA_CORRIENTE',    // Distinguimos este tipo de venta.
                    'medio_pago' => 'CREDITO',             // No hay pago inmediato.
                    'estado'     => 'COMPLETADA',
                ];

                // Registramos la venta y descontamos stock.
                $venta = $this->ventaService->registrarVenta($cabecera, $preparacion['productos']);

                // Creamos el movimiento en la cuenta corriente del cliente.
                // DEBITO significa que el cliente nos debe ese monto (incrementa su deuda).
                MovimientoCuentaCorrienteCliente::create([
                    'cliente_id'       => $cliente->id,
                    'monto'            => $preparacion['total'],
                    'tipo_movimiento'  => 'DEBITO',    // El cliente queda debiendo.
                    'venta_id'         => $venta->id,  // Referencia a la venta para trazabilidad.
                    'cobro_cliente_id' => null,        // Aún no hay cobro asociado.
                ]);

                // Incrementamos el saldo de cuenta corriente del cliente.
                // increment() hace un UPDATE atómico en la BD: evita leer-modificar-escribir en PHP
                // y es más seguro en entornos con múltiples requests simultáneos.
                $cliente->increment('saldo_cuenta_corriente', $preparacion['total']);

                return $venta;
            });

            // Cargamos relaciones para la respuesta, incluyendo el saldo actualizado del cliente.
            $venta->load([
                'user:id,name',
                'cliente:id,nombre,apellido,saldo_cuenta_corriente', // Incluimos el saldo para mostrarlo.
                'detalles.producto:id,nombre,codigo_barra',
                'movimientoCuentaCorriente',                          // El movimiento que acabamos de crear.
            ]);

            // Preparamos el nombre completo del cliente para el mensaje de auditoría.
            // El operador ternario maneja el caso improbable de que no haya cliente cargado.
            $clienteNombre = $venta->cliente
                ? "{$venta->cliente->nombre} {$venta->cliente->apellido}"
                : 'cliente sin identificar';

            // Registramos la acción en auditoría.
            $this->auditoriaService->registrar(
                AccionAuditoria::VENTA_CREDITO,
                "Venta #{$venta->id} a crédito de {$clienteNombre} por $ {$venta->total}."
            );

            return response()->json([
                'message' => 'Venta a crédito registrada correctamente.',
                'venta'   => new VentaResource($venta),
            ], 201);

        } catch (StockInsuficienteException $e) {
            // Error de negocio: stock insuficiente. No es un error del servidor.
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);

        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Ocurrió un error interno al registrar la venta a crédito.',
            ], 500);
        }
    }

    /**
     * GET /api/ventas
     * Devuelve el listado completo de ventas, ordenadas de la más reciente a la más antigua.
     */
    public function index(Request $request): JsonResponse
    {
        // Obtenemos todas las ventas ordenadas por ID descendente (la más nueva primero).
        $ventas = Venta::orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data'    => VentaResource::collection($ventas),
        ]);
    }

    /**
     * GET /api/ventas/{venta}
     * Devuelve el detalle de una venta específica.
     * Laravel resuelve automáticamente el modelo Venta por su ID (Route Model Binding).
     */
    public function show(Venta $venta): JsonResponse
    {
        // Cargamos las relaciones necesarias para mostrar el detalle completo de la venta.
        $venta->load([
            'user:id,name',                             // Quién realizó la venta.
            'cliente:id,nombre,apellido',               // Datos del cliente (si existe).
            'detalles.producto:id,nombre,codigo_barra', // Productos incluidos en la venta.
        ]);

        return response()->json([
            'success' => true,
            'data'    => new VentaResource($venta),
        ]);
    }
}
