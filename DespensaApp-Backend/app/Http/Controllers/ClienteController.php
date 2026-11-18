<?php

namespace App\Http\Controllers;

use App\Enums\AccionAuditoria;
use App\Http\Requests\StoreClienteRequest;
use App\Http\Resources\ClienteResource;
use App\Models\Cliente;
use App\Services\AuditoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function __construct(
        protected AuditoriaService $auditoriaService
    ) {}

    /**
     * GET /api/clientes
     *
     * Listado de clientes con soporte para búsqueda (nombre, apellido, teléfono).
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');

        $query = Cliente::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('apellido', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        $clientes = $query->orderBy('nombre')
            ->orderBy('apellido')
            ->get();

        $collection = ClienteResource::collection($clientes);

        return response()->json([
            'success'  => true,
            'data' => $collection,
        ]);
    }

    /**
     * GET /api/clientes/{cliente}
     */
    public function show(Cliente $cliente): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new ClienteResource($cliente),
        ]);
    }

    /**
     * POST /api/clientes
     */
    public function store(StoreClienteRequest $request): JsonResponse
    {
        $cliente = Cliente::create($request->validated());
        $cliente->refresh();

        $nombreCompleto = trim("{$cliente->nombre} {$cliente->apellido}");
        $this->auditoriaService->registrar(
            AccionAuditoria::CREAR_CLIENTE,
            "Cliente #{$cliente->id} creado: {$nombreCompleto}."
        );

        return response()->json([
            'success' => true,
            'data'    => new ClienteResource($cliente),
        ], 201);
    }

    /**
     * PUT /api/clientes/{cliente}
     */
    public function update(StoreClienteRequest $request, Cliente $cliente): JsonResponse
    {
        $cliente->update($request->validated());

        $nombreCompleto = trim("{$cliente->nombre} {$cliente->apellido}");
        $this->auditoriaService->registrar(
            AccionAuditoria::ACTUALIZAR_CLIENTE,
            "Cliente #{$cliente->id} actualizado: {$nombreCompleto}."
        );

        return response()->json([
            'success' => true,
            'data'    => new ClienteResource($cliente),
        ]);
    }

    /**
     * DELETE /api/clientes/{cliente}
     */
    public function destroy(Cliente $cliente): JsonResponse
    {
        if (bccomp((string) $cliente->saldo_cuenta_corriente, '0.00', 2) === 1) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el cliente porque registra saldo adeudado pendiente de cobro.',
            ], 409);
        }

        try {
            $nombreCompleto = trim("{$cliente->nombre} {$cliente->apellido}");
            $cliente->delete();

            $this->auditoriaService->registrar(
                AccionAuditoria::ELIMINAR_CLIENTE,
                "Cliente #{$cliente->id} eliminado: {$nombreCompleto}."
            );

            return response()->json([
                'success' => true,
                'message' => 'Cliente eliminado correctamente',
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'No se puede eliminar el cliente porque posee registros asociados.',
            ], 409);
        }
    }
}
