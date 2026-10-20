<?php

namespace App\Services;

use App\Enums\MedioPago;
use App\Enums\TipoMovimientoCaja;
use App\Enums\TipoMovimientoCuentaCorriente;
use App\Exceptions\FondosInsuficientesException;
use App\Exceptions\PagoProveedorException;
use App\Models\Caja;
use App\Models\PagoProveedor;
use App\Models\Proveedor;
use Illuminate\Support\Facades\DB;

class PagoProveedorService
{
    /**
     * Registra un pago a proveedor para cancelar parte o la totalidad de la deuda pendiente.
     *
     * Ejecuta toda la lógica atómicamente dentro de DB::transaction adquiriendo locks
     * en orden consistente (Proveedor -> Caja) para evitar deadlocks y race conditions.
     *
     * @param int $proveedorId
     * @param int $userId
     * @param string $monto Formateado como string decimal (e.g. "2000.00") para cálculo con BCMath
     * @param MedioPago $medioPago
     * @return array{pago: PagoProveedor, proveedor: Proveedor}
     *
     * @throws PagoProveedorException
     * @throws FondosInsuficientesException
     */
    public function registrarPago(
        int $proveedorId,
        int $userId,
        string $monto,
        MedioPago $medioPago
    ): array {
        // 1. Validar monto positivo
        if (bccomp($monto, '0.00', 2) <= 0) {
            throw new PagoProveedorException('El monto a pagar debe ser mayor a 0.');
        }

        return DB::transaction(function () use ($proveedorId, $userId, $monto, $medioPago) {


            // 2. Bloquear primero el proveedor (orden consistente de locks)
            /** @var Proveedor $proveedor */
            $proveedor = Proveedor::lockForUpdate()->findOrFail($proveedorId);

            // Validar que el proveedor posea saldo adeudado pendiente
            $saldoActual = $proveedor->saldo_adeudado;
            if (bccomp($saldoActual, '0.00', 2) <= 0) {
                throw new PagoProveedorException(
                    "El proveedor '{$proveedor->razon_social}' no registra saldo adeudado pendiente de pago."
                );
            }

            // Validar que el monto no exceda la deuda acumulada
            if (bccomp($monto, $saldoActual, 2) === 1) {
                throw new PagoProveedorException(
                    "El monto a pagar ($ {$monto}) no puede superar el saldo pendiente actual ($ {$saldoActual})."
                );
            }

            // 2. Si el medio de pago es efectivo, bloquear la caja activa y validar fondos disponibles
            $caja = null;
            if ($medioPago === MedioPago::EFECTIVO) {
                /** @var Caja|null $caja */
                $caja = Caja::lockForUpdate()->abierta()->first();

                if (!$caja) {
                    throw new PagoProveedorException(
                        'No hay una caja abierta para registrar el pago en efectivo. Debe abrir una caja primero.'
                    );
                }

                $saldoDisponible = $caja->saldoEsperado();
                if (bccomp($monto, $saldoDisponible, 2) === 1) {
                    throw new FondosInsuficientesException(
                        'Fondos insuficientes en la caja activa para registrar el pago en efectivo.',
                        [
                            'saldo_disponible' =>  $saldoDisponible,
                            'monto_solicitado' =>  $monto,
                        ]
                    );
                }
            }

            // 3. Crear cabecera de PagoProveedor mediante la relación del proveedor
            /** @var PagoProveedor $pago */
            $pago = $proveedor->pagos()->create([
                'user_id'    => $userId,
                'monto'      => $monto,
                'medio_pago' => $medioPago,
            ]);

            // 4. Asentar movimiento en la cuenta corriente mediante la relación del pago
            $pago->movimientoCuentaCorriente()->create([
                'proveedor_id'    => $proveedor->id,
                'monto'           => $monto,
                'tipo_movimiento' => TipoMovimientoCuentaCorriente::CREDITO,
            ]);

            // 5. Decrementar el saldo adeudado del proveedor
            $proveedor->decrement('saldo_adeudado', $monto);
            $proveedor->refresh();

            // 6. Si es efectivo, registrar egreso en la caja mediante la relación de la caja
            if ($medioPago === MedioPago::EFECTIVO && $caja) {
                $caja->movimientos()->create([
                    'monto'             => $monto,
                    'tipo'              => TipoMovimientoCaja::EGRESO_PAGO_PROVEEDOR,
                    'concepto'          => "Pago a proveedor #{$pago->id} ({$proveedor->razon_social})",
                    'pago_proveedor_id' => $pago->id,
                ]);
            }

            return [
                'pago'      => $pago,
                'proveedor' => $proveedor,
            ];
        });
    }
}
