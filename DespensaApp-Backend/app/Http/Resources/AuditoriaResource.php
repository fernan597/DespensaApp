<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AuditoriaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'accion'       => $this->accion->value,
            'accion_label' => $this->accion->label(),
            'categoria'    => $this->accion->categoria(),
            'detalle'      => $this->detalle,
            'created_at'   => $this->created_at?->toIso8601String(),
            'usuario'      => $this->whenLoaded('user', fn () => $this->user ? [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
                'role'  => $this->user->role,
            ] : null),
        ];
    }
}
