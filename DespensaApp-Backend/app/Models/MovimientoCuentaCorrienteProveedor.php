<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MovimientoCuentaCorrienteProveedor extends Model
{
    use HasFactory;

    protected $table = 'movimientos_cuenta_corriente_proveedores';

    protected $fillable = [
        'proveedor_id',
        'monto',
        'tipo_movimiento',
        'compra_id',
        'pago_proveedor_id',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
    ];

    /**
     * Proveedor dueño de este movimiento de cuenta corriente.
     */
    public function proveedor(): BelongsTo
    {
        return $this->belongsTo(Proveedor::class, 'proveedor_id');
    }

    /**
     * Compra que generó el débito (si aplica).
     */
    public function compra(): BelongsTo
    {
        return $this->belongsTo(Compra::class, 'compra_id');
    }
}
