<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;

class CuentaCorrienteService
{
    /**
     * Calcula los indicadores clave (KPIs) de un conjunto de entidades
     * (clientes o proveedores) basándose en una columna de saldo.
     *
     * @param iterable $entidades   Colección de entidades con saldo (Eloquent Collection, array, etc.)
     * @param string   $columnaSaldo Nombre del atributo que representa el saldo de cada entidad
     * @return array   Array con los KPIs calculados
     */
    public function calcularKpis(iterable $entidades, string $columnaSaldo): array
    {
        // Convertimos el iterable a una Collection de Laravel
        // para poder usar sus métodos de alto nivel (sum, where, count, etc.)
        $collection = collect($entidades);

        // Sumamos todos los saldos de la columna indicada y lo casteamos a float
        // para asegurarnos de trabajar con un número decimal y no con una cadena
        $totalDeuda = (float) $collection->sum($columnaSaldo);

        // Contamos cuántas entidades tienen saldo mayor a 0 (es decir, deben dinero)
        $conDeuda = $collection->where($columnaSaldo, '>', 0)->count();

        // Contamos cuántas entidades están al día: saldo en 0 o negativo
        // (un saldo <=0 indica que no hay deuda pendiente)
        $alDia = $collection->where($columnaSaldo, '<=', 0)->count();

        // Retornamos un array asociativo con los KPIs calculados.
        // Redondeamos a 2 decimales para evitar imprecisiones de punto flotante.
        return [
            'total_deuda_global' => round($totalDeuda, 2), // Suma total de deuda en todas las entidades
            'cantidad_con_deuda' => $conDeuda,             // Cuántas entidades deben dinero
            'cantidad_al_dia'    => $alDia,                // Cuántas entidades no tienen deuda
            'total'              => $collection->count(),  // Total de entidades analizadas
        ];
    }

    /**
     * Calcula el saldo de cuenta corriente que una entidad tenía ANTES de una fecha dada.
     * Esto se usa para mostrar el "saldo anterior" en un estado de cuenta filtrado por rango de fechas.
     *
     * @param string       $movimientoModelClass  Nombre completo de la clase del modelo (ej: App\Models\MovimientoCliente)
     * @param string       $foreignKey            Nombre de la clave foránea en la tabla de movimientos (ej: 'cliente_id')
     * @param int|string   $entityId              ID de la entidad (cliente o proveedor)
     * @param string|null  $fechaDesde            Fecha de inicio del filtro; si es null, no hay saldo anterior
     * @return float       Saldo anterior a la fecha indicada
     */
    public function calcularSaldoAnterior(
        string $movimientoModelClass,
        string $foreignKey,
        int|string $entityId,
        ?string $fechaDesde
    ): float {
        // Si no se especificó una fecha de inicio, no tiene sentido calcular saldo anterior.
        // Retornamos 0 directamente para evitar consultas innecesarias a la base de datos.
        if (!$fechaDesde) {
            return 0.00;
        }

        // Sumamos todos los DÉBITOS registrados para esta entidad ANTES de la fecha de inicio.
        // Los débitos aumentan la deuda (el cliente nos debe más).
        $debitosPrevios = (float) $movimientoModelClass::where($foreignKey, $entityId)
            ->where('tipo_movimiento', 'DEBITO')           // Solo movimientos de tipo DÉBITO
            ->whereDate('created_at', '<', $fechaDesde)    // Solo los anteriores a la fecha de inicio
            ->sum('monto');                                 // Suma total de los montos

        // Sumamos todos los CRÉDITOS registrados para esta entidad ANTES de la fecha de inicio.
        // Los créditos reducen la deuda (el cliente pagó o se le hizo un descuento).
        $creditosPrevios = (float) $movimientoModelClass::where($foreignKey, $entityId)
            ->where('tipo_movimiento', 'CREDITO')           // Solo movimientos de tipo CRÉDITO
            ->whereDate('created_at', '<', $fechaDesde)     // Solo los anteriores a la fecha de inicio
            ->sum('monto');                                  // Suma total de los montos

        // El saldo anterior = débitos previos - créditos previos.
        // Si el resultado es positivo, la entidad tenía deuda antes del período consultado.
        // Redondeamos a 2 decimales para consistencia.
        return round($debitosPrevios - $creditosPrevios, 2);
    }

    /**
     * Aplica filtros de fecha (desde / hasta) a una query de Eloquent.
     * Se usa para reutilizar la lógica de filtrado sin repetir código en múltiples lugares.
     *
     * @param Builder     $query      La query de Eloquent a la que se le añadirán los filtros
     * @param string|null $fechaDesde Fecha mínima (inclusive); si es null, no se aplica filtro inferior
     * @param string|null $fechaHasta Fecha máxima (inclusive); si es null, no se aplica filtro superior
     * @return Builder    La misma query con los filtros aplicados (encadenamiento)
     */
    public function aplicarFiltroFechas(Builder $query, ?string $fechaDesde, ?string $fechaHasta): Builder
    {
        // Solo aplicamos el filtro de fecha mínima si el valor fue proporcionado.
        // whereDate compara únicamente la parte de la fecha (ignora la hora), lo que es
        // correcto para filtros de tipo "desde el día X".
        if ($fechaDesde) {
            $query->whereDate('created_at', '>=', $fechaDesde);
        }

        // Solo aplicamos el filtro de fecha máxima si el valor fue proporcionado.
        // Esto permite consultas abiertas hacia el futuro cuando no se especifica fecha final.
        if ($fechaHasta) {
            $query->whereDate('created_at', '<=', $fechaHasta);
        }

        // Retornamos la query modificada para permitir encadenamiento (fluent interface).
        return $query;
    }

    /**
     * Proyecta (calcula) el saldo acumulado sobre una lista de movimientos.
     * Recorre cada movimiento, actualiza el saldo según si es débito o crédito,
     * y formatea el resultado usando una función de callback.
     *
     * @param iterable $movimientos  Lista de movimientos a procesar (Collection o array de modelos Eloquent)
     * @param float    $saldoInicial Saldo de partida (ej: saldo anterior al período)
     * @param callable $formatter    Función que recibe ($movimiento, $saldoAcumulado) y devuelve el array final del ítem
     * @return array  Lista de movimientos formateados con saldo acumulado en cada fila
     */
    public function proyectarMovimientos(iterable $movimientos, float $saldoInicial, callable $formatter): array
    {
        // Inicializamos el saldo acumulado con el valor de partida.
        // Esto permite que el estado de cuenta comience desde el saldo anterior ya calculado.
        $saldoAcumulado = $saldoInicial;

        // Array donde iremos acumulando cada movimiento ya formateado con su saldo.
        $resultado = [];

        // Iteramos sobre cada movimiento de la lista
        foreach ($movimientos as $mov) {
            // Obtenemos el monto del movimiento y lo casteamos a float
            // para asegurar que las operaciones aritméticas sean correctas.
            $monto = (float) $mov->monto;

            // El tipo de movimiento puede ser un BackedEnum de PHP 8.1+
            // (un enum con valor escalar asociado). Si es así, extraemos su valor string
            // con ->value. Si no, lo convertimos directamente a string.
            // Esto hace el código compatible con ambas formas de almacenar el tipo.
            $tipoMovimiento = $mov->tipo_movimiento instanceof \BackedEnum
                ? $mov->tipo_movimiento->value
                : (string) $mov->tipo_movimiento;

            // Si el movimiento es un DÉBITO, aumentamos la deuda (sumamos al saldo acumulado).
            // La lógica es: el cliente debe más, por lo que el saldo aumenta.
            if ($tipoMovimiento === 'DEBITO') {
                $saldoAcumulado += $monto;
            } else {
                // Si es CRÉDITO, se reduce la deuda (restamos del saldo acumulado).
                // El cliente pagó o se le aplicó un descuento/nota de crédito.
                $saldoAcumulado -= $monto;
            }

            // Usamos el callback $formatter para transformar el movimiento y el saldo acumulado
            // en el formato de salida deseado (el controlador define cómo se ve cada fila).
            // Redondeamos el saldo a 2 decimales antes de pasarlo al formatter.
            $resultado[] = $formatter($mov, round($saldoAcumulado, 2));
        }

        // Retornamos el array con todos los movimientos ya proyectados y formateados.
        return $resultado;
    }
}
