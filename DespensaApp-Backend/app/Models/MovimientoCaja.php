<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoCaja extends Model
{
    protected $table = 'movimientos_caja';

    protected $fillable = [
        'caja_id',
        'monto',
        'tipo',
        'concepto',
        'venta_id',
        'cobro_cliente_id',
        'pago_proveedor_id',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
        ];
    }

    // --- Relaciones ---

    /**
     * La caja a la que pertenece este movimiento.
     */
    public function caja(): BelongsTo
    {
        return $this->belongsTo(Caja::class, 'caja_id');
    }

    /**
     * La venta que generó este movimiento (si aplica).
     */
    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    /**
     * El cobro a cliente que generó este movimiento (si aplica).
     */
    public function cobroCliente(): BelongsTo
    {
        return $this->belongsTo(CobroCliente::class, 'cobro_cliente_id');
    }

    /**
     * El pago a proveedor que generó este movimiento (si aplica).
     */
    public function pagoProveedor(): BelongsTo
    {
        return $this->belongsTo(PagoProveedor::class, 'pago_proveedor_id');
    }
}
