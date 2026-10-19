<?php

namespace App\Models;

use App\Enums\TipoMovimientoCaja;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoCaja extends Model
{
    protected $table = 'movimientos_caja';

    protected $fillable = [
        'caja_id',
        'user_id',
        'monto',
        'tipo',
        'concepto',
        'venta_id',
        'cobro_cliente_id',
        'pago_proveedor_id',
        'compra_id',
    ];

    protected function casts(): array
    {
        return [
            'monto' => 'decimal:2',
            'tipo'  => TipoMovimientoCaja::class,
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

    /**
     * El usuario que registró este movimiento de caja.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * La compra de mercadería que generó este egreso (si aplica).
     */
    public function compra(): BelongsTo
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }
}
