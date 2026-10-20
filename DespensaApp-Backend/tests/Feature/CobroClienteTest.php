<?php

namespace Tests\Feature;

use App\Models\Caja;
use App\Models\Cliente;
use App\Models\CobroCliente;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteCliente;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CobroClienteTest extends TestCase
{
    use RefreshDatabase;

    private User $empleado;
    private Cliente $cliente;
    private Caja $caja;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create([
            'role' => 'empleado',
        ]);

        Sanctum::actingAs($this->empleado);

        $this->cliente = Cliente::create([
            'nombre'                 => 'Marcos',
            'apellido'               => 'Perez',
            'telefono'               => '1122334455',
            'direccion'              => 'Av. Siempre Viva 742',
            'saldo_cuenta_corriente' => 5000.00,
        ]);

        $this->caja = Caja::create([
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => 1000.00,
            'fecha_apertura'      => now(),
            'estado'              => 'ABIERTA',
        ]);
    }

    public function test_cobro_efectivo_exitoso_camino_feliz(): void
    {
        $payload = [
            'cliente_id' => $this->cliente->id,
            'monto'      => 2000.00,
            'medio_pago' => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/cobros-clientes', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Cobro registrado exitosamente.')
            ->assertJsonPath('data.cobro.monto', 2000)
            ->assertJsonPath('data.cobro.medio_pago', 'EFECTIVO')
            ->assertJsonPath('data.cliente.saldo_cuenta_corriente', 3000);

        // 1. Verificar CobroCliente
        $this->assertDatabaseHas('cobros_clientes', [
            'cliente_id' => $this->cliente->id,
            'user_id'    => $this->empleado->id,
            'monto'      => 2000.00,
            'medio_pago' => 'EFECTIVO',
        ]);

        // 2. Verificar saldo del cliente descontado en BD
        $this->cliente->refresh();
        $this->assertEquals(3000.00, (float) $this->cliente->saldo_cuenta_corriente);

        // 3. Verificar crédito en CC
        $this->assertDatabaseHas('movimientos_cuenta_corriente_clientes', [
            'cliente_id'      => $this->cliente->id,
            'monto'           => 2000.00,
            'tipo_movimiento' => 'CREDITO',
        ]);

        // 4. Verificar movimiento de ingreso en caja
        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id' => $this->caja->id,
            'monto'   => 2000.00,
            'tipo'    => 'INGRESO_COBRO_CLIENTE',
        ]);
    }

    public function test_cobro_digital_exitoso_no_afecta_caja_fisica(): void
    {
        $payload = [
            'cliente_id' => $this->cliente->id,
            'monto'      => 1500.00,
            'medio_pago' => 'TRANSFERENCIA',
        ];

        $response = $this->postJson('/api/cobros-clientes', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.cliente.saldo_cuenta_corriente', 3500);

        // Saldo descontado
        $this->cliente->refresh();
        $this->assertEquals(3500.00, (float) $this->cliente->saldo_cuenta_corriente);

        // Movimiento en CC registrado
        $this->assertDatabaseHas('movimientos_cuenta_corriente_clientes', [
            'cliente_id'      => $this->cliente->id,
            'monto'           => 1500.00,
            'tipo_movimiento' => 'CREDITO',
        ]);

        // NO debe registrar ingreso en la caja física
        $this->assertDatabaseMissing('movimientos_caja', [
            'tipo' => 'INGRESO_COBRO_CLIENTE',
        ]);
    }

    public function test_cobro_efectivo_falla_si_caja_esta_cerrada(): void
    {
        // Cerrar la caja
        $this->caja->update(['estado' => 'CERRADA']);

        $payload = [
            'cliente_id' => $this->cliente->id,
            'monto'      => 1000.00,
            'medio_pago' => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/cobros-clientes', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        // Saldo no debió modificarse
        $this->cliente->refresh();
        $this->assertEquals(5000.00, (float) $this->cliente->saldo_cuenta_corriente);

        // No se debió crear ningún registro
        $this->assertDatabaseCount('cobros_clientes', 0);
        $this->assertDatabaseCount('movimientos_cuenta_corriente_clientes', 0);
        $this->assertDatabaseCount('movimientos_caja', 0);
    }

    public function test_cobro_falla_si_monto_supera_deuda_actual(): void
    {
        $payload = [
            'cliente_id' => $this->cliente->id,
            'monto'      => 5000.01,
            'medio_pago' => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/cobros-clientes', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->cliente->refresh();
        $this->assertEquals(5000.00, (float) $this->cliente->saldo_cuenta_corriente);
        $this->assertDatabaseCount('cobros_clientes', 0);
    }

    public function test_cobro_falla_si_cliente_no_registra_deuda(): void
    {
        // Cliente sin deuda
        $this->cliente->update(['saldo_cuenta_corriente' => 0.00]);

        $payload = [
            'cliente_id' => $this->cliente->id,
            'monto'      => 500.00,
            'medio_pago' => 'EFECTIVO',
        ];

        $response = $this->postJson('/api/cobros-clientes', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('cobros_clientes', 0);
    }

    public function test_cobro_falla_con_monto_invalido_o_negativo(): void
    {
        $payloadCero = [
            'cliente_id' => $this->cliente->id,
            'monto'      => 0,
            'medio_pago' => 'EFECTIVO',
        ];

        $this->postJson('/api/cobros-clientes', $payloadCero)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['monto']);

        $payloadNegativo = [
            'cliente_id' => $this->cliente->id,
            'monto'      => -100,
            'medio_pago' => 'EFECTIVO',
        ];

        $this->postJson('/api/cobros-clientes', $payloadNegativo)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['monto']);
    }

    public function test_cobro_falla_con_cliente_inexistente(): void
    {
        $payload = [
            'cliente_id' => 99999,
            'monto'      => 500.00,
            'medio_pago' => 'EFECTIVO',
        ];

        $this->postJson('/api/cobros-clientes', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['cliente_id']);
    }
}
