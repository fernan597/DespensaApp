<?php

namespace Tests\Feature;

use App\Models\Compra;
use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\PagoProveedor;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CuentaCorrienteProveedorTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private User $empleado;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create([
            'role' => 'admin_despensa',
        ]);

        $this->empleado = User::factory()->create([
            'role' => 'empleado',
        ]);
    }

    public function test_admin_despensa_puede_consultar_listado_global_cc_proveedores(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $provA = Proveedor::create([
            'razon_social'   => 'Lácteos El Trébol',
            'telefono'       => '11111111',
            'direccion'      => 'Calle 1',
            'saldo_adeudado' => 50000.00,
            'activo'         => true,
        ]);

        $provB = Proveedor::create([
            'razon_social'   => 'Bebidas del Sur',
            'telefono'       => '22222222',
            'direccion'      => 'Calle 2',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        $response = $this->getJson('/api/cc-proveedores');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kpis.total_deuda_global', 50000)
            ->assertJsonPath('data.kpis.cantidad_proveedores_con_deuda', 1)
            ->assertJsonPath('data.kpis.cantidad_proveedores_al_dia', 1)
            ->assertJsonPath('data.kpis.total_proveedores', 2)
            ->assertJsonCount(2, 'data.proveedores');
    }

    public function test_filtrado_de_proveedores_por_estado_y_busqueda(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        Proveedor::create([
            'razon_social'   => 'Molinos Cañuelas',
            'saldo_adeudado' => 15000.00,
        ]);

        Proveedor::create([
            'razon_social'   => 'Arcor Golosinas',
            'saldo_adeudado' => 0.00,
        ]);

        // Filtrar con_deuda
        $responseDeuda = $this->getJson('/api/cc-proveedores?estado=con_deuda');
        $responseDeuda->assertStatus(200)
            ->assertJsonCount(1, 'data.proveedores')
            ->assertJsonPath('data.proveedores.0.razon_social', 'Molinos Cañuelas');

        // Filtrar al_dia
        $responseAlDia = $this->getJson('/api/cc-proveedores?estado=al_dia');
        $responseAlDia->assertStatus(200)
            ->assertJsonCount(1, 'data.proveedores')
            ->assertJsonPath('data.proveedores.0.razon_social', 'Arcor Golosinas');

        // Buscar por texto
        $responseSearch = $this->getJson('/api/cc-proveedores?search=Molinos');
        $responseSearch->assertStatus(200)
            ->assertJsonCount(1, 'data.proveedores')
            ->assertJsonPath('data.proveedores.0.razon_social', 'Molinos Cañuelas');
    }

    public function test_admin_despensa_puede_ver_detalle_cronologico_con_saldo_acumulado(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $proveedor = Proveedor::create([
            'razon_social'   => 'Distribuidora Norte',
            'saldo_adeudado' => 7000.00,
        ]);

        $compra1 = Compra::create([
            'user_id'            => $this->adminDespensa->id,
            'proveedor_id'       => $proveedor->id,
            'numero_comprobante' => 'FC-001',
            'total'              => 10000.00,
            'tipo_pago'          => 'CUENTA_CORRIENTE',
            'pendiente_pago'     => true,
            'created_at'         => '2026-10-01 10:00:00',
        ]);

        $mov1 = MovimientoCuentaCorrienteProveedor::create([
            'proveedor_id'    => $proveedor->id,
            'monto'           => 10000.00,
            'tipo_movimiento' => 'DEBITO',
            'compra_id'       => $compra1->id,
            'created_at'      => '2026-10-01 10:00:00',
        ]);

        $pago1 = PagoProveedor::create([
            'proveedor_id' => $proveedor->id,
            'user_id'      => $this->adminDespensa->id,
            'monto'        => 3000.00,
            'medio_pago'   => 'TRANSFERENCIA',
            'created_at'   => '2026-10-02 12:00:00',
        ]);

        $mov2 = MovimientoCuentaCorrienteProveedor::create([
            'proveedor_id'      => $proveedor->id,
            'monto'             => 3000.00,
            'tipo_movimiento'   => 'CREDITO',
            'pago_proveedor_id' => $pago1->id,
            'created_at'        => '2026-10-02 12:00:00',
        ]);

        $response = $this->getJson("/api/cc-proveedores/{$proveedor->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.proveedor.razon_social', 'Distribuidora Norte')
            ->assertJsonPath('data.proveedor.saldo_adeudado', 7000)
            ->assertJsonPath('data.proveedor.estado_cuenta', 'DEUDOR')
            ->assertJsonCount(2, 'data.movimientos')
            ->assertJsonPath('data.movimientos.0.tipo_movimiento', 'DEBITO')
            ->assertJsonPath('data.movimientos.0.monto', 10000)
            ->assertJsonPath('data.movimientos.0.saldo_acumulado', 10000)
            ->assertJsonPath('data.movimientos.1.tipo_movimiento', 'CREDITO')
            ->assertJsonPath('data.movimientos.1.monto', 3000)
            ->assertJsonPath('data.movimientos.1.saldo_acumulado', 7000);
    }

    public function test_filtro_por_rango_de_fechas_calcula_saldo_anterior(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $proveedor = Proveedor::create([
            'razon_social'   => 'Distribuidora Rango',
            'saldo_adeudado' => 15000.00,
        ]);

        // Movimiento previo a la fecha de inicio
        MovimientoCuentaCorrienteProveedor::create([
            'proveedor_id'    => $proveedor->id,
            'monto'           => 10000.00,
            'tipo_movimiento' => 'DEBITO',
            'created_at'      => '2026-09-15 10:00:00',
        ]);

        // Movimiento dentro del rango
        MovimientoCuentaCorrienteProveedor::create([
            'proveedor_id'    => $proveedor->id,
            'monto'           => 5000.00,
            'tipo_movimiento' => 'DEBITO',
            'created_at'      => '2026-10-02 10:00:00',
        ]);

        $response = $this->getJson("/api/cc-proveedores/{$proveedor->id}?fecha_desde=2026-10-01&fecha_hasta=2026-10-05");

        $response->assertStatus(200)
            ->assertJsonPath('data.periodo.saldo_anterior', 10000)
            ->assertJsonCount(1, 'data.movimientos')
            ->assertJsonPath('data.movimientos.0.monto', 5000)
            ->assertJsonPath('data.movimientos.0.saldo_acumulado', 15000);
    }

    public function test_empleado_no_tiene_acceso_a_cc_proveedores(): void
    {
        Sanctum::actingAs($this->empleado);

        $proveedor = Proveedor::create([
            'razon_social'   => 'Proveedor Prueba',
            'saldo_adeudado' => 1000.00,
        ]);

        $this->getJson('/api/cc-proveedores')->assertStatus(403);
        $this->getJson("/api/cc-proveedores/{$proveedor->id}")->assertStatus(403);
    }

    public function test_proveedor_inexistente_retorna_404(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $this->getJson('/api/cc-proveedores/999999')
            ->assertStatus(404)
            ->assertJsonPath('success', false);
    }
}
