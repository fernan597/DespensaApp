<?php

namespace App\Models;

use App\Enums\TipoMovimientoCaja;
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
    /*
      Calcula el saldo esperado según los movimientos registrados.
     
    public function saldoEsperado(): float
    {
        $ingresos = $this->totalIngresos();
        $egresos = $this->totalEgresos();
        return (float) ($this->saldo_inicial + $ingresos - $egresos);
    }*/

    public function totalIngresos(): string
    {
        $suma = $this->movimientos()
            ->whereIn('tipo', [
                TipoMovimientoCaja::INGRESO_VENTA,
                TipoMovimientoCaja::INGRESO_COBRO_CLIENTE,
                TipoMovimientoCaja::INGRESO_MANUAL,
                TipoMovimientoCaja::AJUSTE_MANUAL,
            ])
            ->sum('monto');

            // Si $suma es null (porque no hay ingresos), usamos '0'.
            // bcadd lo formatea forzando los 2 decimales, devolviendo "0.00" o el monto exacto.
            return bcadd((string) ($suma ?? '0'), '0', 2);
    }

    public function totalEgresos(): string
    {
        $suma = $this->movimientos()
            ->whereIn('tipo', [
                TipoMovimientoCaja::EGRESO_PAGO_PROVEEDOR,
                TipoMovimientoCaja::EGRESO_GASTO_VARIOS,
                TipoMovimientoCaja::EGRESO_MANUAL,
            ])
            ->sum('monto');

            // Si $suma es null (porque no hay egresos), usamos '0'.
            // bcadd lo formatea forzando los 2 decimales, devolviendo "0.00" o el monto exacto.
            return bcadd((string) ($suma ?? '0'), '0', 2);
    }

    // Calcula el saldo esperado según los movimientos registrados.
    public function saldoEsperado(): string
    {
        $ingresos = $this->totalIngresos();
        $egresos  = $this->totalEgresos();
        
        //(saldo_inicial - egresos) + ingresos
        return bcadd(
            bcsub((string) $this->saldo_inicial, (string) $egresos, 2),
            (string) $ingresos,
            2
        );
    }
}
