<?php

namespace Tests\Feature;

use App\Enums\AccionAuditoria;
use App\Models\Cliente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * ABM de clientes: listado, búsqueda, detalle, alta, edición, baja lógica, validaciones y permisos.
 */
class ClienteCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        Sanctum::actingAs($this->adminDespensa);
    }

    public function test_lista_clientes_ordenados_y_permite_busqueda(): void
    {
        Cliente::create(['nombre' => 'Zulma', 'apellido' => 'Gómez', 'telefono' => '111']);
        Cliente::create(['nombre' => 'Ana', 'apellido' => 'Pérez', 'telefono' => '222']);

        $this->getJson('/api/clientes')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'clientes')
            ->assertJsonPath('clientes.0.nombre', 'Ana')
            ->assertJsonPath('clientes.1.nombre', 'Zulma');

        $this->getJson('/api/clientes?search=Zulma')
            ->assertOk()
            ->assertJsonCount(1, 'clientes')
            ->assertJsonPath('clientes.0.nombre', 'Zulma');
    }

    public function test_muestra_detalle_y_404_si_no_existe(): void
    {
        $cliente = Cliente::create([
            'nombre'    => 'Carlos',
            'apellido'  => 'López',
            'telefono'  => '011-4444-5555',
            'direccion' => 'Av. Belgrano 123',
        ]);

        $this->getJson("/api/clientes/{$cliente->id}")
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Carlos')
            ->assertJsonPath('data.apellido', 'López')
            ->assertJsonPath('data.nombre_completo', 'Carlos López')
            ->assertJsonPath('data.telefono', '011-4444-5555');

        $this->getJson('/api/clientes/999999')->assertNotFound();
    }

    public function test_crea_cliente_con_saldo_cero_y_queda_auditado(): void
    {
        $this->postJson('/api/clientes', [
            'nombre'    => 'María',
            'apellido'  => 'Rodríguez',
            'telefono'  => '351-555-0000',
            'direccion' => 'Av. Siempre Viva 742',
        ])
            ->assertCreated()
            ->assertJsonPath('data.nombre', 'María')
            ->assertJsonPath('data.apellido', 'Rodríguez')
            ->assertJsonPath('data.nombre_completo', 'María Rodríguez')
            ->assertJsonPath('data.estado_cuenta', 'AL_DIA');

        $this->assertDatabaseHas('clientes', [
            'nombre'                 => 'María',
            'apellido'               => 'Rodríguez',
            'saldo_cuenta_corriente' => 0.00,
        ]);
        $this->assertDatabaseHas('auditorias', [
            'user_id' => $this->adminDespensa->id,
            'accion'  => AccionAuditoria::CREAR_CLIENTE->value,
        ]);
    }

    public function test_valida_campos_al_crear(): void
    {
        $this->postJson('/api/clientes', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('nombre');

        $this->postJson('/api/clientes', [
            'nombre'    => str_repeat('a', 101),
            'apellido'  => str_repeat('b', 101),
            'telefono'  => str_repeat('1', 51),
            'direccion' => str_repeat('d', 256),
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['nombre', 'apellido', 'telefono', 'direccion']);

        $this->assertDatabaseCount('clientes', 0);
    }

    public function test_actualiza_cliente_y_queda_auditado(): void
    {
        $cliente = Cliente::create(['nombre' => 'Nombre Viejo', 'apellido' => 'Apellido Viejo']);

        $this->putJson("/api/clientes/{$cliente->id}", [
            'nombre'   => 'Nombre Nuevo',
            'apellido' => 'Apellido Nuevo',
            'telefono' => '123456',
        ])
            ->assertOk()
            ->assertJsonPath('data.nombre', 'Nombre Nuevo')
            ->assertJsonPath('data.apellido', 'Apellido Nuevo');

        $this->assertDatabaseHas('clientes', [
            'id'       => $cliente->id,
            'nombre'   => 'Nombre Nuevo',
            'apellido' => 'Apellido Nuevo',
            'telefono' => '123456',
        ]);
        $this->assertDatabaseHas('auditorias', [
            'accion' => AccionAuditoria::ACTUALIZAR_CLIENTE->value,
        ]);
    }

    public function test_elimina_cliente_sin_deuda_y_queda_auditado(): void
    {
        $cliente = Cliente::create([
            'nombre'                 => 'Cliente Al Día',
            'saldo_cuenta_corriente' => 0.00,
        ]);

        $this->deleteJson("/api/clientes/{$cliente->id}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('clientes', ['id' => $cliente->id]);
        $this->assertDatabaseHas('auditorias', [
            'accion' => AccionAuditoria::ELIMINAR_CLIENTE->value,
        ]);
    }

    public function test_no_elimina_cliente_con_saldo_adeudado(): void
    {
        $cliente = Cliente::create([
            'nombre'                 => 'Cliente Deudor',
            'saldo_cuenta_corriente' => 1500.00,
        ]);

        $this->deleteJson("/api/clientes/{$cliente->id}")->assertStatus(409);
        $this->assertNotSoftDeleted('clientes', ['id' => $cliente->id]);
    }

    public function test_permisos_por_rol_en_clientes(): void
    {
        $cliente = Cliente::create(['nombre' => 'Juan']);

        // Empleado puede listar (para selector de POS), pero no crear, editar, ver detalle individual ni eliminar
        Sanctum::actingAs(User::factory()->create(['role' => 'empleado']));
        $this->getJson('/api/clientes')->assertOk();
        $this->getJson("/api/clientes/{$cliente->id}")->assertForbidden();
        $this->postJson('/api/clientes', ['nombre' => 'Nuevo'])->assertForbidden();
        $this->putJson("/api/clientes/{$cliente->id}", ['nombre' => 'Editado'])->assertForbidden();
        $this->deleteJson("/api/clientes/{$cliente->id}")->assertForbidden();

        // Admin de sistema no accede a ninguna ruta comercial de clientes
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/clientes')->assertForbidden();
        $this->getJson("/api/clientes/{$cliente->id}")->assertForbidden();
        $this->postJson('/api/clientes', ['nombre' => 'Nuevo'])->assertForbidden();
        $this->putJson("/api/clientes/{$cliente->id}", ['nombre' => 'Editado'])->assertForbidden();
        $this->deleteJson("/api/clientes/{$cliente->id}")->assertForbidden();
    }
}
