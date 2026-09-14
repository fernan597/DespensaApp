<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    
    protected $table = 'products';
    public $timestamps = false;
    protected $fillable = [
        'nombre',
        'codigo_barra',
        'stock_actual',
        'stock_minimo',
        'precio_compra',
        'precio_venta',
        'categoria_id',
        'marca_id',
    ];

    public function categoria()
    {
        return $this->belongsTo(Category::class, 'categoria_id');
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }
}
