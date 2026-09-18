<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CajaResumenResource extends JsonResource
{
    /**
     * Datos de arqueo calculados externamente, recibidos como array.
     */
    private array $resumen;

    public function __construct($resource, array $resumen)
    {
        parent::__construct($resource);
        $this->resumen = $resumen;
    }

    /**
     * Transform the resource into an array.
     * Usado exclusivamente para la respuesta del endpoint POST /api/caja/cerrar.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'saldo_inicial'         => $this->resumen['saldo_inicial'],
            'total_ingresos'        => $this->resumen['total_ingresos'],
            'total_egresos'         => $this->resumen['total_egresos'],
            'saldo_esperado'        => $this->resumen['saldo_esperado'],
            'saldo_final_declarado' => $this->resumen['saldo_final_declarado'],
            'diferencia'            => $this->resumen['diferencia'],
            'fecha_apertura'        => $this->fecha_apertura,
            'fecha_cierre'          => $this->fecha_cierre,
            'usuario_cierre'        => $this->whenLoaded('usuarioCierre', fn () => [
                'id'   => $this->usuarioCierre->id,
                'name' => $this->usuarioCierre->name,
            ]),
        ];
    }
}
