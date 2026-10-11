<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCobroClienteRequest;
use App\Http\Resources\ClienteResource;
use App\Http\Resources\CobroClienteResource;
use App\Models\Caja;
use App\Models\Cliente;
use App\Models\CobroCliente;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteCliente;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CobroClienteController extends Controller
{
    /**
     * Registra un cobro o entrega de dinero de un cliente para cancelar parte o la totalidad de su deuda (CU12).
     *
     * POST /api/cobros-clientes
     */
    public function store(StoreCobroClienteRequest $request): JsonResponse
    {
        // 1. Si el medio de pago es efectivo, la caja debe estar abierta obligatoriamente
        $caja = null;
        if ($request->medio_pago === 'EFECTIVO') {
            $caja = Caja::abierta()->first();
            if (!$caja) {
                return response()->json([
                    'success' => false,
                    'message' => 'No hay una caja abierta para registrar el cobro en efectivo. Debe abrir una caja primero.',
                ], 422);
            }
        }

        try {
            return DB::transaction(function () use ($request, $caja) {
                // 2. Bloquear fila del cliente para prevenir condiciones de carrera
                /** @var Cliente $cliente */
                $cliente = Cliente::lockForUpdate()->find($request->cliente_id);

                if (!$cliente) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Cliente no encontrado.',
                    ], 404);
                }

                $saldoActual = (float) $cliente->saldo_cuenta_corriente;

                // 3. Validar que el cliente tenga saldo deudor
                if ($saldoActual <= 0) {
                    return response()->json([
                        'success' => false,
                        'message' => "El cliente '{$cliente->nombre} {$cliente->apellido}' no registra saldo adeudado pendiente de cobro.",
                    ], 422);
                }

                $monto = round((float) $request->monto, 2);

                // 4. Validar que el monto no exceda la deuda acumulada
                if ($monto > $saldoActual) {
                    return response()->json([
                        'success' => false,
                        'message' => "El monto a cobrar ($ {$monto}) no puede superar el saldo pendiente actual ($ {$saldoActual}).",
                    ], 422);
                }

                // 5. Crear cabecera del CobroCliente
                $cobro = CobroCliente::create([
                    'cliente_id' => $cliente->id,
                    'user_id'    => $request->user()->id,
                    'monto'      => $monto,
                    'medio_pago' => $request->medio_pago,
                ]);

                // 6. Registrar movimiento contable en la Cuenta Corriente (CRÉDITO que descuenta deuda)
                MovimientoCuentaCorrienteCliente::create([
                    'cliente_id'       => $cliente->id,
                    'monto'            => $monto,
                    'tipo_movimiento'  => 'CREDITO',
                    'cobro_cliente_id' => $cobro->id,
                ]);

                // 7. Actualizar el saldo pendiente del cliente
                $cliente->decrement('saldo_cuenta_corriente', $monto);
                $cliente->refresh();

                // 8. Si es en efectivo, registrar ingreso en la caja activa del turno
                if ($request->medio_pago === 'EFECTIVO' && $caja) {
                    MovimientoCaja::create([
                        'caja_id'          => $caja->id,
                        'monto'            => $monto,
                        'tipo'             => 'INGRESO_COBRO_CLIENTE',
                        'concepto'         => "Cobro a cliente #{$cobro->id} ({$cliente->nombre} {$cliente->apellido})",
                        'cobro_cliente_id' => $cobro->id,
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Cobro registrado exitosamente.',
                    'data'    => [
                        'cobro'   => new CobroClienteResource($cobro),
                        'cliente' => new ClienteResource($cliente),
                    ],
                ], 201);
            });
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado al procesar el cobro. Por favor, intente nuevamente.',
            ], 500);
        }
    }
}
