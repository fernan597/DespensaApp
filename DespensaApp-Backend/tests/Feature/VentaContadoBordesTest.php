<?php

namespace Tests\Feature;

use App\Models\AlertaStock;
use App\Models\Caja;
use App\Models\Category;
use App\Models\Marca;
use App\Models\MovimientoCaja;
use App\Models\Product;
use App\Models\User;
use App\Models\Venta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

/**
 * Complemento de VentaContadoTest para CU07 - Registrar Venta de Contado.
 * Cubre bordes de stock/alerta, caja cerrada con medios digitales,
 * validaciones de cantidad y manipulación de montos desde el cliente.
 */
class VentaContadoBordesTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/ventas/contado';

    private User $empleado;
    private Product $productoA;        // stock 25, mínimo 5, precio 850
    private Product $productoLimite;   // stock 6,  mínimo 5, precio 1800

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create(['role' => 'empleado']);
        Sanctum::actingAs($this->empleado);

        $categoria = Category::create(['nombre' => 'Almacén']);
        $marca     = Marca::create(['nombre' => 'Marca Líder']);

        $this->productoA = Product::create([
            'nombre'        => 'Fideos Spaghetti 500g',
            'codigo_barra'  => '7790001112223',
            'stock_actual'  => 25,
            'stock_minimo'  => 5,
            'precio_compra' => 500.00,
            'precio_venta'  => 850.00,
            'categoria_id'  => $categoria->id,
            'marca_id'      => $marca->id,
        ]);

        $this->productoLimite = Product::create([
            'nombre'        => 'Aceite de Girasol 900ml',
            'codigo_barra'  => '7790003334445',
            'stock_actual'  => 6,
            'stock_minimo'  => 5,
            'precio_compra' => 1200.00,
            'precio_venta'  => 1800.00,
            'categoria_id'  => $categoria->id,
            'marca_id'      => $marca->id,
        ]);
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    private function abrirCaja(float $saldoInicial = 10000.00): Caja
    {
        return Caja::create([
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => $saldoInicial,
            'fecha_apertura'      => now(),
            'estado'              => 'ABIERTA',
        ]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 1],
            ],
        ], $overrides);
    }

    // ------------------------------------------------------------------
    // Regla de stock mínimo: stock_actual <= stock_minimo
    // ------------------------------------------------------------------

    public function test_genera_alerta_cuando_el_stock_queda_exactamente_en_el_minimo(): void
    {
        $this->abrirCaja();

        // Stock 6 -> 5 (mínimo 5): borde de "<=", debe generar alerta.
        $response = $this->postJson(self::ENDPOINT, $this->payload([
            'items' => [['producto_id' => $this->productoLimite->id, 'cantidad' => 1]],
        ]));

        $response->assertStatus(201);

        $this->assertEquals(5, $this->productoLimite->fresh()->stock_actual);
        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $this->productoLimite->id,
            'atendida'   => false,
        ]);
    }

    public function test_no_genera_alerta_cuando_el_stock_queda_justo_por_encima_del_minimo(): void
    {
        $this->abrirCaja();

        // Stock 7 -> 6 (mínimo 5): borde superior, NO debe generar alerta.
        $this->productoLimite->update(['stock_actual' => 7]);

        $response = $this->postJson(self::ENDPOINT, $this->payload([
            'items' => [['producto_id' => $this->productoLimite->id, 'cantidad' => 1]],
        ]));

        $response->assertStatus(201);

        $this->assertEquals(6, $this->productoLimite->fresh()->stock_actual);
        $this->assertDatabaseCount('alertas_stock', 0);
    }

    // ------------------------------------------------------------------
    // Regla de stock insuficiente: stock_actual < cantidad
    // ------------------------------------------------------------------

    public function test_permite_vender_exactamente_todo_el_stock_disponible(): void
    {
        $this->abrirCaja();

        // 6 de 6: válido (6 < 6 es falso), deja stock 0 y genera alerta.
        $response = $this->postJson(self::ENDPOINT, $this->payload([
            'items' => [['producto_id' => $this->productoLimite->id, 'cantidad' => 6]],
        ]));

        $response->assertStatus(201)
            ->assertJsonPath('venta.total', 10800);

        $this->assertEquals(0, $this->productoLimite->fresh()->stock_actual);
        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $this->productoLimite->id,
            'atendida'   => false,
        ]);
    }

    public function test_falla_si_se_pide_una_unidad_mas_que_el_stock_disponible(): void
    {
        $this->abrirCaja();

        $response = $this->postJson(self::ENDPOINT, $this->payload([
            'items' => [['producto_id' => $this->productoLimite->id, 'cantidad' => 7]],
        ]));

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => "Stock insuficiente para 'Aceite de Girasol 900ml'. Disponible: 6, solicitado: 7.",
            ]);

        $this->assertEquals(6, $this->productoLimite->fresh()->stock_actual);
        $this->assertDatabaseCount('ventas', 0);
        $this->assertDatabaseCount('movimientos_caja', 0);
        $this->assertDatabaseCount('alertas_stock', 0);
    }

    // ------------------------------------------------------------------
    // Caja cerrada: aplica a TODOS los medios de pago
    // ------------------------------------------------------------------

    #[DataProvider('mediosDigitales')]
    public function test_caja_cerrada_bloquea_tambien_los_medios_digitales(string $medioPago): void
    {
        // Sin abrir caja.
        $response = $this->postJson(self::ENDPOINT, $this->payload(['medio_pago' => $medioPago]));

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ]);

        $this->assertEquals(25, $this->productoA->fresh()->stock_actual);
        $this->assertDatabaseCount('ventas', 0);
    }

    public static function mediosDigitales(): array
    {
        return [
            'transferencia' => ['TRANSFERENCIA'],
            'debito'        => ['DEBITO'],
            // 'tarjeta'    => ['TARJETA'], // habilitar si el enum la incluye (el spec menciona TRANSFERENCIA/TARJETA)
        ];
    }

    // ------------------------------------------------------------------
    // Validación de cantidades (nula, ausente, cero, negativa, decimal, texto)
    // ------------------------------------------------------------------

    #[DataProvider('cantidadesInvalidas')]
    public function test_rechaza_cantidades_invalidas(array $itemSinProducto): void
    {
        $this->abrirCaja();

        $item = array_merge(['producto_id' => $this->productoA->id], $itemSinProducto);

        $response = $this->postJson(self::ENDPOINT, $this->payload(['items' => [$item]]));

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.cantidad']);

        $this->assertEquals(25, $this->productoA->fresh()->stock_actual);
        $this->assertDatabaseCount('ventas', 0);
    }

    public static function cantidadesInvalidas(): array
    {
        return [
            'nula'     => [['cantidad' => null]],
            'ausente'  => [[]],
            'cero'     => [['cantidad' => 0]],
            'negativa' => [['cantidad' => -5]],
            'decimal'  => [['cantidad' => 2.5]],
            'texto'    => [['cantidad' => 'abc']],
        ];
    }

    // ------------------------------------------------------------------
    // Montos inconsistentes: el servidor NO confía en montos del cliente
    // ------------------------------------------------------------------

    public function test_ignora_precio_y_total_enviados_por_el_cliente(): void
    {
        $caja = $this->abrirCaja();

        // Decisión de diseño asumida: el servidor ignora cualquier monto enviado
        // y usa el precio de BD. Si en cambio decidís rechazar con 422, cambiá
        // este test por assertStatus(422) + assertJsonValidationErrors(['total']).
        $payload = $this->payload([
            'total' => 1,
            'items' => [[
                'producto_id'     => $this->productoA->id,
                'cantidad'        => 2,
                'precio_unitario' => 1,
            ]],
        ]);

        $response = $this->postJson(self::ENDPOINT, $payload);

        $response->assertStatus(201)
            ->assertJsonPath('venta.total', 1700);

        $venta = Venta::first();

        $this->assertDatabaseHas('detalles_venta', [
            'venta_id'        => $venta->id,
            'product_id'      => $this->productoA->id,
            'precio_unitario' => 850.00,
            'subtotal'        => 1700.00,
        ]);

        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id' => $caja->id,
            'monto'   => 1700.00,
        ]);
    }

    // ------------------------------------------------------------------
    // Cálculo de totales y efecto en caja
    // ------------------------------------------------------------------

    public function test_calcula_el_total_con_varios_items_y_precios_distintos(): void
    {
        $this->abrirCaja();

        $response = $this->postJson(self::ENDPOINT, $this->payload([
            'items' => [
                ['producto_id' => $this->productoA->id,      'cantidad' => 3], // 3 * 850  = 2550
                ['producto_id' => $this->productoLimite->id, 'cantidad' => 2], // 2 * 1800 = 3600
            ],
        ]));

        $response->assertStatus(201)
            ->assertJsonPath('venta.total', 6150);

        $venta = Venta::first();

        $this->assertDatabaseCount('detalles_venta', 2);
        $this->assertDatabaseHas('detalles_venta', [
            'venta_id' => $venta->id,
            'product_id' => $this->productoA->id,
            'subtotal' => 2550.00,
        ]);
        $this->assertDatabaseHas('detalles_venta', [
            'venta_id' => $venta->id,
            'product_id' => $this->productoLimite->id,
            'subtotal' => 3600.00,
        ]);
    }

    public function test_venta_en_efectivo_suma_el_monto_al_efectivo_esperado_de_la_caja(): void
    {
        $caja = $this->abrirCaja(10000.00);

        $this->postJson(self::ENDPOINT, $this->payload([
            'items' => [['producto_id' => $this->productoA->id, 'cantidad' => 2]],
        ]))->assertStatus(201);

        $ingresos = MovimientoCaja::where('caja_id', $caja->id)->sum('monto');

        $this->assertEquals(1700.00, (float) $ingresos);
        $this->assertEquals(11700.00, (float) $caja->saldo_inicial + (float) $ingresos);
    }
}