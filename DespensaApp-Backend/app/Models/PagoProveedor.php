<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class PagoProveedor extends Model
{
    use HasFactory;

    protected $table = 'pagos_proveedores';

    protected $fillable = [
        'proveedor_id',
        'user_id',
        'monto',
        'medio_pago',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    /**
     * Proveedor al que se le realizó el pago.
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /**
     * Usuario que registró el pago.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Movimiento de cuenta corriente asociado a este pago (crédito).
     */
    public function movimientoCuentaCorriente(): HasOne
    {
        return $this->hasOne(MovimientoCuentaCorrienteProveedor::class, 'pago_proveedor_id');
    }

    /**
     * Movimiento de caja asociado a este pago (egreso).
     */
    public function movimientoCaja(): HasOne
    {
        return $this->hasOne(MovimientoCaja::class, 'pago_proveedor_id');
    }
}
