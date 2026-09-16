<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'nombre',
        'apellido',
        'telefono',
        'direccion',
        'saldo_cuenta_corriente',
    ];

    protected function casts(): array
    {
        return [
            'saldo_cuenta_corriente' => 'decimal:2',
        ];
    }

    // --- Relaciones ---

    /**
     * Ventas asociadas a este cliente.
     */
    public function ventas(): HasMany
    {
        return $this->hasMany(Venta::class, 'cliente_id');
    }

    /**
     * Cobros de cuenta corriente realizados a este cliente.
     */
    public function cobros(): HasMany
    {
        return $this->hasMany(CobroCliente::class, 'cliente_id');
    }

    /**
     * Movimientos del libro de cuenta corriente del cliente
     * (débitos = ventas fiadas, créditos = pagos recibidos).
     */
    public function movimientosCuentaCorriente(): HasMany
    {
        return $this->hasMany(MovimientoCuentaCorrienteCliente::class, 'cliente_id');
    }
}
