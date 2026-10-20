<?php

namespace Tests\Feature;

use App\Models\Cliente;
use App\Models\CobroCliente;
use App\Models\MovimientoCuentaCorrienteCliente;
use App\Models\User;
use App\Models\Venta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CuentaCorrienteClienteTest extends TestCase
{
    use RefreshDatabase;

    private User $empleado;
    private Cliente $clienteConDeuda;
    private Cliente $clienteAlDia;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create([
            'role' => 'empleado',
        ]);

        Sanctum::actingAs($this->empleado);

        $this->clienteConDeuda = Cliente::create([
            'nombre'                 => 'Lucas',
            'apellido'               => 'Fernandez',
            'telefono'               => '1122334455',
            'direccion'              => 'Av. Libertador 500',
            'saldo_cuenta_corriente' => 5000.00,
        ]);

        $this->clienteAlDia = Cliente::create([
            'nombre'                 => 'Valeria',
            'apellido'               => 'Rios',
            'telefono'               => '1199887766',
            'direccion'              => 'Calle Belgrano 120',
            'saldo_cuenta_corriente' => 0.00,
        ]);
    }

    public function test_listar_cuentas_corrientes_clientes_con_kpis(): void
    {
        $response = $this->getJson('/api/cc-clientes');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kpis.total_deuda_global', 5000)
            ->assertJsonPath('data.kpis.cantidad_clientes_con_deuda', 1)
            ->assertJsonPath('data.kpis.cantidad_clientes_al_dia', 1)
            ->assertJsonPath('data.kpis.total_clientes', 2)
            ->assertJsonCount(2, 'data.clientes');
    }

    public function test_filtrar_clientes_por_estado(): void
    {
        $conDeuda = $this->getJson('/api/cc-clientes?estado=con_deuda');
        $conDeuda->assertStatus(200)
            ->assertJsonCount(1, 'data.clientes')
            ->assertJsonPath('data.clientes.0.id', $this->clienteConDeuda->id)
            ->assertJsonPath('data.clientes.0.estado_cuenta', 'DEUDOR');

        $alDia = $this->getJson('/api/cc-clientes?estado=al_dia');
        $alDia->assertStatus(200)
            ->assertJsonCount(1, 'data.clientes')
            ->assertJsonPath('data.clientes.0.id', $this->clienteAlDia->id)
            ->assertJsonPath('data.clientes.0.estado_cuenta', 'AL_DIA');
    }

    public function test_buscar_clientes_por_nombre_o_telefono(): void
    {
        $response = $this->getJson('/api/cc-clientes?search=Lucas');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.clientes')
            ->assertJsonPath('data.clientes.0.nombre', 'Lucas');

        $responseTel = $this->getJson('/api/cc-clientes?search=1199887766');
        $responseTel->assertStatus(200)
            ->assertJsonCount(1, 'data.clientes')
            ->assertJsonPath('data.clientes.0.nombre', 'Valeria');
    }

    public function test_ver_detalle_cronologico_con_saldo_acumulado(): void
    {
        // 1. Venta a crédito (DÉBITO de 3000)
        $venta = Venta::create([
            'user_id'    => $this->empleado->id,
            'cliente_id' => $this->clienteConDeuda->id,
            'total'      => 3000.00,
            'tipo_venta' => 'CUENTA_CORRIENTE',
            'medio_pago' => 'CREDITO',
            'estado'     => 'COMPLETADA',
        ]);

        $mov1 = MovimientoCuentaCorrienteCliente::create([
            'cliente_id'      => $this->clienteConDeuda->id,
            'monto'           => 3000.00,
            'tipo_movimiento' => 'DEBITO',
            'venta_id'        => $venta->id,
            'created_at'      => now()->subDays(2),
        ]);

        // 2. Cobro recibido (CRÉDITO de 1000)
        $cobro = CobroCliente::create([
            'cliente_id' => $this->clienteConDeuda->id,
            'user_id'    => $this->empleado->id,
            'monto'      => 1000.00,
            'medio_pago' => 'EFECTIVO',
        ]);

        $mov2 = MovimientoCuentaCorrienteCliente::create([
            'cliente_id'      => $this->clienteConDeuda->id,
            'monto'           => 1000.00,
            'tipo_movimiento' => 'CREDITO',
            'cobro_cliente_id'=> $cobro->id,
            'created_at'      => now()->subDay(),
        ]);

        $response = $this->getJson("/api/cc-clientes/{$this->clienteConDeuda->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.cliente.id', $this->clienteConDeuda->id)
            ->assertJsonCount(2, 'data.movimientos')
            ->assertJsonPath('data.movimientos.0.id', $mov1->id)
            ->assertJsonPath('data.movimientos.0.tipo_movimiento', 'DEBITO')
            ->assertJsonPath('data.movimientos.0.monto', 3000)
            ->assertJsonPath('data.movimientos.0.saldo_acumulado', 3000)
            ->assertJsonPath('data.movimientos.1.id', $mov2->id)
            ->assertJsonPath('data.movimientos.1.tipo_movimiento', 'CREDITO')
            ->assertJsonPath('data.movimientos.1.monto', 1000)
            ->assertJsonPath('data.movimientos.1.saldo_acumulado', 2000);
    }

    public function test_filtro_por_rango_de_fechas_calcula_saldo_anterior(): void
    {
        // Movimiento previo al rango (DÉBITO de 4000 el 2026-09-15)
        MovimientoCuentaCorrienteCliente::create([
            'cliente_id'      => $this->clienteConDeuda->id,
            'monto'           => 4000.00,
            'tipo_movimiento' => 'DEBITO',
            'created_at'      => '2026-09-15 10:00:00',
        ]);

        // Movimiento dentro del rango (CRÉDITO de 1500 el 2026-10-02)
        $movHoy = MovimientoCuentaCorrienteCliente::create([
            'cliente_id'      => $this->clienteConDeuda->id,
            'monto'           => 1500.00,
            'tipo_movimiento' => 'CREDITO',
            'created_at'      => '2026-10-02 10:00:00',
        ]);

        $response = $this->getJson("/api/cc-clientes/{$this->clienteConDeuda->id}?fecha_desde=2026-10-01&fecha_hasta=2026-10-05");

        $response->assertStatus(200)
            ->assertJsonPath('data.periodo.saldo_anterior', 4000)
            ->assertJsonCount(1, 'data.movimientos')
            ->assertJsonPath('data.movimientos.0.id', $movHoy->id)
            ->assertJsonPath('data.movimientos.0.saldo_acumulado', 2500); // 4000 - 1500 = 2500
    }

    public function test_cliente_no_encontrado_retorna_404(): void
    {
        $response = $this->getJson('/api/cc-clientes/99999');

        $response->assertStatus(404)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Cliente no encontrado.');
    }
}
