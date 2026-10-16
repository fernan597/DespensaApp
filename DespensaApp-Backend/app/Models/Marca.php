<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Marca extends Model
{
    use SoftDeletes;
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
