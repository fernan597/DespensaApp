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
    }
}
