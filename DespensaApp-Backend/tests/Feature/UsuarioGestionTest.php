<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Gestión de usuarios por el Administrador del Sistema.
 */
class UsuarioGestionTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($this->admin);
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'name'                  => 'Cajero Nuevo',
            'email'                 => 'cajero.nuevo@despensa.com',
            'password'              => 'secreto123',
            'password_confirmation' => 'secreto123',
            'role'                  => 'empleado',
        ], $override);
    }

    public function test_crea_usuario_con_contrasena_hasheada_y_sin_exponerla(): void
    {
        $response = $this->postJson('/api/users', $this->payload())
            ->assertCreated()
            ->assertJsonPath('user.email', 'cajero.nuevo@despensa.com')
            ->assertJsonPath('user.role', 'empleado')
            ->assertJsonMissingPath('user.password');

        $user = User::find($response->json('user.id'));

        $this->assertNotSame('secreto123', $user->password);
        $this->assertTrue(Hash::check('secreto123', $user->password));
    }

    public function test_el_usuario_creado_puede_iniciar_sesion(): void
    {
        $this->postJson('/api/users', $this->payload())->assertCreated();

        $this->postJson('/api/login', [
            'email'    => 'cajero.nuevo@despensa.com',
            'password' => 'secreto123',
        ])->assertOk()->assertJsonStructure(['token']);
    }

    public function test_rechaza_email_duplicado(): void
    {
        User::factory()->create(['email' => 'repetido@despensa.com']);

        $this->postJson('/api/users', $this->payload(['email' => 'repetido@despensa.com']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_rechaza_rol_invalido(): void
    {
        $this->postJson('/api/users', $this->payload(['role' => 'superusuario']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('role');
    }

    public function test_rechaza_contrasena_corta_o_sin_confirmar(): void
    {
        $this->postJson('/api/users', $this->payload([
            'password' => '123', 'password_confirmation' => '123',
        ]))->assertStatus(422)->assertJsonValidationErrors('password');

        $this->postJson('/api/users', $this->payload([
            'password_confirmation' => 'otra-distinta',
        ]))->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_rechaza_email_con_formato_invalido_y_campos_vacios(): void
    {
        $this->postJson('/api/users', $this->payload(['email' => 'no-es-un-email']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');

        $this->postJson('/api/users', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }

    public function test_listado_no_incluye_administradores_del_sistema(): void
    {
        User::factory()->create(['role' => 'admin_despensa']);
        User::factory()->create(['role' => 'empleado']);
        User::factory()->create(['role' => 'admin']);

        $this->getJson('/api/users')
            ->assertOk()
            ->assertJsonCount(2, 'users');
    }

    public function test_admin_despensa_no_puede_gestionar_usuarios(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin_despensa']));

        $this->getJson('/api/users')->assertForbidden();
        $this->postJson('/api/users', $this->payload())->assertForbidden();
    }
}

