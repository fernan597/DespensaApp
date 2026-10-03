<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proveedor extends Model
{
    use HasFactory;

    protected $table = 'proveedores';
    
    public $timestamps = true; 

    protected $fillable = [
        'razon_social',
        'telefono',
        'direccion',
        'saldo_adeudado',
    ];

    protected $casts = [
        'saldo_adeudado' => 'decimal:2',
    ];

    public function products()
    {
        return $this->hasMany(Product::class, 'proveedor_id');
    }
}
