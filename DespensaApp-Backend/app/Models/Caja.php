<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Caja extends Model
{
    protected $table = 'cajas';
   

    protected $fillable = [
        'usuario_apertura_id',
        'usuario_cierre_id',
        'saldo_inicial',
        'saldo_final',
        'fecha_apertura',
        'fecha_cierre',
        'estado',
    ];

      protected function casts(): array
    {
        return [
            'fecha_apertura' => 'datetime',
            'fecha_cierre'   => 'datetime',
            'saldo_inicial'  => 'decimal:2',
            'saldo_final'    => 'decimal:2',
        ];
    }

    public function usuarioApertura():BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_apertura_id');
    }

    public function usuarioCierre():BelongsTo
    {
        return $this->belongsTo(User::class, 'usuario_cierre_id');
    }

    public function movimientos(): HasMany
    {
        return $this->hasMany(MovimientoCaja::class, 'caja_id');
    }

    //Scope para filtrar cajas abiertas.
    public function scopeAbierta(Builder $query)
    {
        return $query->where('estado', 'ABIERTA');
    }
    /**
     * Calcula el saldo esperado según los movimientos registrados.
     */
    public function saldoEsperado(): float
    {
        $ingresos = $this->totalIngresos();
        $egresos = $this->totalEgresos();
        return (float) ($this->saldo_inicial + $ingresos - $egresos);
    }

     public function totalIngresos():float
    {
        return (float) $this->movimientos()
            ->whereIn('tipo', ['INGRESO_VENTA', 'INGRESO_COBRO_CLIENTE'])
            ->sum('monto');
    }

    public function totalEgresos():float
    {
        return (float) $this->movimientos()
            ->whereIn('tipo', ['EGRESO_PAGO_PROVEEDOR', 'EGRESO_GASTO_VARIOS'])
            ->sum('monto');
    }

}
