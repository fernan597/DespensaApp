<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    protected $table = 'categories';
    protected $fillable = [
        'nombre',
    ];
    public $timestamps = false;

    public function products()
    {
        return $this->hasMany(Product::class, 'categoria_id');
    }
}
