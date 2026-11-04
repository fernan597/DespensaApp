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
        $compra = (string) $this->precio_compra;
        $venta = (string) $this->precio_venta;

        $margen = bccomp($compra, '0.00', 2) === 1
            ? bcmul(
                bcdiv(bcsub($venta, $compra, 2), $compra, 6),
                '100',
                2
            )
            : null;

        return [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'codigo_barra' => $this->codigo_barra,
            'stock_actual' => (int) $this->stock_actual,
            'stock_minimo' => (int) $this->stock_minimo,
            'precio_compra' => $compra,
            'precio_venta' => $venta,
            'margen_ganancia' => $margen,
            'categoria_id' => $this->categoria_id,
            'marca_id' => $this->marca_id,
            'categoria' => new CategoryResource($this->whenLoaded('categoria')),
            'marca' => new MarcaResource($this->whenLoaded('marca')),
        ];
    }
}
