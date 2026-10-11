<?php

namespace App\Http\Controllers;

use App\Exceptions\StockInsuficienteException;
use App\Http\Requests\StoreVentaContadoRequest;
use App\Http\Requests\StoreVentaCreditoRequest;
use App\Http\Resources\VentaResource;
use App\Models\Caja;
use App\Models\Cliente;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteCliente;
use App\Models\Venta;
use App\Services\VentaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Throwable;

class VentaController extends Controller
{
    public function __construct(
        protected VentaService $ventaService
    ) {}

    /**
     * POST /api/ventas/contado
     *
     * Registra una venta de contado en una transacción atómica delegando la
     * preparación de ítems y persistencia común en VentaService.
     */
    public function storeContado(StoreVentaContadoRequest $request): JsonResponse
    {
        // 1. Verificar caja abierta antes de iniciar la transacción
        $caja = Caja::abierta()->first();

        if (! $caja) {
            return response()->json([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ], 422);
        }

        try {
            $venta = DB::transaction(function () use ($request, $caja) {
                // Preparar items (bloqueo lockForUpdate, validación de stock y cálculo de total)
                $preparacion = $this->ventaService->prepararItems($request->items);

                // Crear cabecera y detalles de venta, decrementar stock y generar alertas
                $cabecera = [
                    'user_id'    => $request->user()->id,
                    'cliente_id' => $request->cliente_id ?? null,
                    'total'      => $preparacion['total'],
                    'tipo_venta' => 'CONTADO',
                    'medio_pago' => $request->medio_pago,
                    'estado'     => 'COMPLETADA',
                ];

                $venta = $this->ventaService->registrarVenta($cabecera, $preparacion['productos']);

                // Movimiento de caja solo si pagó en efectivo
                if ($request->medio_pago === 'EFECTIVO') {
                    MovimientoCaja::create([
                        'caja_id'  => $caja->id,
                        'monto'    => $preparacion['total'],
                        'tipo'     => 'INGRESO_VENTA',
                        'concepto' => "Venta #" . $venta->id,
                        'venta_id' => $venta->id,
                    ]);
                }

                return $venta;
            });

            // Cargar relaciones para la respuesta
            $venta->load([
                'user:id,name',
                'cliente:id,nombre,apellido',
                'detalles.producto:id,nombre,codigo_barra',
            ]);

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
     *
     * Registra una venta a crédito (fiado) en una transacción atómica.
     * Valida cliente y stock, genera débito en CC y actualiza deuda sin tocar caja.
     */
    public function storeCredito(StoreVentaCreditoRequest $request): JsonResponse
    {
        // 1. Verificar caja abierta antes de iniciar la transacción
        $caja = Caja::abierta()->first();

        if (! $caja) {
            return response()->json([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ], 422);
        }

        try {
            $venta = DB::transaction(function () use ($request) {
                // 2. Obtener y bloquear cliente
                $cliente = Cliente::lockForUpdate()->findOrFail($request->cliente_id);

                // Preparar items (bloqueo lockForUpdate, validación de stock y cálculo de total)
                $preparacion = $this->ventaService->prepararItems($request->items);

                // Crear cabecera y detalles de venta, decrementar stock y generar alertas
                $cabecera = [
                    'user_id'    => $request->user()->id,
                    'cliente_id' => $cliente->id,
                    'total'      => $preparacion['total'],
                    'tipo_venta' => 'CUENTA_CORRIENTE',
                    'medio_pago' => 'CREDITO',
                    'estado'     => 'COMPLETADA',
                ];

                $venta = $this->ventaService->registrarVenta($cabecera, $preparacion['productos']);

                // Generar movimiento de cuenta corriente (DÉBITO = suma deuda al cliente)
                MovimientoCuentaCorrienteCliente::create([
                    'cliente_id'       => $cliente->id,
                    'monto'            => $preparacion['total'],
                    'tipo_movimiento'  => 'DEBITO',
                    'venta_id'         => $venta->id,
                    'cobro_cliente_id' => null,
                ]);

                // Incrementar el saldo pendiente en la cuenta corriente del cliente
                $cliente->increment('saldo_cuenta_corriente', $preparacion['total']);

                return $venta;
            });

            // Cargar relaciones para la respuesta
            $venta->load([
                'user:id,name',
                'cliente:id,nombre,apellido,saldo_cuenta_corriente',
                'detalles.producto:id,nombre,codigo_barra',
                'movimientoCuentaCorriente',
            ]);

            return response()->json([
                'message' => 'Venta a crédito registrada correctamente.',
                'venta'   => new VentaResource($venta),
            ], 201);

        } catch (StockInsuficienteException $e) {
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

    public function index(Request $request): JsonResponse
    {
        $ventas = Venta::orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data'    => VentaResource::collection($ventas),
        ]);
    }

    public function show(Venta $venta): JsonResponse
    {
        $venta->load([
            'user:id,name',
            'cliente:id,nombre,apellido',
            'detalles.producto:id,nombre,codigo_barra',
        ]);

        return response()->json([
            'success' => true,
            'data'    => new VentaResource($venta),
        ]);
    }
}
