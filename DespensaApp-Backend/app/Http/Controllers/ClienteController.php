<?php

namespace App\Http\Controllers;

use App\Http\Resources\ClienteResource;
use App\Models\Cliente;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
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

        return response()->json([
            'success'  => true,
            'clientes' => ClienteResource::collection($clientes),
        ]);
    }
}
