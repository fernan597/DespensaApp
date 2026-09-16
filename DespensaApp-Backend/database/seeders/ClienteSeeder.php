<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ClienteSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('clientes')->insertOrIgnore([
            [
                'id' => 1,
                'nombre' => 'Consumidor',
                'apellido' => 'Final',
                'telefono' => null,
                'direccion' => null,
                'saldo_cuenta_corriente' => 0.00,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
