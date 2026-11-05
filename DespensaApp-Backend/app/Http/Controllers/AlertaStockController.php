<?php

namespace App\Http\Controllers;

use App\Services\AlertaStockService;
use Illuminate\Http\JsonResponse;

class AlertaStockController extends Controller
{
    /**
     * [CU17] Monitorear Alertas de Stock Mínimo.
     */
    public function index(AlertaStockService $service): JsonResponse
    {
        return response()->json($service->listar());
    }
}
