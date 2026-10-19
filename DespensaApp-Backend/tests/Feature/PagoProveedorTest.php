<?php

namespace Tests\Feature;

use App\Models\Caja;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\PagoProveedor;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PagoProveedorTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private User $empleado;
    private Proveedor $proveedor;
    private Caja $caja;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create([
            'role' => 'admin_despensa',
        ]);

        $this->empleado = User::factory()->create([
            'role' => 'empleado',
        ]);

        $this->proveedor = Proveedor::create([
            'razon_social'   => 'Distribuidora Central S.A.',
            'telefono'       => '1133445566',
            'direccion'      => 'Ruta 8 Km 50',
            'saldo_adeudado' => 5000.00,
            'activo'         => true,
        ]);

        $this->caja = Caja::create([
            'usuario_apertura_id' => $this->adminDespensa->id,
            'saldo_inicial'       => 10000.00,
            'fecha_apertura'      => now(),
            'estado'              => 'ABIERTA',
        ]);
    }

    public function test_pago_efectivo_exitoso_reduce_deuda_y_egresa_de_caja(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 2000.00,
            'medio_pago'   => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Pago a proveedor registrado exitosamente.')
            ->assertJsonPath('data.pago.monto', '2000.00')
            ->assertJsonPath('data.pago.medio_pago', 'EFECTIVO')
            ->assertJsonPath('data.proveedor.saldo_adeudado', '3000.00');

        // 1. Verifica registro de PagoProveedor
        $this->assertDatabaseHas('pagos_proveedores', [
            'proveedor_id' => $this->proveedor->id,
            'user_id'      => $this->adminDespensa->id,
            'monto'        => 2000.00,
            'medio_pago'   => 'EFECTIVO',
        ]);

        $pago = PagoProveedor::first();

        // 2. Verifica movimiento contable en la Cuenta Corriente (CRÉDITO)
        $this->assertDatabaseHas('movimientos_cuenta_corriente_proveedores', [
            'proveedor_id'      => $this->proveedor->id,
            'monto'             => 2000.00,
            'tipo_movimiento'   => 'CREDITO',
            'pago_proveedor_id' => $pago->id,
        ]);

        // 3. Verifica saldo adeudado del proveedor reducido
        $this->assertEquals(3000.00, (float) $this->proveedor->fresh()->saldo_adeudado);

        // 4. Verifica egreso registrado en la caja activa
        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id'           => $this->caja->id,
            'monto'             => 2000.00,
            'tipo'              => 'EGRESO_PAGO_PROVEEDOR',
            'pago_proveedor_id' => $pago->id,
        ]);

        // 5. Verifica que el saldo esperado de la caja disminuyó
        $this->assertSame('8000.00', $this->caja->fresh()->saldoEsperado());
    }

    public function test_pago_transferencia_exitoso_no_afecta_caja(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 1500.00,
            'medio_pago'   => 'TRANSFERENCIA',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.proveedor.saldo_adeudado', '3500.00');

        // Verifica que no se generó ningún movimiento de caja
        $this->assertDatabaseCount('movimientos_caja', 0);
        $this->assertSame('10000.00', $this->caja->fresh()->saldoEsperado());

        // Verifica que la deuda sí disminuyó
        $this->assertEquals(3500.00, (float) $this->proveedor->fresh()->saldo_adeudado);
    }

    public function test_falla_si_pago_efectivo_y_caja_esta_cerrada(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        // Cerramos la caja
        $this->caja->update(['estado' => 'CERRADA', 'fecha_cierre' => now()]);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 1000.00,
            'medio_pago'   => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['message' => 'No hay una caja abierta para registrar el pago en efectivo. Debe abrir una caja primero.']);

        $this->assertDatabaseCount('pagos_proveedores', 0);
        $this->assertEquals(5000.00, (float) $this->proveedor->fresh()->saldo_adeudado);
    }

    public function test_falla_si_fondos_en_caja_son_insuficientes(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        // Caja abierta pero solo con $ 500 de saldo
        $this->caja->update(['saldo_inicial' => 500.00]);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 1000.00,
            'medio_pago'   => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment(['message' => 'Fondos insuficientes en la caja activa para registrar el pago en efectivo.']);

        $this->assertDatabaseCount('pagos_proveedores', 0);
        $this->assertEquals(5000.00, (float) $this->proveedor->fresh()->saldo_adeudado);
    }

    public function test_falla_si_monto_supera_deuda_del_proveedor(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 6000.00, // Deuda es 5000.00
            'medio_pago'   => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('pagos_proveedores', 0);
        $this->assertEquals(5000.00, (float) $this->proveedor->fresh()->saldo_adeudado);
    }

    public function test_falla_si_monto_es_menor_o_igual_a_cero(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 0.00,
            'medio_pago'   => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['monto']);

        $this->assertDatabaseCount('pagos_proveedores', 0);
    }

    public function test_falla_si_proveedor_no_posee_deuda(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $this->proveedor->update(['saldo_adeudado' => 0.00]);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 500.00,
            'medio_pago'   => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('pagos_proveedores', 0);
    }

    public function test_empleado_no_puede_registrar_pago_a_proveedor(): void
    {
        Sanctum::actingAs($this->empleado);

        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 1000.00,
            'medio_pago'   => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/pagos-proveedores', $payload);

        $response->assertStatus(403);
        $this->assertDatabaseCount('pagos_proveedores', 0);
    }
}
