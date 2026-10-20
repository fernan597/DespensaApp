<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Compra extends Model
{
    use HasFactory;

    protected $table = 'compras';

    protected $fillable = [
        'user_id',
        'proveedor_id',
        'numero_comprobante',
        'total',
        'tipo_pago',
        'pendiente_pago',
        'estado',
    ];

    protected $casts = [
        'total'          => 'decimal:2',
        'pendiente_pago' => 'boolean',
    ];

    /**
     * Usuario que registró la compra.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Proveedor al que se le realizó la compra.
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /**
     * Detalles de productos incluidos en la compra.
     */
    public function detalles(): HasMany
    {
        return $this->hasMany(DetalleCompra::class, 'compra_id');
    }

    /**
     * Movimiento en cuenta corriente del proveedor asociado (si fue a crédito).
     */
    public function movimientoCuentaCorriente(): HasOne
    {
        return $this->hasOne(MovimientoCuentaCorrienteProveedor::class, 'compra_id');
    }
}
