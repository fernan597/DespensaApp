<?php

namespace App\Http\Controllers;

use App\Services\ReporteService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReporteController extends Controller
{
    public function __construct(
        protected ReporteService $reporteService
    ) {}

    /**
     * GET /api/reportes/ventas
     *
     * [CU18] Devuelve el reporte agregado de ventas para el rango de fechas solicitado.
     * Si no se indican fechas, toma por defecto los últimos 7 días.
     */
    public function ventas(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fecha_desde' => ['nullable', 'date_format:Y-m-d'],
            'fecha_hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:fecha_desde'],
        ]);

        $hasta = ! empty($validated['fecha_hasta'])
            ? Carbon::createFromFormat('Y-m-d', $validated['fecha_hasta'])
            : Carbon::today();

        $desde = ! empty($validated['fecha_desde'])
            ? Carbon::createFromFormat('Y-m-d', $validated['fecha_desde'])
            : $hasta->copy()->subDays(6);

        if ($desde->gt($hasta)) {
            return response()->json([
                'message' => 'La fecha inicial no puede ser mayor que la fecha final.',
                'errors'  => [
                    'fecha_desde' => ['La fecha inicial no puede ser posterior a la fecha final.'],
                ],
            ], 422);
        }

        $reporte = $this->reporteService->obtenerReporteVentas($desde, $hasta);

        return response()->json([
            'success' => true,
            'data'    => $reporte,
        ]);
    }

    /**
     * GET /api/reportes/mas-vendidos
     *
     * [CU18] Devuelve el ranking de los productos más vendidos en el rango de fechas solicitado.
     */
    public function masVendidos(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'fecha_desde' => ['nullable', 'date_format:Y-m-d'],
            'fecha_hasta' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:fecha_desde'],
            'limit'       => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $hasta = ! empty($validated['fecha_hasta'])
            ? Carbon::createFromFormat('Y-m-d', $validated['fecha_hasta'])
            : Carbon::today();

        $desde = ! empty($validated['fecha_desde'])
            ? Carbon::createFromFormat('Y-m-d', $validated['fecha_desde'])
            : $hasta->copy()->subDays(29);

        if ($desde->gt($hasta)) {
            return response()->json([
                'message' => 'La fecha inicial no puede ser mayor que la fecha final.',
                'errors'  => [
                    'fecha_desde' => ['La fecha inicial no puede ser posterior a la fecha final.'],
                ],
            ], 422);
        }

        $limit   = (int) ($validated['limit'] ?? 8);
        $reporte = $this->reporteService->obtenerProductosMasVendidos($desde, $hasta, $limit);

        return response()->json([
            'success' => true,
            'data'    => $reporte,
        ]);
    }
}

