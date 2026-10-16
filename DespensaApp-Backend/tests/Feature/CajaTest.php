<?php

namespace Tests\Feature;

use App\Enums\TipoMovimientoCaja;
use App\Models\Caja;
use App\Models\MovimientoCaja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Cubre apertura, estado, cierre con arqueo e historial de cajas.
 */
class CajaTest extends TestCase
{
    use RefreshDatabase;

    private User $empleado;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create(['role' => 'empleado']);
        Sanctum::actingAs($this->empleado);
    }

    private function crearCaja(string $estado = 'ABIERTA', float $saldoInicial = 1000.00): Caja
    {
        $datos = [
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => $saldoInicial,
            'fecha_apertura'      => now(),
            'estado'              => $estado,
        ];

        if ($estado === 'CERRADA') {
            $datos['usuario_cierre_id'] = $this->empleado->id;
            $datos['fecha_cierre']      = now();
            $datos['saldo_final']       = $saldoInicial;
        }

        return Caja::create($datos);
    }

    private function movimiento(Caja $caja, TipoMovimientoCaja $tipo, string $monto): void
    {
        $caja->movimientos()->create([
            'monto'    => $monto,
            'tipo'     => $tipo,
            'concepto' => 'Movimiento de prueba',
        ]);
    }

    // ---------------------------------------------------------------
    // GET /api/caja/estado
    // ---------------------------------------------------------------

    public function test_estado_sin_caja_abierta(): void
    {
        $this->getJson('/api/caja/estado')
            ->assertOk()
            ->assertJsonPath('caja_abierta', false)
            ->assertJsonPath('caja', null);
    }

    public function test_estado_con_caja_abierta_informa_saldos(): void
    {
        $caja = $this->crearCaja('ABIERTA', 1000.00);
        $this->movimiento($caja, TipoMovimientoCaja::INGRESO_VENTA, '500.50');
        $this->movimiento($caja, TipoMovimientoCaja::EGRESO_PAGO_PROVEEDOR, '200.25');

        $response = $this->getJson('/api/caja/estado')
            ->assertOk()
            ->assertJsonPath('caja_abierta', true)
            ->assertJsonPath('caja.id', $caja->id)
            ->assertJsonPath('caja.estado', 'ABIERTA');

        $this->assertEquals(500.50, $response->json('caja.total_ingresos'));
        $this->assertEquals(200.25, $response->json('caja.total_egresos'));
        $this->assertEquals(1300.25, $response->json('caja.saldo_esperado'));
    }

    public function test_estado_ignora_cajas_cerradas(): void
    {
        $this->crearCaja('CERRADA');

        $this->getJson('/api/caja/estado')
            ->assertOk()
            ->assertJsonPath('caja_abierta', false);
    }

    // ---------------------------------------------------------------
    // POST /api/caja/abrir
    // ---------------------------------------------------------------

    public function test_abrir_caja_camino_feliz(): void
    {
        $this->postJson('/api/caja/abrir', ['saldo_inicial' => 1500.75])
            ->assertCreated()
            ->assertJsonPath('message', 'Caja abierta correctamente.')
            ->assertJsonPath('caja.estado', 'ABIERTA')
            ->assertJsonPath('caja.usuario_apertura.id', $this->empleado->id);

        $this->assertDatabaseHas('cajas', [
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => '1500.75',
            'estado'              => 'ABIERTA',
        ]);
    }

    public function test_abrir_caja_con_saldo_inicial_cero(): void
    {
        $this->postJson('/api/caja/abrir', ['saldo_inicial' => 0])
            ->assertCreated();

        $this->assertDatabaseHas('cajas', ['saldo_inicial' => '0.00', 'estado' => 'ABIERTA']);
    }

    public function test_no_permite_abrir_si_ya_hay_una_caja_abierta(): void
    {
        $this->crearCaja('ABIERTA');

        $this->postJson('/api/caja/abrir', ['saldo_inicial' => 100])
            ->assertStatus(400)
            ->assertJsonPath('message', 'Ya existe una caja abierta. Ciérrela antes de abrir una nueva.');

        $this->assertDatabaseCount('cajas', 1);
    }

    public function test_permite_abrir_si_solo_hay_cajas_cerradas(): void
    {
        $this->crearCaja('CERRADA');

        $this->postJson('/api/caja/abrir', ['saldo_inicial' => 100])
            ->assertCreated();

        $this->assertDatabaseCount('cajas', 2);
    }

    public static function saldosInicialesInvalidos(): array
    {
        return [
            'negativo' => [-1],
            'texto'    => ['abc'],
            'nulo'     => [null],
        ];
    }

    #[DataProvider('saldosInicialesInvalidos')]
    public function test_abrir_rechaza_saldo_inicial_invalido(mixed $valor): void
    {
        $this->postJson('/api/caja/abrir', ['saldo_inicial' => $valor])
            ->assertStatus(422)
            ->assertJsonValidationErrors('saldo_inicial');

        $this->assertDatabaseCount('cajas', 0);
    }

    public function test_abrir_rechaza_saldo_inicial_ausente(): void
    {
        $this->postJson('/api/caja/abrir', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('saldo_inicial');
    }

    // ---------------------------------------------------------------
    // POST /api/caja/cerrar
    // ---------------------------------------------------------------

    public function test_cerrar_caja_cuadrada(): void
    {
        $caja = $this->crearCaja('ABIERTA', 1000.00);
        $this->movimiento($caja, TipoMovimientoCaja::INGRESO_VENTA, '500.00');
        $this->movimiento($caja, TipoMovimientoCaja::EGRESO_PAGO_PROVEEDOR, '200.00');

        $response = $this->postJson('/api/caja/cerrar', ['saldo_final' => 1300.00])
            ->assertOk()
            ->assertJsonPath('message', 'Caja cerrada correctamente.');

        $resumen = $response->json('resumen');
        $this->assertEquals(1000, $resumen['saldo_inicial']);
        $this->assertEquals(500, $resumen['total_ingresos']);
        $this->assertEquals(200, $resumen['total_egresos']);
        $this->assertEquals(1300, $resumen['saldo_esperado']);
        $this->assertEquals(1300, $resumen['saldo_final_declarado']);
        $this->assertEquals(0, $resumen['diferencia']);

        $caja->refresh();
        $this->assertSame('CERRADA', $caja->estado);
        $this->assertSame($this->empleado->id, $caja->usuario_cierre_id);
        $this->assertSame('1300.00', $caja->saldo_final);
        $this->assertNotNull($caja->fecha_cierre);
    }

    public function test_cerrar_caja_con_sobrante(): void
    {
        $this->crearCaja('ABIERTA', 1000.00);

        $response = $this->postJson('/api/caja/cerrar', ['saldo_final' => 1000.01])
            ->assertOk();

        $this->assertEquals(0.01, $response->json('resumen.diferencia'));
    }

    public function test_cerrar_caja_con_faltante(): void
    {
        $this->crearCaja('ABIERTA', 1000.00);

        $response = $this->postJson('/api/caja/cerrar', ['saldo_final' => 999.99])
            ->assertOk();

        $this->assertEquals(-0.01, $response->json('resumen.diferencia'));
    }

    public function test_cerrar_con_saldo_final_cero_es_valido(): void
    {
        $this->crearCaja('ABIERTA', 1000.00);

        $response = $this->postJson('/api/caja/cerrar', ['saldo_final' => 0])
            ->assertOk();

        $this->assertEquals(-1000, $response->json('resumen.diferencia'));
    }

    public function test_cerrar_sin_caja_abierta_retorna_404(): void
    {
        $this->postJson('/api/caja/cerrar', ['saldo_final' => 100])
            ->assertStatus(404)
            ->assertJsonPath('message', 'No hay ninguna caja abierta para cerrar.');
    }

    public function test_no_se_puede_cerrar_dos_veces(): void
    {
        $this->crearCaja('ABIERTA');

        $this->postJson('/api/caja/cerrar', ['saldo_final' => 1000])->assertOk();
        $this->postJson('/api/caja/cerrar', ['saldo_final' => 1000])->assertStatus(404);
    }

    public static function saldosFinalesInvalidos(): array
    {
        return [
            'negativo' => [-0.01],
            'texto'    => ['abc'],
            'nulo'     => [null],
        ];
    }

    #[DataProvider('saldosFinalesInvalidos')]
    public function test_cerrar_rechaza_saldo_final_invalido(mixed $valor): void
    {
        $caja = $this->crearCaja('ABIERTA');

        $this->postJson('/api/caja/cerrar', ['saldo_final' => $valor])
            ->assertStatus(422)
            ->assertJsonValidationErrors('saldo_final');

        $this->assertSame('ABIERTA', $caja->fresh()->estado);
    }

    public function test_cerrar_rechaza_saldo_final_ausente(): void
    {
        $this->crearCaja('ABIERTA');

        $this->postJson('/api/caja/cerrar', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('saldo_final');
    }

    // ---------------------------------------------------------------
    // GET /api/cajas (historial, solo admin_despensa)
    // ---------------------------------------------------------------

    public function test_admin_despensa_lista_solo_cajas_cerradas(): void
    {
        $this->crearCaja('CERRADA');
        $this->crearCaja('CERRADA');
        $this->crearCaja('ABIERTA');

        Sanctum::actingAs(User::factory()->create(['role' => 'admin_despensa']));

        $this->getJson('/api/cajas')
            ->assertOk()
            ->assertJsonCount(2, 'cajas')
            ->assertJsonPath('cajas.0.estado', 'CERRADA')
            ->assertJsonPath('cajas.1.estado', 'CERRADA');
    }

    public function test_historial_pagina_de_a_15(): void
    {
        for ($i = 0; $i < 16; $i++) {
            $this->crearCaja('CERRADA');
        }

        Sanctum::actingAs(User::factory()->create(['role' => 'admin_despensa']));

        $this->getJson('/api/cajas')
            ->assertOk()
            ->assertJsonCount(15, 'cajas');

        $this->getJson('/api/cajas?page=2')
            ->assertOk()
            ->assertJsonCount(1, 'cajas');
    }

    // ---------------------------------------------------------------
    // Autorización
    // ---------------------------------------------------------------

    public function test_empleado_no_puede_ver_historial_de_cajas(): void
    {
        $this->getJson('/api/cajas')->assertForbidden();
    }

    public function test_admin_de_plataforma_no_puede_ver_historial_de_cajas(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/cajas')->assertForbidden();
    }

    public function test_admin_despensa_puede_abrir_y_cerrar_caja(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin_despensa']));

        $this->postJson('/api/caja/abrir', ['saldo_inicial' => 100])->assertCreated();
        $this->postJson('/api/caja/cerrar', ['saldo_final' => 100])->assertOk();
    }

    public function test_usuario_no_autenticado_recibe_401(): void
    {
        $this->app['auth']->forgetGuards();

        $this->withHeaders(['Authorization' => ''])
            ->getJson('/api/caja/estado')
            ->assertUnauthorized();
    }
}
