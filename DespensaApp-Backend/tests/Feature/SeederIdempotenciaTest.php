<?php

namespace Tests\Feature;

use App\Models\Product;
use Database\Seeders\AdminUserSeeder;
use Database\Seeders\CategoriesSeeder;
use Database\Seeders\ClienteSeeder;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\MarcasSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Los seeders deben poder ejecutarse varias veces sin duplicar datos
 * (el entrypoint de Docker puede correr db:seed en cada despliegue).
 */
class SeederIdempotenciaTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeders_individuales_no_duplican_al_correr_dos_veces(): void
    {
        $seeders = [
            AdminUserSeeder::class,
            CategoriesSeeder::class,
            MarcasSeeder::class,
            ClienteSeeder::class,
        ];

        $this->seed($seeders);

        $conteos = [
            'users'      => DB::table('users')->count(),
            'categories' => DB::table('categories')->count(),
            'marcas'     => DB::table('marcas')->count(),
            'clientes'   => DB::table('clientes')->count(),
        ];

        $this->seed($seeders);

        foreach ($conteos as $tabla => $cantidad) {
            $this->assertSame($cantidad, DB::table($tabla)->count(), "La tabla {$tabla} se duplicó.");
        }

        $this->assertSame(9, $conteos['categories']);
        $this->assertSame(1, $conteos['marcas']);
        $this->assertSame(2, $conteos['users']);
    }

    public function test_database_seeder_no_duplica_productos_de_prueba(): void
    {
        $this->seed(DatabaseSeeder::class);
        $this->assertSame(50, Product::count());

        $this->seed(DatabaseSeeder::class);
        $this->assertSame(50, Product::count());
    }
}

