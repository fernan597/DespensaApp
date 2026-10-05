<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompraResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                          => $this->id,
            'user_id'                     => $this->user_id,
            'proveedor_id'                => $this->proveedor_id,
            'numero_comprobante'          => $this->numero_comprobante,
            'total'                       => (float) $this->total,
            'tipo_pago'                   => $this->tipo_pago,
            'pendiente_pago'              => (bool) $this->pendiente_pago,
            'estado'                      => $this->estado,
            'created_at'                  => $this->created_at?->toDateTimeString(),
            'updated_at'                  => $this->updated_at?->toDateTimeString(),
            'user'                        => $this->whenLoaded('user', function () {
                return [
                    'id'   => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),
            'proveedor'                   => new ProveedorResource($this->whenLoaded('proveedor')),
            'detalles'                    => DetalleCompraResource::collection($this->whenLoaded('detalles')),
            'movimiento_cuenta_corriente' => $this->whenLoaded('movimientoCuentaCorriente'),
        ];
    }
}
