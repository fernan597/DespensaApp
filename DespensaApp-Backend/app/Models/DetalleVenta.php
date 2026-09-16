<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleVenta extends Model
{
    protected $table = 'detalles_venta';

    protected $fillable = [
        'venta_id',
        'product_id',
        'cantidad',
        'precio_unitario',
        'subtotal',
    ];

    protected function casts(): array
    {
        return [
            'cantidad'       => 'integer',
            'precio_unitario' => 'decimal:2',
            'subtotal'       => 'decimal:2',
        ];
    }

    // --- Relaciones ---

    /**
     * La venta a la que pertenece este ítem.
     */
    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'venta_id');
    }

    /**
     * El producto referenciado en este ítem de venta.
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
