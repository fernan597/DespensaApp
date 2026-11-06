<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            AdminUserSeeder::class,
            CategoriesSeeder::class,
            MarcasSeeder::class,
            ClienteSeeder::class,
        ]);

        // Productos de prueba: solo si la tabla está vacía, para no duplicar en cada corrida.
        if (\App\Models\Product::count() === 0) {
            \App\Models\Product::factory(50)->create();
        }
    }
}
