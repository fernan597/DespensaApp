<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetalleCompraResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'compra_id'         => $this->compra_id,
            'product_id'        => $this->product_id,
            'cantidad'          => $this->cantidad,
            'costo_adquisicion' => $this->costo_adquisicion,
            'subtotal'          => $this->subtotal,
            'producto'          => new ProductResource($this->whenLoaded('producto')),
        ];
    }
}
