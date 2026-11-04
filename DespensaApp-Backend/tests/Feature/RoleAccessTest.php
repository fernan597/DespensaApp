<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Matriz de acceso por rol.
 *
 * admin: administrador de la plataforma, sin acceso a funcionalidad de comercio.
 * admin_despensa / empleado: operan el comercio.
 */
class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_admin_puede_acceder_a_gestion_de_usuarios(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/users')->assertOk();
    }

    public function test_admin_no_puede_acceder_al_catalogo_de_productos(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/products')->assertForbidden();
    }

    public function test_admin_no_puede_acceder_a_alertas_de_stock(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/alertas/stock-minimo')->assertForbidden();
    }

    public function test_admin_no_puede_acceder_al_estado_de_caja(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/caja/estado')->assertForbidden();
    }

    public function test_admin_no_puede_registrar_ventas(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/ventas/contado', [
            'medio_pago' => 'EFECTIVO',
            'items'      => [['producto_id' => 1, 'cantidad' => 1]],
        ])->assertForbidden();
    }

    public function test_admin_despensa_y_empleado_acceden_al_catalogo(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin_despensa']));
        $this->getJson('/api/products')->assertOk();

        Sanctum::actingAs(User::factory()->create(['role' => 'empleado']));
        $this->getJson('/api/products')->assertOk();
    }

    public function test_empleado_no_puede_acceder_a_gestion_de_usuarios(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'empleado']));

        $this->getJson('/api/users')->assertForbidden();
    }

    public function test_admin_despensa_accede_a_precios_y_empleado_no(): void
    {
        $payload = [
            'modo'          => 'individual',
            'product_id'    => 1,
            'precio_compra' => 100,
            'precio_venta'  => 150,
        ];

        Sanctum::actingAs(User::factory()->create(['role' => 'admin_despensa']));
        // La autorización pasa; el producto inexistente se resuelve como 404.
        $this->putJson('/api/products/precios', $payload)->assertNotFound();

        Sanctum::actingAs(User::factory()->create(['role' => 'empleado']));
        $this->putJson('/api/products/precios', $payload)->assertForbidden();
    }
}
