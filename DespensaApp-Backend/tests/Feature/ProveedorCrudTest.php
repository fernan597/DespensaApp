<?php

namespace Tests\Feature;

use App\Enums\AccionAuditoria;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * ABM de proveedores: listado, detalle, alta, edición, validaciones y permisos.
 */
class ProveedorCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        Sanctum::actingAs($this->adminDespensa);
    }

    public function test_lista_proveedores_del_mas_nuevo_al_mas_viejo(): void
    {
        $viejo = Proveedor::create(['razon_social' => 'Distribuidora Vieja']);
        $nuevo = Proveedor::create(['razon_social' => 'Mayorista Nuevo']);

        $this->getJson('/api/proveedores')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $nuevo->id)
            ->assertJsonPath('data.1.id', $viejo->id);
    }

    public function test_muestra_detalle_y_404_si_no_existe(): void
    {
        $proveedor = Proveedor::create([
            'razon_social' => 'Lácteos del Sur',
            'telefono'     => '011-4444-5555',
        ]);

        $this->getJson("/api/proveedores/{$proveedor->id}")
            ->assertOk()
            ->assertJsonPath('data.razon_social', 'Lácteos del Sur')
            ->assertJsonPath('data.telefono', '011-4444-5555');

        $this->getJson('/api/proveedores/999999')->assertNotFound();
    }

    public function test_crea_proveedor_y_queda_auditado(): void
    {
        $this->postJson('/api/proveedores', [
            'razon_social' => 'Bebidas SRL',
            'telefono'     => '351-555-0000',
            'direccion'    => 'Av. Siempre Viva 742',
        ])
            ->assertCreated()
            ->assertJsonPath('data.razon_social', 'Bebidas SRL');

        $this->assertDatabaseHas('proveedores', ['razon_social' => 'Bebidas SRL']);
        $this->assertDatabaseHas('auditorias', [
            'user_id' => $this->adminDespensa->id,
            'accion'  => AccionAuditoria::CREAR_PROVEEDOR->value,
        ]);
    }

    public function test_valida_campos_al_crear(): void
    {
        $this->postJson('/api/proveedores', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('razon_social');

        $this->postJson('/api/proveedores', [
            'razon_social'   => str_repeat('x', 151),
            'telefono'       => str_repeat('1', 51),
            'saldo_adeudado' => -10,
            'activo'         => 'quizas',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['razon_social', 'telefono', 'saldo_adeudado', 'activo']);

        $this->assertDatabaseCount('proveedores', 0);
    }

    public function test_actualiza_proveedor_y_queda_auditado(): void
    {
        $proveedor = Proveedor::create(['razon_social' => 'Nombre Viejo']);

        $this->putJson("/api/proveedores/{$proveedor->id}", [
            'razon_social' => 'Nombre Nuevo',
            'telefono'     => '123',
        ])
            ->assertOk()
            ->assertJsonPath('data.razon_social', 'Nombre Nuevo');

        $this->assertDatabaseHas('proveedores', [
            'id'           => $proveedor->id,
            'razon_social' => 'Nombre Nuevo',
        ]);
        $this->assertDatabaseHas('auditorias', [
            'accion' => AccionAuditoria::ACTUALIZAR_PROVEEDOR->value,
        ]);
    }

    public function test_no_elimina_proveedor_con_saldo_adeudado(): void
    {
        $proveedor = Proveedor::create([
            'razon_social'   => 'Con Deuda',
            'saldo_adeudado' => 1500.00,
        ]);

        $this->deleteJson("/api/proveedores/{$proveedor->id}")->assertStatus(409);
        $this->assertNotSoftDeleted('proveedores', ['id' => $proveedor->id]);
    }

    public function test_empleado_y_admin_sistema_no_acceden_a_proveedores(): void
    {
        $proveedor = Proveedor::create(['razon_social' => 'Privado']);

        foreach (['empleado', 'admin'] as $rol) {
            Sanctum::actingAs(User::factory()->create(['role' => $rol]));

            $this->getJson('/api/proveedores')->assertForbidden();
            $this->postJson('/api/proveedores', ['razon_social' => 'X'])->assertForbidden();
            $this->putJson("/api/proveedores/{$proveedor->id}", ['razon_social' => 'X'])->assertForbidden();
            $this->deleteJson("/api/proveedores/{$proveedor->id}")->assertForbidden();
        }
    }
}

