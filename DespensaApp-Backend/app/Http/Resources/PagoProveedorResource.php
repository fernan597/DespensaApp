<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PagoProveedorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'proveedor_id' => $this->proveedor_id,
            'user_id'      => $this->user_id,
            'monto'        => $this->monto,
            'medio_pago'   => $this->medio_pago instanceof \BackedEnum ? $this->medio_pago->value : $this->medio_pago,
            'created_at'   => $this->created_at?->toDateTimeString(),
            'updated_at'   => $this->updated_at?->toDateTimeString(),
            'proveedor'    => new ProveedorResource($this->whenLoaded('proveedor')),
        ];
    }
}
