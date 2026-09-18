<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Category;
use App\Models\Marca;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Generamos un costo base de compra creíble
        $precioCompra = fake()->randomFloat(2, 500, 15000);
        // Margen de ganancia simulado entre 25% y 40%
        $precioVenta = round($precioCompra * fake()->randomFloat(2, 1.25, 1.40), 2);
        return [
            'nombre'        => fake()->words(3, true),
            'codigo_barra'  => fake()->unique()->ean13(), // Genera código EAN-13 realista para el lector
            'stock_actual'  => fake()->numberBetween(5, 100),
            'stock_minimo'  => fake()->numberBetween(3, 10),
            'precio_compra' => $precioCompra,
            'precio_venta'  => $precioVenta,

            // Si existen registros toma uno al azar, sino crea uno nuevo
            'categoria_id'  => Category::inRandomOrder()->first()->id,
            'marca_id'      => Marca::inRandomOrder()->first()->id,
        ];
    }
}
