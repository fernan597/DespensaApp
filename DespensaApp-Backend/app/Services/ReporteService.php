<?php

namespace App\Services;

use App\Models\DetalleVenta;
use App\Models\Venta;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class ReporteService
{
    /**
     * [CU18] Obtiene el reporte agregado de ventas para un rango de fechas.
     * Incluye resumen del período, serie diaria continua y desglose por medio de pago.
     */
    public function obtenerReporteVentas(Carbon $desde, Carbon $hasta): array
    {
        $inicio = $desde->copy()->startOfDay();
        $fin    = $hasta->copy()->endOfDay();

        $ventas = Venta::query()
            ->where('estado', 'COMPLETADA')
            ->whereBetween('created_at', [$inicio, $fin])
            ->orderBy('created_at', 'asc')
            ->get(['id', 'total', 'tipo_venta', 'medio_pago', 'created_at']);

        // Inicializar serie diaria continua para todos los días del rango
        $periodo = CarbonPeriod::create($desde->copy()->startOfDay(), $hasta->copy()->startOfDay());
        $seriePorFecha = [];

        foreach ($periodo as $dia) {
            $fechaKey = $dia->format('Y-m-d');
            $seriePorFecha[$fechaKey] = [
                'fecha'           => $fechaKey,
                'etiqueta'        => $dia->format('d/m'),
                'total'           => 0.0,
                'contado'         => 0.0,
                'credito'         => 0.0,
                'cantidad_ventas' => 0,
            ];
        }

        $totalFacturado = 0.0;
        $cantidadVentas = 0;
        $totalContado   = 0.0;
        $totalCredito   = 0.0;

        $mediosAccumulator = [
            'EFECTIVO' => ['id' => 'EFECTIVO', 'label' => 'Efectivo en Caja', 'monto' => 0.0, 'cantidad' => 0],
            'OTROS'    => ['id' => 'OTROS',    'label' => 'Transferencia / Tarjeta', 'monto' => 0.0, 'cantidad' => 0],
            'CREDITO'  => ['id' => 'CREDITO',  'label' => 'Cuenta Corriente (Fiado)', 'monto' => 0.0, 'cantidad' => 0],
        ];

        foreach ($ventas as $venta) {
            $monto = round((float) $venta->total, 2);
            $esCredito = ($venta->tipo_venta === 'CUENTA_CORRIENTE' || $venta->medio_pago === 'CREDITO');
            $fechaKey = $venta->created_at ? $venta->created_at->format('Y-m-d') : null;

            $totalFacturado += $monto;
            $cantidadVentas += 1;

            if ($esCredito) {
                $totalCredito += $monto;
                $mediosAccumulator['CREDITO']['monto']    += $monto;
                $mediosAccumulator['CREDITO']['cantidad'] += 1;
            } else {
                $totalContado += $monto;
                if ($venta->medio_pago === 'EFECTIVO') {
                    $mediosAccumulator['EFECTIVO']['monto']    += $monto;
                    $mediosAccumulator['EFECTIVO']['cantidad'] += 1;
                } else {
                    $mediosAccumulator['OTROS']['monto']    += $monto;
                    $mediosAccumulator['OTROS']['cantidad'] += 1;
                }
            }

            if ($fechaKey && isset($seriePorFecha[$fechaKey])) {
                $seriePorFecha[$fechaKey]['total']           = round($seriePorFecha[$fechaKey]['total'] + $monto, 2);
                $seriePorFecha[$fechaKey]['cantidad_ventas'] += 1;

                if ($esCredito) {
                    $seriePorFecha[$fechaKey]['credito'] = round($seriePorFecha[$fechaKey]['credito'] + $monto, 2);
                } else {
                    $seriePorFecha[$fechaKey]['contado'] = round($seriePorFecha[$fechaKey]['contado'] + $monto, 2);
                }
            }
        }

        $totalFacturado = round($totalFacturado, 2);
        $totalContado   = round($totalContado, 2);
        $totalCredito   = round($totalCredito, 2);
        $ticketPromedio = $cantidadVentas > 0 ? round($totalFacturado / $cantidadVentas, 2) : 0.0;

        $porMedioPago = array_values(array_map(function (array $item) use ($totalFacturado) {
            $monto = round($item['monto'], 2);
            return [
                'id'         => $item['id'],
                'label'      => $item['label'],
                'monto'      => $monto,
                'cantidad'   => $item['cantidad'],
                'porcentaje' => $totalFacturado > 0 ? round(($monto / $totalFacturado) * 100, 1) : 0.0,
            ];
        }, $mediosAccumulator));

        return [
            'periodo' => [
                'fecha_desde' => $desde->toDateString(),
                'fecha_hasta' => $hasta->toDateString(),
                'dias'        => count($seriePorFecha),
            ],
            'resumen' => [
                'total_facturado' => $totalFacturado,
                'cantidad_ventas' => $cantidadVentas,
                'ticket_promedio' => $ticketPromedio,
                'total_contado'   => $totalContado,
                'total_credito'   => $totalCredito,
            ],
            'serie_diaria'   => array_values($seriePorFecha),
            'por_medio_pago' => $porMedioPago,
        ];
    }

    /**
     * [CU18] Obtiene el ranking de productos más vendidos en el rango de fechas indicado.
     */
    public function obtenerProductosMasVendidos(Carbon $desde, Carbon $hasta, int $limit = 10): array
    {
        $inicio = $desde->copy()->startOfDay();
        $fin    = $hasta->copy()->endOfDay();

        $rows = DetalleVenta::query()
            ->join('ventas', 'detalles_venta.venta_id', '=', 'ventas.id')
            ->join('products', 'detalles_venta.product_id', '=', 'products.id')
            ->leftJoin('categories', 'products.categoria_id', '=', 'categories.id')
            ->where('ventas.estado', 'COMPLETADA')
            ->whereBetween('ventas.created_at', [$inicio, $fin])
            ->selectRaw('
                products.id as producto_id,
                products.nombre as nombre,
                products.codigo_barra as codigo_barra,
                categories.nombre as categoria,
                SUM(detalles_venta.cantidad) as cantidad_vendida,
                SUM(detalles_venta.subtotal) as total_recaudado,
                COUNT(DISTINCT detalles_venta.venta_id) as frecuencia_ventas
            ')
            ->groupBy('products.id', 'products.nombre', 'products.codigo_barra', 'categories.nombre')
            ->orderByDesc('cantidad_vendida')
            ->orderByDesc('total_recaudado')
            ->limit($limit)
            ->get();

        $productos = $rows->map(function ($row, int $index) {
            return [
                'ranking'           => $index + 1,
                'producto_id'       => (int) $row->producto_id,
                'nombre'            => $row->nombre,
                'codigo_barra'      => $row->codigo_barra,
                'categoria'         => $row->categoria ?? 'Sin categoría',
                'cantidad_vendida'  => (int) $row->cantidad_vendida,
                'total_recaudado'   => round((float) $row->total_recaudado, 2),
                'frecuencia_ventas' => (int) $row->frecuencia_ventas,
            ];
        })->values()->all();

        $totalUnidades  = array_sum(array_column($productos, 'cantidad_vendida'));
        $totalRecaudado = round(array_sum(array_column($productos, 'total_recaudado')), 2);

        return [
            'periodo' => [
                'fecha_desde' => $desde->toDateString(),
                'fecha_hasta' => $hasta->toDateString(),
            ],
            'resumen' => [
                'total_unidades_top'  => (int) $totalUnidades,
                'total_recaudado_top' => $totalRecaudado,
                'cantidad_productos'  => count($productos),
            ],
            'productos' => $productos,
        ];
    }
}

