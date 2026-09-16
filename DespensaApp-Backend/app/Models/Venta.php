<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Venta extends Model
{
    protected $table = 'ventas';

    protected $fillable = [
        'user_id',
        'cliente_id',
        'total',
        'tipo_venta',
        'medio_pago',
        'estado',
    ];

    protected function casts(): array
    {
        return [
            'total' => 'decimal:2',
        ];
    }

    // --- Relaciones ---

    /**
     * El usuario (cajero/empleado) que registró la venta.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * El cliente asociado a la venta (puede ser null si fue al paso).
     */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    /**
     * Los ítems/productos incluidos en esta venta.
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleVenta::class, 'venta_id');
    }

    /**
     * El movimiento de caja generado por esta venta (si fue en efectivo).
     */
    public function movimientoCaja(): HasOne
    {
        return $this->hasOne(MovimientoCaja::class, 'venta_id');
    }

    /**
     * El movimiento de cuenta corriente generado (si fue fiado/cuenta corriente).
     */
    public function movimientoCuentaCorriente(): HasOne
    {
        return $this->hasOne(MovimientoCuentaCorrienteCliente::class, 'venta_id');
    }
}
