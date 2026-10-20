<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DetalleCompra extends Model
{
    use HasFactory;

    protected $table = 'detalles_compra';

    protected $fillable = [
        'compra_id',
        'product_id',
        'cantidad',
        'costo_adquisicion',
        'subtotal',
    ];

    protected $casts = [
        'cantidad'          => 'integer',
        'costo_adquisicion' => 'decimal:2',
        'subtotal'          => 'decimal:2',
    ];

    /**
     * Compra a la que pertenece este detalle.
     */
    public function compra(): BelongsTo
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }

    /**
     * Producto adquirido.
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
