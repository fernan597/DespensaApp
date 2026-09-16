<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AlertaStock extends Model
{
    protected $table = 'alertas_stock';

    protected $fillable = [
        'product_id',
        'mensaje',
        'atendida',
    ];

    protected function casts(): array
    {
        return [
            'atendida' => 'boolean',
        ];
    }

    // --- Relaciones ---

    /**
     * El producto al que pertenece esta alerta de stock mínimo.
     */
    public function producto(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id');
    }
}
