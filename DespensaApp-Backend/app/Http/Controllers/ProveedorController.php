<?php

namespace App\Http\Controllers;

use App\Enums\AccionAuditoria;
use App\Http\Requests\StoreProveedorRequest;
use App\Http\Resources\ProveedorResource;
use App\Models\Proveedor;
use App\Services\AuditoriaService;
use Illuminate\Http\JsonResponse;

class ProveedorController extends Controller
{
    public function __construct(
        protected AuditoriaService $auditoriaService
    ) {}
    public function index(): JsonResponse
    {
        $proveedores = Proveedor::orderBy('id', 'desc')->get();
        return response()->json([
            'success' => true,
            'data' => ProveedorResource::collection($proveedores)
        ]);
    }

    public function show(Proveedor $proveedor): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => new ProveedorResource($proveedor)
        ]);
    }

    public function store(StoreProveedorRequest $request): JsonResponse
    {
        $proveedor = Proveedor::create($request->validated());

        $this->auditoriaService->registrar(
            AccionAuditoria::CREAR_PROVEEDOR,
            "Proveedor #{$proveedor->id} creado: {$proveedor->razon_social}."
        );

        return response()->json([
            'success' => true,
            'data' => new ProveedorResource($proveedor)
        ], 201);
    }

    public function update(StoreProveedorRequest $request, Proveedor $proveedor): JsonResponse
    {
        $proveedor->update($request->validated());

        $this->auditoriaService->registrar(
            AccionAuditoria::ACTUALIZAR_PROVEEDOR,
            "Proveedor #{$proveedor->id} actualizado: {$proveedor->razon_social}."
        );

        return response()->json([
            'success' => true,
            'data' => new ProveedorResource($proveedor)
        ]);
    }

    public function destroy(Proveedor $proveedor): JsonResponse
    {
        if (bccomp((string) $proveedor->saldo_adeudado, '0.00', 2) === 1) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el proveedor porque registra saldo adeudado pendiente de pago.'
            ], 409);
        }

        try {
            $proveedor->delete();

            $this->auditoriaService->registrar(
                AccionAuditoria::ELIMINAR_PROVEEDOR,
                "Proveedor #{$proveedor->id} eliminado: {$proveedor->razon_social}."
            );

            return response()->json([
                'success' => true,
                'message' => 'Proveedor eliminado correctamente'
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el proveedor porque posee registros asociados.'
            ], 409);
        }
    }
}
