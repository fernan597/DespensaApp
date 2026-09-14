<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'codigo_barra' => $this->codigo_barra,
            'stock_actual' => $this->stock_actual,
            'stock_minimo' => $this->stock_minimo,
            'precio_compra' => $this->precio_compra,
            'precio_venta' => $this->precio_venta,
            'categoria_id' => $this->categoria_id,
            'marca_id' => $this->marca_id,
            'categoria' => new CategoryResource($this->whenLoaded('categoria')),
            'marca' => new MarcaResource($this->whenLoaded('marca')),
        ];
    }
}
