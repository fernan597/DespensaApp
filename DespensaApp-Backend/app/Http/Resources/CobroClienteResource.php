<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CobroClienteResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'cliente_id' => $this->cliente_id,
            'user_id'    => $this->user_id,
            'monto'      => (float) $this->monto,
            'medio_pago' => $this->medio_pago,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'cliente'    => new ClienteResource($this->whenLoaded('cliente')),
        ];
    }
}
