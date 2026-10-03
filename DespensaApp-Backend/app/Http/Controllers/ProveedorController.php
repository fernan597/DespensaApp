<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProveedorRequest;
use App\Http\Resources\ProveedorResource;
use App\Models\Proveedor;
use Illuminate\Http\JsonResponse;

class ProveedorController extends Controller
{
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

        return response()->json([
            'success' => true,
            'data' => new ProveedorResource($proveedor)
        ], 201);
    }

    public function update(StoreProveedorRequest $request, Proveedor $proveedor): JsonResponse
    {
        $proveedor->update($request->validated());

        return response()->json([
            'success' => true,
            'data' => new ProveedorResource($proveedor)
        ]);
    }

    public function destroy(Proveedor $proveedor): JsonResponse
    {
        try {
            $proveedor->delete();

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
