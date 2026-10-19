<?php

namespace Tests\Feature;

use App\Enums\TipoMovimientoCaja;
use App\Models\Caja;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class MovimientoManualCajaTest extends TestCase
{
    use RefreshDatabase;

    private User $empleado;
    private User $adminDespensa;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create(['role' => 'empleado']);
        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        Sanctum::actingAs($this->empleado);
    }

    /**
     * El saldo inicial se pasa como string decimal para usar el mismo
     * tipo que el sistema y evitar errores de redondeo de float.
     */
    private function crearCaja(string $estado = 'ABIERTA', string $saldoInicial = '1000.00'): Caja
    {
        return Caja::create([
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => $saldoInicial,
            'fecha_apertura'      => now(),
            'estado'              => $estado,
            'saldo_final'         => $estado === 'CERRADA' ? $saldoInicial : null,
            'fecha_cierre'        => $estado === 'CERRADA' ? now() : null,
            'usuario_cierre_id'   => $estado === 'CERRADA' ? $this->empleado->id : null,
        ]);
    }

    // ---------------------------------------------------------------
    // Camino Feliz: Ingreso y Egreso Manual
    // ---------------------------------------------------------------

    public function test_ingreso_manual_exitoso_incrementa_saldo_esperado(): void
    {
        $caja = $this->crearCaja('ABIERTA', '1000.00');

        $payload = [
            'tipo'     => 'INGRESO',
            'monto'    => 500.00, // número JSON, como lo mandaría un frontend
            'concepto' => 'Ingreso de sencillo para cambio',
        ];

        $response = $this->postJson('/api/caja/movimientos', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Movimiento de caja registrado exitosamente.')
            ->assertJsonPath('data.monto', '500.00')
            ->assertJsonPath('data.tipo', TipoMovimientoCaja::INGRESO_MANUAL->value)
            ->assertJsonPath('data.concepto', 'Ingreso de sencillo para cambio')
            ->assertJsonPath('data.caja_id', $caja->id)
            ->assertJsonPath('data.user.id', $this->empleado->id);

        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id'  => $caja->id,
            'user_id'  => $this->empleado->id,
            'monto'    => '500.00',
            'tipo'     => TipoMovimientoCaja::INGRESO_MANUAL->value,
            'concepto' => 'Ingreso de sencillo para cambio',
        ]);

        $caja->refresh();
        $this->assertSame('500.00', $caja->totalIngresos());
        $this->assertSame('0.00', $caja->totalEgresos());
        $this->assertSame('1500.00', $caja->saldoEsperado());
    }

    public function test_egreso_manual_exitoso_decrementa_saldo_esperado(): void
    {
        $caja = $this->crearCaja('ABIERTA', '1000.00');

        $payload = [
            'tipo'     => 'EGRESO',
            'monto'    => 350.25,
            'concepto' => 'Compra de artículos de limpieza y librería',
        ];

        $response = $this->postJson('/api/caja/movimientos', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.monto', '350.25')
            ->assertJsonPath('data.tipo', TipoMovimientoCaja::EGRESO_MANUAL->value)
            ->assertJsonPath('data.concepto', 'Compra de artículos de limpieza y librería')
            ->assertJsonPath('data.caja_id', $caja->id)
            ->assertJsonPath('data.user.id', $this->empleado->id);

        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id'  => $caja->id,
            'user_id'  => $this->empleado->id,
            'monto'    => '350.25',
            'tipo'     => TipoMovimientoCaja::EGRESO_MANUAL->value,
            'concepto' => 'Compra de artículos de limpieza y librería',
        ]);

        $caja->refresh();
        $this->assertSame('0.00', $caja->totalIngresos());
        $this->assertSame('350.25', $caja->totalEgresos());
        $this->assertSame('649.75', $caja->saldoEsperado());
    }

    public function test_acepta_monto_enviado_como_string(): void
    {
        $caja = $this->crearCaja('ABIERTA', '1000.00');

        $this->postJson('/api/caja/movimientos', [
            'tipo'     => 'INGRESO',
            'monto'    => '350.25',
            'concepto' => 'Monto enviado como texto',
        ])
            ->assertStatus(201)
            ->assertJsonPath('data.monto', '350.25');

        $this->assertSame('1350.25', $caja->refresh()->saldoEsperado());
    }

    // ---------------------------------------------------------------
    // Precisión decimal
    // ---------------------------------------------------------------

    public function test_saldo_esperado_es_exacto_con_muchos_movimientos_decimales(): void
    {
        $caja = $this->crearCaja('ABIERTA', '0.00');

        for ($i = 0; $i < 10; $i++) {
            $this->postJson('/api/caja/movimientos', [
                'tipo'     => 'INGRESO',
                'monto'    => '0.10',
                'concepto' => "Ingreso chico número {$i}",
            ])->assertStatus(201);
        }

        $caja->refresh();
        $this->assertSame('1.00', $caja->totalIngresos());
        $this->assertSame('1.00', $caja->saldoEsperado());

        // Egreso por el total exacto acumulado: debe permitirse
        $this->postJson('/api/caja/movimientos', [
            'tipo'     => 'EGRESO',
            'monto'    => '1.00',
            'concepto' => 'Retiro del total acumulado',
        ])->assertStatus(201);

        $this->assertSame('0.00', $caja->refresh()->saldoEsperado());
    }

    public function test_egreso_un_centavo_por_encima_del_saldo_es_rechazado(): void
    {
        $this->crearCaja('ABIERTA', '500.00');

        $this->postJson('/api/caja/movimientos', [
            'tipo'     => 'EGRESO',
            'monto'    => '500.01',
            'concepto' => 'Un centavo de más',
        ])->assertStatus(422);

        $this->assertDatabaseCount('movimientos_caja', 0);
    }

    // ---------------------------------------------------------------
    // Egreso Superior al Saldo en Caja (Fondos Insuficientes)
    // ---------------------------------------------------------------

    public function test_egreso_rechazado_cuando_supera_saldo_en_caja(): void
    {
        $caja = $this->crearCaja('ABIERTA', '500.00');

        $payload = [
            'tipo'     => 'EGRESO',
            'monto'    => 600.00,
            'concepto' => 'Retiro de efectivo del dueño',
        ];

        $response = $this->postJson('/api/caja/movimientos', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['success', 'message', 'detalle' => ['saldo_disponible', 'monto_solicitado']])
            ->assertJsonPath('detalle.saldo_disponible', '500.00')
            ->assertJsonPath('detalle.monto_solicitado', '600.00');

        $this->assertDatabaseCount('movimientos_caja', 0);

        $caja->refresh();
        $this->assertSame('500.00', $caja->saldoEsperado());
    }

    public function test_egreso_por_saldo_exacto_es_permitido(): void
    {
        $caja = $this->crearCaja('ABIERTA', '500.00');

        $payload = [
            'tipo'     => 'EGRESO',
            'monto'    => 500.00,
            'concepto' => 'Retiro total de efectivo disponible',
        ];

        $response = $this->postJson('/api/caja/movimientos', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);

        $caja->refresh();
        $this->assertSame('0.00', $caja->saldoEsperado());
    }

    // ---------------------------------------------------------------
    // Bloqueo con Caja Cerrada o Inexistente
    // ---------------------------------------------------------------

    public function test_movimiento_rechazado_cuando_caja_esta_cerrada(): void
    {
        $this->crearCaja('CERRADA', '1000.00');

        $payload = [
            'tipo'     => 'INGRESO',
            'monto'    => 200.00,
            'concepto' => 'Intento de ingreso con caja cerrada',
        ];

        $response = $this->postJson('/api/caja/movimientos', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'No hay una caja abierta para registrar movimientos. Debe abrir una caja primero.');

        $this->assertDatabaseCount('movimientos_caja', 0);
    }

    public function test_movimiento_rechazado_cuando_no_hay_ninguna_caja(): void
    {
        $payload = [
            'tipo'     => 'EGRESO',
            'monto'    => 100.00,
            'concepto' => 'Intento sin cajas registradas',
        ];

        $response = $this->postJson('/api/caja/movimientos', $payload);

        $response->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('movimientos_caja', 0);
    }

    // ---------------------------------------------------------------
    // Validaciones de Request
    // ---------------------------------------------------------------

    public static function montosInvalidos(): array
    {
        return [
            'cero'                        => [0],
            'negativo'                    => [-50],
            'texto'                       => ['abc'],
            'mas_de_dos_decimales'        => [10.555],
            'mas_de_dos_decimales_string' => ['10.555'],
            'vacio'                       => [''],
            'null'                        => [null],
        ];
    }

    #[DataProvider('montosInvalidos')]
    public function test_rechaza_montos_invalidos(mixed $monto): void
    {
        $this->crearCaja('ABIERTA', '1000.00');

        $response = $this->postJson('/api/caja/movimientos', [
            'tipo'     => 'INGRESO',
            'monto'    => $monto,
            'concepto' => 'Concepto válido',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('monto');

        $this->assertDatabaseCount('movimientos_caja', 0);
    }

    public function test_rechaza_concepto_ausente_o_muy_corto(): void
    {
        $this->crearCaja('ABIERTA', '1000.00');

        $response = $this->postJson('/api/caja/movimientos', [
            'tipo'     => 'INGRESO',
            'monto'    => 100.00,
            'concepto' => 'ab',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('concepto');
    }

    public function test_rechaza_tipo_de_movimiento_invalido(): void
    {
        $this->crearCaja('ABIERTA', '1000.00');

        $response = $this->postJson('/api/caja/movimientos', [
            'tipo'     => 'OTRO_TIPO',
            'monto'    => 100.00,
            'concepto' => 'Concepto válido',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors('tipo');
    }

    // ---------------------------------------------------------------
    // Autorización por Rol
    // ---------------------------------------------------------------

    public function test_admin_despensa_puede_registrar_movimiento(): void
    {
        $this->crearCaja('ABIERTA', '1000.00');
        Sanctum::actingAs($this->adminDespensa);

        $response = $this->postJson('/api/caja/movimientos', [
            'tipo'     => 'INGRESO',
            'monto'    => 200.00,
            'concepto' => 'Ingreso realizado por admin de negocio',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.id', $this->adminDespensa->id);
    }

    public function test_usuario_no_autenticado_recibe_401(): void
    {
        $this->app['auth']->forgetGuards();

        $this->withHeaders(['Authorization' => ''])
            ->postJson('/api/caja/movimientos', [
                'tipo'     => 'INGRESO',
                'monto'    => 100.00,
                'concepto' => 'Intento anónimo',
            ])
            ->assertUnauthorized();
    }
}