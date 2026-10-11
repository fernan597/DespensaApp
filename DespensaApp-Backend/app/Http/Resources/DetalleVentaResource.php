<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DetalleVentaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'venta_id'        => $this->venta_id,
            'product_id'      => $this->product_id,
            'cantidad'        => (int) $this->cantidad,
            'precio_unitario' => (float) $this->precio_unitario,
            'subtotal'        => (float) $this->subtotal,
            'producto'        => new ProductResource($this->whenLoaded('producto')),
        ];
    }
}
