<?php

namespace Tests\Feature;

use App\Enums\AccionAuditoria;
use App\Models\Auditoria;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AuditoriaTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $adminDespensa;
    private User $empleado;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'name'  => 'Admin Sistema',
            'email' => 'admin@despensa.com',
            'role'  => 'admin',
        ]);

        $this->adminDespensa = User::factory()->create([
            'name'  => 'Admin Negocio',
            'email' => 'negocio@despensa.com',
            'role'  => 'admin_despensa',
        ]);

        $this->empleado = User::factory()->create([
            'name'  => 'Cajero Uno',
            'email' => 'cajero@despensa.com',
            'role'  => 'empleado',
        ]);
    }

    private function crearAuditoria(
        AccionAuditoria $accion,
        ?User $user = null,
        ?string $detalle = null,
        ?string $fecha = null
    ): Auditoria {
        $auditoria = new Auditoria();
        $auditoria->forceFill([
            'user_id' => ($user ?? $this->admin)->id,
            'accion'  => $accion->value,
            'detalle' => $detalle ?? $accion->label(),
        ]);

        if ($fecha) {
            $auditoria->created_at = $fecha;
            $auditoria->updated_at = $fecha;
        }

        $auditoria->save();

        return $auditoria;
    }

    public function test_admin_y_admin_despensa_pueden_listar_la_bitacora(): void
    {
        $this->crearAuditoria(AccionAuditoria::INICIO_SESION, $this->admin);
        $this->crearAuditoria(AccionAuditoria::ABRIR_CAJA, $this->adminDespensa);

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/auditorias')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonStructure([
                'data' => [[
                    'id',
                    'accion',
                    'accion_label',
                    'categoria',
                    'detalle',
                    'created_at',
                    'usuario' => ['id', 'name', 'email', 'role'],
                ]],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        Sanctum::actingAs($this->adminDespensa);
        $this->getJson('/api/auditorias')
            ->assertOk()
            ->assertJsonCount(2, 'data');
    }

    public function test_empleado_no_puede_consultar_la_bitacora(): void
    {
        $auditoria = $this->crearAuditoria(AccionAuditoria::VENTA_CONTADO, $this->empleado);

        Sanctum::actingAs($this->empleado);

        $this->getJson('/api/auditorias')->assertForbidden();
        $this->getJson('/api/auditorias/filtros')->assertForbidden();
        $this->getJson("/api/auditorias/{$auditoria->id}")->assertForbidden();
    }

    public function test_usuario_no_autenticado_recibe_401(): void
    {
        $this->getJson('/api/auditorias')->assertUnauthorized();
    }

    public function test_filtra_por_usuario_accion_y_rango_de_fechas(): void
    {
        $this->crearAuditoria(AccionAuditoria::INICIO_SESION, $this->admin, 'Ingreso admin.', '2026-11-01 10:00:00');
        $this->crearAuditoria(AccionAuditoria::VENTA_CONTADO, $this->empleado, 'Venta 1.', '2026-11-03 12:00:00');
        $this->crearAuditoria(AccionAuditoria::VENTA_CONTADO, $this->admin, 'Venta 2.', '2026-11-05 09:00:00');

        Sanctum::actingAs($this->admin);

        $this->getJson("/api/auditorias?user_id={$this->admin->id}")
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/auditorias?accion=VENTA_CONTADO')
            ->assertOk()
            ->assertJsonCount(2, 'data');

        $this->getJson('/api/auditorias?fecha_desde=2026-11-03&fecha_hasta=2026-11-03')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.detalle', 'Venta 1.');
    }

    public function test_busca_por_detalle_y_por_usuario(): void
    {
        $this->crearAuditoria(AccionAuditoria::ACTUALIZAR_PRECIOS, $this->admin, 'Ajuste de precios de la categoría Almacén.');
        $this->crearAuditoria(AccionAuditoria::VENTA_CONTADO, $this->empleado, 'Venta de mostrador.');

        Sanctum::actingAs($this->admin);

        $this->getJson('/api/auditorias?search=Almacén')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->getJson('/api/auditorias?search=Cajero Uno')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.detalle', 'Venta de mostrador.');
    }

    public function test_devuelve_el_catalogo_de_filtros(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/auditorias/filtros')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'usuarios' => [['id', 'name', 'email', 'role']],
                    'acciones' => [['value', 'label', 'categoria']],
                ],
            ]);

        $this->assertCount(count(AccionAuditoria::cases()), $response->json('data.acciones'));
    }

    public function test_muestra_el_detalle_de_un_registro(): void
    {
        $auditoria = $this->crearAuditoria(
            AccionAuditoria::PAGO_PROVEEDOR,
            $this->adminDespensa,
            'Pago #7 a Proveedor S.A. por $ 8000.00.'
        );

        Sanctum::actingAs($this->admin);

        $this->getJson("/api/auditorias/{$auditoria->id}")
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.id', $auditoria->id)
            ->assertJsonPath('data.accion', 'PAGO_PROVEEDOR')
            ->assertJsonPath('data.accion_label', 'Pago a proveedor')
            ->assertJsonPath('data.usuario.id', $this->adminDespensa->id);

        $this->getJson('/api/auditorias/999999')->assertNotFound();
    }

    public function test_rechaza_filtros_invalidos(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/auditorias?accion=ACCION_INEXISTENTE')
            ->assertStatus(422);

        $this->getJson('/api/auditorias?fecha_desde=2026-11-10&fecha_hasta=2026-11-01')
            ->assertStatus(422);
    }

    public function test_registra_inicio_de_sesion_exitoso(): void
    {
        $user = User::factory()->create([
            'email'    => 'login@despensa.com',
            'password' => bcrypt('password123'),
            'role'     => 'admin',
        ]);

        $this->postJson('/api/login', [
            'email'    => 'login@despensa.com',
            'password' => 'password123',
        ])->assertOk();

        $this->assertDatabaseHas('auditorias', [
            'user_id' => $user->id,
            'accion'  => AccionAuditoria::INICIO_SESION->value,
        ]);
    }

    public function test_registra_login_fallido_sin_guardar_la_contrasena(): void
    {
        $user = User::factory()->create([
            'email'    => 'login@despensa.com',
            'password' => bcrypt('password123'),
            'role'     => 'admin',
        ]);

        $this->postJson('/api/login', [
            'email'    => 'login@despensa.com',
            'password' => 'incorrecta',
        ])->assertUnauthorized();

        $this->assertDatabaseHas('auditorias', [
            'user_id' => $user->id,
            'accion'  => AccionAuditoria::INICIO_SESION_FALLIDO->value,
        ]);

        $this->assertDatabaseMissing('auditorias', ['detalle' => 'incorrecta']);
        $this->assertStringNotContainsString('incorrecta', Auditoria::first()->detalle);
    }

    public function test_registra_login_fallido_de_email_inexistente(): void
    {
        $this->postJson('/api/login', [
            'email'    => 'nadie@despensa.com',
            'password' => 'password123',
        ])->assertUnauthorized();

        $this->assertDatabaseHas('auditorias', [
            'user_id' => null,
            'accion'  => AccionAuditoria::INICIO_SESION_FALLIDO->value,
        ]);
    }

    public function test_los_registros_son_inmutables(): void
    {
        $auditoria = $this->crearAuditoria(AccionAuditoria::VENTA_CONTADO);

        try {
            $auditoria->update(['detalle' => 'alterado']);
            $this->fail('Se permitió modificar un registro de auditoría.');
        } catch (\LogicException $e) {
            $this->assertTrue(true);
        }

        try {
            $auditoria->delete();
            $this->fail('Se permitió eliminar un registro de auditoría.');
        } catch (\LogicException $e) {
            $this->assertTrue(true);
        }

        $this->assertDatabaseHas('auditorias', ['id' => $auditoria->id]);
    }

    public function test_registra_creacion_y_eliminacion_de_usuario(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/users', [
            'name'                  => 'Nuevo Empleado',
            'email'                 => 'nuevo@despensa.com',
            'password'              => 'password123',
            'password_confirmation' => 'password123',
            'role'                  => 'empleado',
        ])->assertCreated();

        $nuevoId = $response->json('user.id');

        $this->assertDatabaseHas('auditorias', [
            'user_id' => $this->admin->id,
            'accion'  => AccionAuditoria::CREAR_USUARIO->value,
        ]);

        $this->deleteJson("/api/users/{$nuevoId}")->assertOk();

        $this->assertDatabaseHas('auditorias', [
            'user_id' => $this->admin->id,
            'accion'  => AccionAuditoria::ELIMINAR_USUARIO->value,
        ]);
    }

    public function test_registra_apertura_de_caja(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $this->postJson('/api/caja/abrir', [
            'saldo_inicial' => '1500.00',
        ])->assertCreated();

        $this->assertDatabaseHas('auditorias', [
            'user_id' => $this->adminDespensa->id,
            'accion'  => AccionAuditoria::ABRIR_CAJA->value,
        ]);
    }
}
