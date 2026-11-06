<?php

namespace App\Http\Controllers;

use App\Http\Requests\IndexAuditoriaRequest;
use App\Http\Resources\AuditoriaResource;
use App\Models\Auditoria;
use App\Services\AuditoriaService;
use Illuminate\Http\JsonResponse;

class AuditoriaController extends Controller
{
    public function __construct(
        protected AuditoriaService $auditoriaService
    ) {}

    /**
     * GET /api/auditorias
     *
     * [CU03] Listado paginado de la bitácora con filtros de búsqueda.
     */
    public function index(IndexAuditoriaRequest $request)
    {
        $auditorias = $this->auditoriaService->consultar($request->validated());

        return AuditoriaResource::collection($auditorias)->additional([
            'success' => true,
        ]);
    }

    /**
     * GET /api/auditorias/filtros
     *
     * Catálogo de usuarios y tipos de acción para los selectores de la vista.
     */
    public function filtros(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->auditoriaService->obtenerFiltros(),
        ]);
    }

    /**
     * GET /api/auditorias/{auditoria}
     *
     * Detalle completo de un registro de auditoría.
     */
    public function show(Auditoria $auditoria): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new AuditoriaResource($this->auditoriaService->detalle($auditoria)),
        ]);
    }
}
