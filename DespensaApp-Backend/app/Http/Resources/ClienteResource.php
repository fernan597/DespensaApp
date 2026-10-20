<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $saldo = (float) $this->saldo_cuenta_corriente;

        return [
            'id'                     => $this->id,
            'nombre'                 => $this->nombre,
            'apellido'               => $this->apellido,
            'nombre_completo'        => trim("{$this->nombre} {$this->apellido}"),
            'telefono'               => $this->telefono,
            'direccion'              => $this->direccion,
            'saldo_cuenta_corriente' => $saldo,
            'estado_cuenta'          => $saldo > 0 ? 'DEUDOR' : 'AL_DIA',
            'created_at'             => $this->created_at?->toDateTimeString(),
            'updated_at'             => $this->updated_at?->toDateTimeString(),
        ];
    }
}
