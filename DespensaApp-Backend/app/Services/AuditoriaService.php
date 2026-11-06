<?php

namespace App\Services;

use App\Enums\AccionAuditoria;
use App\Models\Auditoria;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class AuditoriaService
{
    /**
     * Registra una acción sensible en la bitácora.
     *
     * No interrumpe la operación de negocio si la escritura falla: el evento
     * se reporta al log de la aplicación y la operación continúa.
     */
    public function registrar(
        AccionAuditoria $accion,
        ?string $detalle = null,
        ?int $userId = null
    ): void {
        try {
            Auditoria::create([
                'user_id' => $userId ?? auth()->id(),
                'accion'  => $accion->value,
                'detalle' => $detalle,
            ]);
        } catch (\Throwable $e) {
            Log::error('No se pudo registrar la auditoría.', [
                'accion'  => $accion->value,
                'detalle' => $detalle,
                'user_id' => $userId,
                'error'   => $e->getMessage(),
            ]);
        }
    }

    /**
     * Consulta paginada de la bitácora con filtros opcionales.
     */
    public function consultar(array $filtros): LengthAwarePaginator
    {
        $query = Auditoria::with('user:id,name,email,role');

        if (! empty($filtros['search'])) {
            $search = trim((string) $filtros['search']);

            $query->where(function ($q) use ($search) {
                $q->where('detalle', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->withTrashed()
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($filtros['user_id'])) {
            $query->where('user_id', (int) $filtros['user_id']);
        }

        if (! empty($filtros['accion'])) {
            $query->where('accion', $filtros['accion']);
        }

        if (! empty($filtros['fecha_desde'])) {
            $query->where('created_at', '>=', Carbon::createFromFormat('Y-m-d', $filtros['fecha_desde'])->startOfDay());
        }

        if (! empty($filtros['fecha_hasta'])) {
            $query->where('created_at', '<=', Carbon::createFromFormat('Y-m-d', $filtros['fecha_hasta'])->endOfDay());
        }

        $perPage = (int) ($filtros['per_page'] ?? 20);

        return $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    /**
     * Catálogo de usuarios y acciones para los filtros de la vista.
     */
    public function obtenerFiltros(): array
    {
        $usuarios = User::withTrashed()
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'role']);

        $acciones = collect(AccionAuditoria::cases())
            ->map(fn (AccionAuditoria $accion) => [
                'value'     => $accion->value,
                'label'     => $accion->label(),
                'categoria' => $accion->categoria(),
            ])
            ->values()
            ->all();

        return [
            'usuarios' => $usuarios,
            'acciones' => $acciones,
        ];
    }

    /**
     * Obtiene un registro con su usuario para la vista de detalle.
     */
    public function detalle(Auditoria $auditoria): Auditoria
    {
        return $auditoria->load('user:id,name,email,role');
    }
}
