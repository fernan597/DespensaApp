<?php

namespace App\Services;

use App\Enums\TipoMovimientoCaja;
use App\Exceptions\CajaCerradaException;
use App\Exceptions\FondosInsuficientesException;
use App\Models\Caja;
use App\Models\MovimientoCaja;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class MovimientoCajaService
{
    /**
     * Registra un movimiento manual de entrada o salida de efectivo en la caja activa.
     *
     * Se ejecuta dentro de una transacción atómica adquiriendo bloqueo pesimista
     * en la caja para evitar condiciones de carrera en el cálculo de saldos.
     *
     * @param int $userId
     * @param string $monto Formateado como string decimal (ej. "500.00") para cálculo con BCMath
     * @param string $tipo "INGRESO" o "EGRESO"
     * @param string $concepto Detalle descriptivo obligatorio
     * @return array{movimiento: MovimientoCaja, caja: Caja}
     *
     * @throws CajaCerradaException
     * @throws FondosInsuficientesException
     * @throws InvalidArgumentException
     */
    public function registrarMovimientoManual(
        int $userId,
        string $monto,
        string $tipo,
        string $concepto
    ): array {
        // 1. Validar que el monto sea estrictamente mayor a 0 con BCMath
        if (bccomp($monto, '0.00', 2) <= 0) {
            throw new InvalidArgumentException('El monto del movimiento debe ser mayor a 0.');
        }

        return DB::transaction(function () use ($userId, $monto, $tipo, $concepto) {
            // 2. Bloquear la caja activa con lockForUpdate
            /** @var Caja|null $caja */
            $caja = Caja::lockForUpdate()->abierta()->first();

            if (!$caja) {
                throw new CajaCerradaException(
                    'No hay una caja abierta para registrar movimientos. Debe abrir una caja primero.'
                );
            }

            // 3. Mapear al enum tipado correspondiente
            $tipoUpper = strtoupper(trim($tipo));
            $esIngreso = in_array($tipoUpper, ['INGRESO', 'INGRESO_MANUAL'], true);
            $tipoEnum = $esIngreso ? TipoMovimientoCaja::INGRESO_MANUAL : TipoMovimientoCaja::EGRESO_MANUAL;

            // 4. Si es egreso, validar que existan fondos suficientes en la caja activa
            if (!$esIngreso) {
                $saldoDisponible = $caja->saldoEsperado();

                if (bccomp($monto, $saldoDisponible, 2) === 1) {
                    throw new FondosInsuficientesException(
                        "Fondos insuficientes en la caja activa para registrar el egreso de $ {$monto}. Saldo actual disponible: $ {$saldoDisponible}.",
                        [
                            'saldo_disponible' =>  $saldoDisponible,
                            'monto_solicitado' =>  $monto,
                        ]
                    );
                }
            }

            // 5. Persistir el movimiento a través de la relación de la caja
            /** @var MovimientoCaja $movimiento */
            $movimiento = $caja->movimientos()->create([
                'user_id'  => $userId,
                'monto'    => $monto,
                'tipo'     => $tipoEnum,
                'concepto' => trim($concepto),
            ]);

            // Cargar relación de usuario para respuesta
            $movimiento->load('user:id,name');

            return [
                'movimiento' => $movimiento,
                'caja'       => $caja,
            ];
        });
    }
}
