<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoCuentaCorrienteCliente extends Model
{
    protected $table = 'movimientos_cuenta_corriente_clientes';

    protected $fillable = [
        'cliente_id',
        'monto',
        'tipo_movimiento',
        'venta_id',
        'cobro_cliente_id',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
        ];
    }

    // --- Relaciones ---

    /**
     * El cliente dueño de este movimiento de cuenta corriente.
     */
    public function cliente(): BelongsTo
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    /**
     * La venta que generó el débito (si aplica).
     */
    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    /**
     * El cobro que generó el crédito (si aplica).
     */
    public function cobroCliente(): BelongsTo
    {
        return $this->belongsTo(CobroCliente::class, 'cobro_cliente_id');
    }
}
