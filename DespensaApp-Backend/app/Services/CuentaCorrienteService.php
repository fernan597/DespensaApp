<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;

class CuentaCorrienteService
{
    /**
     * Calcula los KPIs globales de un conjunto de entidades con saldo pendiente.
     *
     * @param iterable $entidades Colección de modelos (ej. todos los Clientes o todos los Proveedores)
     * @param string $columnaSaldo Nombre de la columna de saldo ('saldo_cuenta_corriente' o 'saldo_adeudado')
     * @return array
     */
    public function calcularKpis(iterable $entidades, string $columnaSaldo): array
    {
        $collection = collect($entidades);
        $totalDeuda = (float) $collection->sum($columnaSaldo);
        $conDeuda = $collection->where($columnaSaldo, '>', 0)->count();
        $alDia = $collection->where($columnaSaldo, '<=', 0)->count();

        return [
            'total_deuda_global' => round($totalDeuda, 2),
            'cantidad_con_deuda' => $conDeuda,
            'cantidad_al_dia'    => $alDia,
            'total'              => $collection->count(),
        ];
    }

    /**
     * Calcula el saldo previo a una fecha determinada para una cuenta corriente.
     *
     * @param string $movimientoModelClass Nombre de clase del modelo (ej: MovimientoCuentaCorrienteCliente::class)
     * @param string $foreignKey Clave foránea (ej: 'cliente_id' o 'proveedor_id')
     * @param int|string $entityId ID de la entidad
     * @param string|null $fechaDesde Fecha inicial del filtro (Y-m-d)
     * @return float
     */
    public function calcularSaldoAnterior(
        string $movimientoModelClass,
        string $foreignKey,
        int|string $entityId,
        ?string $fechaDesde
    ): float {
        if (!$fechaDesde) {
            return 0.00;
        }

        $debitosPrevios = (float) $movimientoModelClass::where($foreignKey, $entityId)
            ->where('tipo_movimiento', 'DEBITO')
            ->whereDate('created_at', '<', $fechaDesde)
            ->sum('monto');

        $creditosPrevios = (float) $movimientoModelClass::where($foreignKey, $entityId)
            ->where('tipo_movimiento', 'CREDITO')
            ->whereDate('created_at', '<', $fechaDesde)
            ->sum('monto');

        return round($debitosPrevios - $creditosPrevios, 2);
    }

    /**
     * Aplica los filtros de fecha_desde y fecha_hasta a una consulta de movimientos.
     *
     * @param Builder $query
     * @param string|null $fechaDesde
     * @param string|null $fechaHasta
     * @return Builder
     */
    public function aplicarFiltroFechas(Builder $query, ?string $fechaDesde, ?string $fechaHasta): Builder
    {
        if ($fechaDesde) {
            $query->whereDate('created_at', '>=', $fechaDesde);
        }

        if ($fechaHasta) {
            $query->whereDate('created_at', '<=', $fechaHasta);
        }

        return $query;
    }

    /**
     * Proyecta el saldo acumulado cronológicamente sobre una lista de movimientos y aplica un formateador callback.
     *
     * @param iterable $movimientos Colección de movimientos ordenados cronológicamente
     * @param float $saldoInicial Saldo previo al inicio del periodo
     * @param callable $formatter Callback function($movimiento, float $saldoAcumuladoActual): array
     * @return array
     */
    public function proyectarMovimientos(iterable $movimientos, float $saldoInicial, callable $formatter): array
    {
        $saldoAcumulado = $saldoInicial;
        $resultado = [];

        foreach ($movimientos as $mov) {
            $monto = (float) $mov->monto;
            $tipoMovimiento = $mov->tipo_movimiento instanceof \BackedEnum
                ? $mov->tipo_movimiento->value
                : (string) $mov->tipo_movimiento;

            if ($tipoMovimiento === 'DEBITO') {
                $saldoAcumulado += $monto;
            } else {
                $saldoAcumulado -= $monto;
            }

            $resultado[] = $formatter($mov, round($saldoAcumulado, 2));
        }

        return $resultado;
    }
}
