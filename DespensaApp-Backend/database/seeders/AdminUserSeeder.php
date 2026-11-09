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
        $adminEmail = env('ADMIN_EMAIL');
        $adminPassword = env('ADMIN_PASSWORD');

        $despensaEmail = env('ADMIN_DESPENSA_EMAIL');
        $despensaPassword = env('ADMIN_DESPENSA_PASSWORD');

        User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name'     => 'Administrador',
                'password' => Hash::make($adminPassword),
                'role'     => 'admin',
            ]
        );
        User::updateOrCreate(
            ['email' => $despensaEmail],
            [
                'name'     => 'Administrador Despensa',
                'password' => Hash::make($despensaPassword),
                'role'     => 'admin_despensa',
            ]
        );
    }
}
