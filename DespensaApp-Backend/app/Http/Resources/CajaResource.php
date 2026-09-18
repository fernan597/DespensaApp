<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CajaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'estado'         => $this->estado,
            'saldo_inicial'  => round((float) $this->saldo_inicial, 2),
            'saldo_final'    => $this->saldo_final !== null
                                    ? round((float) $this->saldo_final, 2)
                                    : null,
            'fecha_apertura' => $this->fecha_apertura,
            'fecha_cierre'   => $this->fecha_cierre,

            // Relaciones: solo se incluyen si fueron cargadas con ->with() o ->load()
            'usuario_apertura' => $this->whenLoaded('usuarioApertura', fn () => [
                'id'   => $this->usuarioApertura->id,
                'name' => $this->usuarioApertura->name,
            ]),
            'usuario_cierre' => $this->whenLoaded('usuarioCierre', fn () => [
                'id'   => $this->usuarioCierre->id,
                'name' => $this->usuarioCierre->name,
            ]),

            // Campos calculados: solo se calculan si la caja está ABIERTA
            // y sus movimientos fueron cargados (evita N+1 en el index de historial).
            'total_ingresos' => $this->when(
                $this->estado === 'ABIERTA',
                fn () => round($this->totalIngresos(), 2)
            ),
            'total_egresos' => $this->when(
                $this->estado === 'ABIERTA',
                fn () => round($this->totalEgresos(), 2)
            ),
            'saldo_esperado' => $this->when(
                $this->estado === 'ABIERTA',
                fn () => round($this->saldoEsperado(), 2)
            ),
        ];
    }
}
