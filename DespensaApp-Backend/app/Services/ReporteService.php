<?php

namespace App\Services;

use App\Models\DetalleVenta;
use App\Models\Venta;
use Carbon\Carbon;
use Carbon\CarbonPeriod;

class ReporteService
{
    /**
     * Genera un reporte completo de ventas para un rango de fechas.
     * Incluye totales generales, desglose por medio de pago y serie diaria (para gráficos).
     *
     * @param Carbon $desde Fecha de inicio del período
     * @param Carbon $hasta Fecha de fin del período
     * @return array        Array con los datos del reporte estructurados
     */
    public function obtenerReporteVentas(Carbon $desde, Carbon $hasta): array
    {
        // Normalizamos las fechas para asegurarnos de cubrir el día completo:
        // $inicio apunta a las 00:00:00 del primer día del período.
        // $fin apunta a las 23:59:59 del último día del período.
        // Usamos copy() para no modificar los objetos Carbon originales (son mutables).
        $inicio = $desde->copy()->startOfDay();
        $fin    = $hasta->copy()->endOfDay();

        // Consultamos todas las ventas COMPLETADAS dentro del rango de fechas.
        // Solo seleccionamos las columnas necesarias para el reporte (evitamos cargar datos innecesarios).
        // Ordenamos por fecha ascendente para procesar cronológicamente.
        $ventas = Venta::query()
            ->where('estado', 'COMPLETADA')                            // Solo ventas finalizadas
            ->whereBetween('created_at', [$inicio, $fin])              // Dentro del rango de fechas
            ->orderBy('created_at', 'asc')                             // Orden cronológico
            ->get(['id', 'total', 'tipo_venta', 'medio_pago', 'created_at']); // Solo columnas necesarias

        // Creamos un período que cubre cada día desde $desde hasta $hasta.
        // Esto nos permite inicializar la serie diaria con cero ventas para cada día,
        // garantizando que todos los días aparezcan en el reporte aunque no haya ventas.
        $periodo = CarbonPeriod::create($desde->copy()->startOfDay(), $hasta->copy()->startOfDay());

        // Array asociativo donde la clave es la fecha en formato 'Y-m-d'
        // y el valor contiene los totales de ese día inicializados en cero.
        $seriePorFecha = [];

        // Iteramos día a día sobre el período para pre-poblar la serie con ceros.
        foreach ($periodo as $dia) {
            // Formateamos la fecha como 'Y-m-d' (ej: '2025-01-15') para usar como clave.
            $fechaKey = $dia->format('Y-m-d');

            // Inicializamos cada día con valores en cero.
            // 'etiqueta' usa formato 'd/m' (ej: '15/01') para mostrar en el eje X de los gráficos.
            $seriePorFecha[$fechaKey] = [
                'fecha'           => $fechaKey,           // Fecha completa para identificar el día
                'etiqueta'        => $dia->format('d/m'), // Etiqueta corta para gráficos
                'total'           => 0.0,                 // Monto total vendido en el día
                'contado'         => 0.0,                 // Monto vendido al contado
                'credito'         => 0.0,                 // Monto vendido a crédito (fiado)
                'cantidad_ventas' => 0,                   // Número de transacciones del día
            ];
        }

        // Inicializamos los acumuladores globales del período.
        $totalFacturado = 0.0; // Suma de todas las ventas del período
        $cantidadVentas = 0;   // Número total de ventas del período
        $totalContado   = 0.0; // Total cobrado al contado
        $totalCredito   = 0.0; // Total a crédito (cuenta corriente)

        // Inicializamos los acumuladores por medio de pago.
        // Usamos IDs fijos como clave para facilitar la búsqueda y actualización.
        // Cada medio tiene: id (clave interna), label (nombre visible), monto acumulado y cantidad de ventas.
        $mediosAccumulator = [
            'EFECTIVO' => ['id' => 'EFECTIVO', 'label' => 'Efectivo en Caja',         'monto' => 0.0, 'cantidad' => 0],
            'OTROS'    => ['id' => 'OTROS',    'label' => 'Transferencia / Tarjeta',  'monto' => 0.0, 'cantidad' => 0],
            'CREDITO'  => ['id' => 'CREDITO',  'label' => 'Cuenta Corriente (Fiado)', 'monto' => 0.0, 'cantidad' => 0],
        ];

        // Procesamos cada venta para acumular los totales
        foreach ($ventas as $venta) {
            // Obtenemos el monto de la venta como float redondeado a 2 decimales
            // para evitar errores de precisión en la suma.
            $monto = round((float) $venta->total, 2);

            // Determinamos si la venta es a crédito (cuenta corriente/fiado).
            // Una venta se considera "crédito" si su tipo_venta es 'CUENTA_CORRIENTE'
            // O si su medio_pago es 'CREDITO'. Usamos OR para cubrir ambos casos.
            $esCredito = ($venta->tipo_venta === 'CUENTA_CORRIENTE' || $venta->medio_pago === 'CREDITO');

            // Obtenemos la fecha de la venta como string 'Y-m-d' para buscarla en $seriePorFecha.
            // Verificamos que created_at no sea null antes de formatear (precaución ante datos incompletos).
            $fechaKey = $venta->created_at ? $venta->created_at->format('Y-m-d') : null;

            // Acumulamos el monto al total facturado del período
            $totalFacturado += $monto;
            // Incrementamos el contador de ventas
            $cantidadVentas += 1;

            // Clasificamos la venta según si es crédito o contado
            if ($esCredito) {
                // Si es crédito, sumamos al total de crédito y al acumulador del medio CREDITO
                $totalCredito += $monto;
                $mediosAccumulator['CREDITO']['monto']    += $monto;
                $mediosAccumulator['CREDITO']['cantidad'] += 1;
            } else {
                // Si es contado, sumamos al total de contado
                $totalContado += $monto;

                // Dentro del contado, diferenciamos entre EFECTIVO y otros medios
                // (transferencia, tarjeta, etc.)
                if ($venta->medio_pago === 'EFECTIVO') {
                    // Acumulamos en el medio EFECTIVO
                    $mediosAccumulator['EFECTIVO']['monto']    += $monto;
                    $mediosAccumulator['EFECTIVO']['cantidad'] += 1;
                } else {
                    // Cualquier otro medio de pago va a la categoría OTROS
                    $mediosAccumulator['OTROS']['monto']    += $monto;
                    $mediosAccumulator['OTROS']['cantidad'] += 1;
                }
            }

            // Actualizamos la serie diaria solo si la fecha existe en nuestro mapa pre-poblado.
            // La verificación con isset() previene errores si la fecha cae fuera del rango esperado.
            if ($fechaKey && isset($seriePorFecha[$fechaKey])) {
                // Sumamos el monto al total del día y redondeamos para mantener precisión
                $seriePorFecha[$fechaKey]['total']           = round($seriePorFecha[$fechaKey]['total'] + $monto, 2);
                // Incrementamos el contador de ventas del día
                $seriePorFecha[$fechaKey]['cantidad_ventas'] += 1;

                // Actualizamos el desglose crédito/contado del día
                if ($esCredito) {
                    $seriePorFecha[$fechaKey]['credito'] = round($seriePorFecha[$fechaKey]['credito'] + $monto, 2);
                } else {
                    $seriePorFecha[$fechaKey]['contado'] = round($seriePorFecha[$fechaKey]['contado'] + $monto, 2);
                }
            }
        }

        // Redondeamos los totales acumulados al finalizar el bucle,
        // para corregir posibles errores de punto flotante acumulados durante las sumas.
        $totalFacturado = round($totalFacturado, 2);
        $totalContado   = round($totalContado, 2);
        $totalCredito   = round($totalCredito, 2);

        // Calculamos el ticket promedio: total facturado dividido entre la cantidad de ventas.
        // Si no hay ventas (division por cero), retornamos 0.0 para evitar errores.
        $ticketPromedio = $cantidadVentas > 0 ? round($totalFacturado / $cantidadVentas, 2) : 0.0;

        // Transformamos el acumulador de medios de pago en un array indexado numéricamente
        // (array_values elimina las claves asociativas 'EFECTIVO', 'OTROS', 'CREDITO')
        // y calculamos el porcentaje que representa cada medio sobre el total facturado.
        $porMedioPago = array_values(array_map(function (array $item) use ($totalFacturado) {
            // Redondeamos el monto de cada medio a 2 decimales
            $monto = round($item['monto'], 2);
            return [
                'id'         => $item['id'],       // Identificador del medio de pago
                'label'      => $item['label'],    // Nombre legible del medio de pago
                'monto'      => $monto,            // Total recaudado por este medio
                'cantidad'   => $item['cantidad'], // Cantidad de ventas por este medio
                // Porcentaje sobre el total; si el total es 0 evitamos la división por cero
                'porcentaje' => $totalFacturado > 0 ? round(($monto / $totalFacturado) * 100, 1) : 0.0,
            ];
        }, $mediosAccumulator));

        // Retornamos el array final con toda la información del reporte estructurada.
        return [
            // Información sobre el rango de fechas consultado
            'periodo' => [
                'fecha_desde' => $desde->toDateString(),   // Fecha inicio en formato 'Y-m-d'
                'fecha_hasta' => $hasta->toDateString(),   // Fecha fin en formato 'Y-m-d'
                'dias'        => count($seriePorFecha),    // Cantidad de días en el período
            ],
            // Resumen ejecutivo con los KPIs principales
            'resumen' => [
                'total_facturado' => $totalFacturado, // Monto total vendido
                'cantidad_ventas' => $cantidadVentas, // Número de ventas realizadas
                'ticket_promedio' => $ticketPromedio, // Valor promedio por venta
                'total_contado'   => $totalContado,   // Total cobrado al contado
                'total_credito'   => $totalCredito,   // Total a crédito (fiado)
            ],
            // Serie de datos diaria para renderizar gráficos de barras/líneas
            'serie_diaria'   => array_values($seriePorFecha),
            // Desglose por medio de pago con porcentajes (para gráfico de torta/pie)
            'por_medio_pago' => $porMedioPago,
        ];
    }

    /**
     * Obtiene el ranking de los productos más vendidos en un período.
     * Realiza joins entre tablas para obtener nombre, categoría y estadísticas de cada producto.
     *
     * @param Carbon $desde  Fecha de inicio del período
     * @param Carbon $hasta  Fecha de fin del período
     * @param int    $limit  Cantidad máxima de productos a retornar (top N); por defecto 10
     * @return array         Array con el ranking de productos y un resumen del período
     */
    public function obtenerProductosMasVendidos(Carbon $desde, Carbon $hasta, int $limit = 10): array
    {
        // Normalizamos las fechas igual que en obtenerReporteVentas,
        // para cubrir el día completo desde las 00:00:00 hasta las 23:59:59.
        $inicio = $desde->copy()->startOfDay();
        $fin    = $hasta->copy()->endOfDay();

        // Realizamos una consulta con JOINs para combinar información de varias tablas.
        // Partimos de DetalleVenta (cada línea de una venta) y unimos:
        // - ventas: para filtrar por estado y fecha
        // - products: para obtener nombre y código de barra
        // - categories: LEFT JOIN para incluir productos sin categoría asignada
        $rows = DetalleVenta::query()
            ->join('ventas', 'detalles_venta.venta_id', '=', 'ventas.id')             // Une detalles con su venta
            ->join('products', 'detalles_venta.product_id', '=', 'products.id')       // Une con el producto
            ->leftJoin('categories', 'products.categoria_id', '=', 'categories.id')  // Une con categoría (opcional)
            ->where('ventas.estado', 'COMPLETADA')                                     // Solo ventas completadas
            ->whereBetween('ventas.created_at', [$inicio, $fin])                      // Dentro del rango de fechas

            // selectRaw nos permite escribir SQL puro para seleccionar columnas
            // y usar funciones de agregación (SUM, COUNT) que Eloquent no soporta directamente.
            ->selectRaw('
                products.id as producto_id,
                products.nombre as nombre,
                products.codigo_barra as codigo_barra,
                categories.nombre as categoria,
                SUM(detalles_venta.cantidad) as cantidad_vendida,
                SUM(detalles_venta.subtotal) as total_recaudado,
                COUNT(DISTINCT detalles_venta.venta_id) as frecuencia_ventas
            ')
            // Agrupamos por producto para que las funciones de agregación operen por producto.
            // Incluimos todas las columnas no-agregadas en el GROUP BY (requerido por SQL).
            ->groupBy('products.id', 'products.nombre', 'products.codigo_barra', 'categories.nombre')
            // Ordenamos primero por mayor cantidad vendida y luego por mayor monto recaudado (como desempate)
            ->orderByDesc('cantidad_vendida')
            ->orderByDesc('total_recaudado')
            // Limitamos a los N primeros productos según el parámetro recibido
            ->limit($limit)
            ->get(); // Ejecutamos la consulta y obtenemos los resultados

        // Transformamos cada fila del resultado en un array con el formato de salida deseado.
        // ->map() itera la colección y transforma cada elemento; $index es la posición (0-based).
        $productos = $rows->map(function ($row, int $index) {
            return [
                'ranking'           => $index + 1,              // Posición en el ranking (empieza en 1)
                'producto_id'       => (int) $row->producto_id, // ID del producto casteado a entero
                'nombre'            => $row->nombre,            // Nombre del producto
                'codigo_barra'      => $row->codigo_barra,      // Código de barras del producto
                // Si el producto no tiene categoría (LEFT JOIN devuelve null), mostramos 'Sin categoría'
                'categoria'         => $row->categoria ?? 'Sin categoría',
                'cantidad_vendida'  => (int) $row->cantidad_vendida,       // Total de unidades vendidas (entero)
                'total_recaudado'   => round((float) $row->total_recaudado, 2), // Monto recaudado con 2 decimales
                'frecuencia_ventas' => (int) $row->frecuencia_ventas,      // En cuántas ventas apareció este producto
            ];
        })->values()->all(); // values() resetea los índices; all() convierte la Collection a array PHP puro

        // Calculamos el total de unidades vendidas sumando la columna 'cantidad_vendida' del array.
        // array_column extrae esa columna y array_sum la suma.
        $totalUnidades  = array_sum(array_column($productos, 'cantidad_vendida'));

        // Calculamos el total recaudado por los productos del top N (no es el total de todas las ventas).
        $totalRecaudado = round(array_sum(array_column($productos, 'total_recaudado')), 2);

        // Retornamos el resultado estructurado con período, resumen y lista de productos.
        return [
            // Información del rango de fechas consultado
            'periodo' => [
                'fecha_desde' => $desde->toDateString(), // Fecha de inicio en formato 'Y-m-d'
                'fecha_hasta' => $hasta->toDateString(), // Fecha de fin en formato 'Y-m-d'
            ],
            // Totales del top N de productos (no del total de ventas del negocio)
            'resumen' => [
                'total_unidades_top'  => (int) $totalUnidades,  // Total de unidades vendidas entre los top N
                'total_recaudado_top' => $totalRecaudado,        // Monto total recaudado por los top N
                'cantidad_productos'  => count($productos),      // Cuántos productos se devuelven (máx. $limit)
            ],
            // Lista ordenada de productos con su ranking y estadísticas
            'productos' => $productos,
        ];
    }
}
