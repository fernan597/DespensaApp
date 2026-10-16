<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;
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
