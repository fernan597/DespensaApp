<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Marca extends Model
{
    protected $table = 'marcas';
    protected $fillable = [
        'nombre',
    ];
    public $timestamps = false;

    public function products()
    {
        return $this->hasMany(Product::class, 'marca_id');
    }
}
