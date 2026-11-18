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
    $usuarios = [
        ['cfg' => 'admin',    'name' => 'Administrador',          'role' => 'admin'],
        ['cfg' => 'despensa', 'name' => 'Administrador Despensa', 'role' => 'admin_despensa'],
    ];

    foreach ($usuarios as $u) {
        $email    = config("admin.{$u['cfg']}.email");
        $password = config("admin.{$u['cfg']}.password");

        if (! $email || ! $password) {
            $this->command->warn("Faltan variables para '{$u['role']}', se omite.");
            continue;
        }

        User::updateOrCreate(
            ['email' => $email],
            [
                'name'     => $u['name'],
                'password' => Hash::make($password),
                'role'     => $u['role'],
            ]
        );
    }
}
}
