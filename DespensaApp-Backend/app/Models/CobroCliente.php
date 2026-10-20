<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class CobroCliente extends Model
{
    protected $table = 'cobros_clientes';

    protected $fillable = [
        'cliente_id',
        'user_id',
        'monto',
        'medio_pago',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
        ];
    }

    // --- Relaciones ---

    /**
     * El cliente al que se le registró el cobro.
     */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    /**
     * El usuario (cajero/administrador) que registró el cobro.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * El movimiento en la cuenta corriente del cliente asociado a este cobro.
     */
    public function movimientoCuentaCorriente(): HasOne
    {
        return $this->hasOne(MovimientoCuentaCorrienteCliente::class, 'cobro_cliente_id');
    }

    /**
     * El movimiento en caja generado por este cobro (si aplica pago en efectivo).
     */
    public function movimientoCaja(): HasOne
    {
        return $this->hasOne(MovimientoCaja::class, 'cobro_cliente_id');
    }
}
