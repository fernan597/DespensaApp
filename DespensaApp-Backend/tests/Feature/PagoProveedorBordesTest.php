<?php

namespace Tests\Feature;

use App\Models\Caja;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Bordes de CU14 - Registrar Pago a Proveedor.
 * Complementa PagoProveedorTest.
 */
class PagoProveedorBordesTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/pagos-proveedores';

    private User $adminDespensa;
    private Proveedor $proveedor; // deuda 5000.00
    private Caja $caja;           // saldo inicial 10000.00

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);

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

        Sanctum::actingAs($this->adminDespensa);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'proveedor_id' => $this->proveedor->id,
            'monto'        => 1000.00,
            'medio_pago'   => 'EFECTIVO',
        ], $overrides);
    }

    /** Verifica que un pago rechazado no dejó NADA persistido. */
    private function assertNadaPersistido(float $saldoProveedor = 5000.00): void
    {
        $this->assertDatabaseCount('pagos_proveedores', 0);
        $this->assertDatabaseCount('movimientos_cuenta_corriente_proveedores', 0);
        $this->assertDatabaseCount('movimientos_caja', 0);
        $this->assertEquals($saldoProveedor, (float) $this->proveedor->fresh()->saldo_adeudado);
    }

    // ------------------------------------------------------------------
    // Escenario 3: montos (borde contra la deuda)
    // ------------------------------------------------------------------

    public function test_permite_cancelar_la_deuda_total_y_luego_rechaza_otro_pago(): void
    {
        // "Cancelación total o parcial": 5000 de 5000 es válido y deja saldo 0.
        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 5000.00]))
            ->assertStatus(201)
            ->assertJsonPath('success', true);

        $this->assertEquals(0.00, (float) $this->proveedor->fresh()->saldo_adeudado);

        // Con saldo 0, cualquier pago adicional se rechaza.
        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 1.00]))
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertDatabaseCount('pagos_proveedores', 1);
        $this->assertDatabaseCount('movimientos_cuenta_corriente_proveedores', 1);
    }

    public function test_rechaza_un_centavo_mas_que_la_deuda(): void
    {
        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 5000.01]))
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertNadaPersistido();
    }

    public function test_pagos_parciales_sucesivos_acumulan_hasta_dejar_saldo_cero(): void
    {
        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 2000.00]))->assertStatus(201);
        $this->assertEquals(3000.00, (float) $this->proveedor->fresh()->saldo_adeudado);

        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 3000.00]))->assertStatus(201);
        $this->assertEquals(0.00, (float) $this->proveedor->fresh()->saldo_adeudado);

        $this->assertDatabaseCount('pagos_proveedores', 2);
        $this->assertEquals(5000.00, (float) MovimientoCaja::where('caja_id', $this->caja->id)->sum('monto'));
    }

    public function test_acepta_el_monto_minimo_de_un_centavo(): void
    {
        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 0.01]))
            ->assertStatus(201);

        $this->assertEquals(4999.99, (float) $this->proveedor->fresh()->saldo_adeudado);
    }

    public function test_respeta_los_centavos_en_el_pago(): void
    {
        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 1234.56]))
            ->assertStatus(201);

        $this->assertEquals(3765.44, (float) $this->proveedor->fresh()->saldo_adeudado);

        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id' => $this->caja->id,
            'tipo'    => 'EGRESO_PAGO_PROVEEDOR',
            'monto'   => 1234.56,
        ]);
    }

    #[DataProvider('montosInvalidos')]
    public function test_rechaza_montos_invalidos(array $overrides, bool $ausente = false): void
    {
        $payload = $this->payload($overrides);

        if ($ausente) {
            unset($payload['monto']);
        }

        $this->postJson(self::ENDPOINT, $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['monto']);

        $this->assertNadaPersistido();
    }

    public static function montosInvalidos(): array
    {
        return [
            'cero'              => [['monto' => 0]],
            'negativo'          => [['monto' => -100.00]],
            'texto'             => [['monto' => 'abc']],
            'nulo'              => [['monto' => null]],
            'ausente'           => [[], true],
            // Si este falla, la validación acepta más de 2 decimales (hueco real).
            'tres decimales'    => [['monto' => 10.005]],
            'menos de un centavo' => [['monto' => 0.001]],
        ];
    }

    // ------------------------------------------------------------------
    // Escenario 2: caja y fondos (borde contra el efectivo disponible)
    // ------------------------------------------------------------------

    public function test_permite_pagar_exactamente_el_efectivo_disponible_en_caja(): void
    {
        $this->caja->update(['saldo_inicial' => 500.00]);

        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 500.00]))
            ->assertStatus(201);

        $this->assertEquals(0.00, $this->caja->fresh()->saldoEsperado());
    }

    public function test_rechaza_un_centavo_mas_que_el_efectivo_disponible(): void
    {
        $this->caja->update(['saldo_inicial' => 500.00]);

        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 500.01]))
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonFragment([
                'message' => 'Fondos insuficientes en la caja activa para registrar el pago en efectivo.',
            ]);

        $this->assertNadaPersistido();
    }

    public function test_el_efectivo_disponible_incluye_los_ingresos_previos_de_la_caja(): void
    {
        // Saldo inicial 500 + ingreso por venta 600 = 1100 disponibles.
        // Ajustar los campos si MovimientoCaja requiere otros obligatorios.
        $this->caja->update(['saldo_inicial' => 500.00]);

        MovimientoCaja::create([
            'caja_id'  => $this->caja->id,
            'tipo'     => 'INGRESO_VENTA',
            'monto'    => 600.00,
            'concepto' => 'Venta de prueba',
        ]);

        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 1000.00]))
            ->assertStatus(201);

        $this->assertEquals(100.00, $this->caja->fresh()->saldoEsperado());
    }

    public function test_transferencia_no_requiere_caja_abierta(): void
    {
        // El spec exige caja abierta solo si el pago es en efectivo.
        $this->caja->update(['estado' => 'CERRADA', 'fecha_cierre' => now()]);

        $this->postJson(self::ENDPOINT, $this->payload([
            'monto'      => 1500.00,
            'medio_pago' => 'TRANSFERENCIA',
        ]))->assertStatus(201);

        $this->assertEquals(3500.00, (float) $this->proveedor->fresh()->saldo_adeudado);
        $this->assertDatabaseCount('movimientos_caja', 0);
        $this->assertDatabaseCount('movimientos_cuenta_corriente_proveedores', 1);
    }

    public function test_transferencia_no_valida_fondos_de_caja(): void
    {
        // Caja con 100 y pago por transferencia de 3000: los fondos no aplican.
        $this->caja->update(['saldo_inicial' => 100.00]);

        $this->postJson(self::ENDPOINT, $this->payload([
            'monto'      => 3000.00,
            'medio_pago' => 'TRANSFERENCIA',
        ]))->assertStatus(201);

        $this->assertEquals(2000.00, (float) $this->proveedor->fresh()->saldo_adeudado);
    }

    // ------------------------------------------------------------------
    // Escenario 1: medios de pago permitidos (efectivo, transferencia)
    // ------------------------------------------------------------------

    public function test_debito_se_trata_como_medio_no_efectivo(): void
    {
        // DEBITO es un medio permitido: baja la deuda, no exige caja abierta
        // y no genera egreso de caja (igual que TRANSFERENCIA).
        $this->caja->update(['estado' => 'CERRADA', 'fecha_cierre' => now()]);

        $this->postJson(self::ENDPOINT, $this->payload([
            'monto'      => 1500.00,
            'medio_pago' => 'DEBITO',
        ]))->assertStatus(201)
            ->assertJsonPath('data.pago.medio_pago', 'DEBITO');

        $this->assertEquals(3500.00, (float) $this->proveedor->fresh()->saldo_adeudado);
        $this->assertDatabaseCount('movimientos_caja', 0);
        $this->assertDatabaseCount('movimientos_cuenta_corriente_proveedores', 1);
    }

    #[DataProvider('mediosNoPermitidos')]
    public function test_rechaza_medios_de_pago_no_permitidos(string $medioPago): void
    {
        // Si alguno devuelve 201, el request acepta más medios que el spec.
        $this->postJson(self::ENDPOINT, $this->payload(['medio_pago' => $medioPago]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['medio_pago']);

        $this->assertNadaPersistido();
    }

    public static function mediosNoPermitidos(): array
    {
        return [
            'credito' => ['CREDITO'],
            'cripto'  => ['CRIPTO'],
            'minuscula' => ['efectivo'],
        ];
    }

    public function test_rechaza_pago_sin_medio_de_pago(): void
    {
        $payload = $this->payload();
        unset($payload['medio_pago']);

        $this->postJson(self::ENDPOINT, $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['medio_pago']);

        $this->assertNadaPersistido();
    }

    // ------------------------------------------------------------------
    // Proveedor
    // ------------------------------------------------------------------

    public function test_rechaza_proveedor_inexistente(): void
    {
        $this->postJson(self::ENDPOINT, $this->payload(['proveedor_id' => 99999]))
            ->assertStatus(422)
            ->assertJsonValidationErrors(['proveedor_id']);

        $this->assertNadaPersistido();
    }

    // ------------------------------------------------------------------
    // Roles y autenticación
    // ------------------------------------------------------------------

    public function test_admin_de_plataforma_no_puede_registrar_pagos(): void
    {
        // routes/api.php: /pagos-proveedores está solo bajo role:admin_despensa.
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 1000.00]))
            ->assertStatus(403);

        $this->assertNadaPersistido();
    }

    public function test_usuario_no_autenticado_recibe_401(): void
    {
        $this->app['auth']->forgetGuards();

        $this->postJson(self::ENDPOINT, $this->payload())
            ->assertStatus(401);

        $this->assertNadaPersistido();
    }

    // ------------------------------------------------------------------
    // Rollback real: el fallo ocurre DESPUÉS de haber escrito algo
    // ------------------------------------------------------------------

    public function test_falla_inesperada_al_registrar_el_egreso_de_caja_hace_rollback_total(): void
    {
        MovimientoCaja::creating(function () {
            throw new \RuntimeException('Fallo simulado al registrar el egreso de caja');
        });

        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 2000.00]))
            ->assertStatus(500);

        // Ni el pago, ni el movimiento de cuenta corriente, ni la baja de deuda quedan.
        $this->assertNadaPersistido();
    }

    public function test_falla_inesperada_al_registrar_el_movimiento_de_cuenta_corriente_hace_rollback_total(): void
    {
        MovimientoCuentaCorrienteProveedor::creating(function () {
            throw new \RuntimeException('Fallo simulado al registrar el movimiento de cuenta corriente');
        });

        $this->postJson(self::ENDPOINT, $this->payload(['monto' => 2000.00]))
            ->assertStatus(500);

        $this->assertNadaPersistido();
    }
}