<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'admin@despensa.com'],
            [
                'name'     => 'Administrador',
                'password' => Hash::make('admin1234'),
                'role'     => 'admin',
            ]
        );
        User::updateOrCreate(
            ['email' => 'despensa@gmail.com'],
            [
                'name'     => 'Administrador Despensa',
                'password' => Hash::make('admindespensa1234'),
                'role'     => 'admin_despensa',
            ]
        );
    }
}
