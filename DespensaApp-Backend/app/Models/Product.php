<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\Category;
use App\Models\Marca;


class Product extends Model
{
    use HasFactory, SoftDeletes;
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

    protected $casts = [
        'stock_actual'  => 'integer',
        'stock_minimo'  => 'integer',
        'precio_compra' => 'decimal:2',
        'precio_venta'  => 'decimal:2',
    ];

    public function categoria()
    {
        return $this->belongsTo(Category::class, 'categoria_id');
    }

    public function marca()
    {
        return $this->belongsTo(Marca::class, 'marca_id');
    }

    public function detallesCompra()
    {
        return $this->hasMany(DetalleCompra::class, 'product_id');
    }
}
