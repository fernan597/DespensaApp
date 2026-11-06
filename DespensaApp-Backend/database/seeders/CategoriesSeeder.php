<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categorias = [
            'Lácteos',
            'Pescados',
            'Quesos',
            'Carnes',
            'Frutas',
            'Verduras',
            'Cereales',
            'Bebidas',
            'Otros',
        ];

        // Idempotente: solo inserta las categorías que aún no existen.
        foreach ($categorias as $nombre) {
            DB::table('categories')->updateOrInsert(['nombre' => $nombre], []);
        }
    }
}
