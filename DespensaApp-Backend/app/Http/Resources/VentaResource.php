<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VentaResource extends JsonResource
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
            'cliente_id'                  => $this->cliente_id,
            'total'                       => (float) $this->total,
            'tipo_venta'                  => $this->tipo_venta,
            'medio_pago'                  => $this->medio_pago,
            'estado'                      => $this->estado,
            'created_at'                  => $this->created_at?->toDateTimeString(),
            'updated_at'                  => $this->updated_at?->toDateTimeString(),
            'user'                        => $this->whenLoaded('user', function () {
                return [
                    'id'   => $this->user->id,
                    'name' => $this->user->name,
                ];
            }),
            'cliente'                     => $this->whenLoaded('cliente', function () {
                return [
                    'id'                      => $this->cliente->id,
                    'nombre'                  => $this->cliente->nombre,
                    'apellido'                => $this->cliente->apellido,
                    'saldo_cuenta_corriente' => (float) $this->cliente->saldo_cuenta_corriente,
                ];
            }),
            'detalles'                    => DetalleVentaResource::collection($this->whenLoaded('detalles')),
            'movimiento_cuenta_corriente' => $this->whenLoaded('movimientoCuentaCorriente'),
        ];
    }
}
