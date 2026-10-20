<?php

namespace Tests\Feature;

use App\Models\AlertaStock;
use App\Models\Caja;
use App\Models\Category;
use App\Models\Cliente;
use App\Models\Marca;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteCliente;
use App\Models\Product;
use App\Models\User;
use App\Models\Venta;
use App\Services\VentaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VentaContadoTest extends TestCase
{
    use RefreshDatabase;

    private User $empleado;
    private Cliente $cliente;
    private Product $productoA;
    private Product $productoConAlerta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create([
            'role' => 'empleado',
        ]);

        Sanctum::actingAs($this->empleado);

        $this->cliente = Cliente::create([
            'nombre'                 => 'Juan',
            'apellido'               => 'Perez',
            'telefono'               => '1122334455',
            'direccion'              => 'Av. Siempre Viva 742',
            'saldo_cuenta_corriente' => 0.00,
        ]);

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

        $this->productoConAlerta = Product::create([
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

    private function abrirCaja(): Caja
    {
        return Caja::create([
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => 10000.00,
            'fecha_apertura'      => now(),
            'estado'              => 'ABIERTA',
        ]);
    }

    public function test_venta_contado_exitosa_en_efectivo_impacta_caja_y_descuenta_stock(): void
    {
        $caja = $this->abrirCaja();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 2, // 2 * 850 = 1700
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('message', 'Venta registrada correctamente.')
            ->assertJsonPath('venta.tipo_venta', 'CONTADO')
            ->assertJsonPath('venta.medio_pago', 'EFECTIVO')
            ->assertJsonPath('venta.estado', 'COMPLETADA')
            ->assertJsonPath('venta.total', 1700);

        // 1. Cabecera persistida
        $this->assertDatabaseHas('ventas', [
            'tipo_venta' => 'CONTADO',
            'medio_pago' => 'EFECTIVO',
            'total'      => 1700.00,
            'estado'     => 'COMPLETADA',
        ]);

        $venta = Venta::first();

        // 2. Detalle de venta persistido con precio de BD
        $this->assertDatabaseHas('detalles_venta', [
            'venta_id'        => $venta->id,
            'product_id'      => $this->productoA->id,
            'cantidad'        => 2,
            'precio_unitario' => 850.00,
            'subtotal'        => 1700.00,
        ]);

        // 3. Stock descontado del producto
        $this->assertEquals(23, $this->productoA->fresh()->stock_actual);

        // 4. Movimiento de caja registrado para EFECTIVO
        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id'  => $caja->id,
            'tipo'     => 'INGRESO_VENTA',
            'monto'    => 1700.00,
            'concepto' => "Venta #{$venta->id}",
            'venta_id' => $venta->id,
        ]);
    }

    public function test_venta_contado_genera_alerta_si_stock_alcanza_o_supera_umbral_minimo(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 2, // Stock 25 -> 23 (> 5), no debe generar alerta
                ],
                [
                    'producto_id' => $this->productoConAlerta->id,
                    'cantidad'    => 2, // Stock 6 -> 4 (<= 5), debe generar alerta
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(201);

        // Verificamos decremento de stock
        $this->assertEquals(23, $this->productoA->fresh()->stock_actual);
        $this->assertEquals(4, $this->productoConAlerta->fresh()->stock_actual);

        // Alerta generada para el producto que cruzó el umbral
        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $this->productoConAlerta->id,
            'atendida'   => false,
        ]);

        // Sin alerta para el producto con stock suficiente
        $this->assertDatabaseMissing('alertas_stock', [
            'product_id' => $this->productoA->id,
        ]);
    }

    public function test_venta_contado_con_medio_digital_transferencia_no_genera_movimiento_caja(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'TRANSFERENCIA',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('venta.medio_pago', 'TRANSFERENCIA')
            ->assertJsonPath('venta.total', 850);

        // Stock descontado
        $this->assertEquals(24, $this->productoA->fresh()->stock_actual);

        // No impacta dinero físico en la caja
        $this->assertEquals(0, MovimientoCaja::count());
    }

    public function test_venta_contado_con_medio_digital_debito_no_genera_movimiento_caja(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'DEBITO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 2,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('venta.medio_pago', 'DEBITO');

        // No impacta dinero físico en la caja
        $this->assertEquals(0, MovimientoCaja::count());
    }

    public function test_venta_contado_con_cliente_asociado_no_afecta_su_cuenta_corriente(): void
    {
        $this->abrirCaja();

        $payload = [
            'cliente_id' => $this->cliente->id,
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('venta.cliente_id', $this->cliente->id);

        $this->assertDatabaseHas('ventas', [
            'cliente_id' => $this->cliente->id,
            'tipo_venta' => 'CONTADO',
        ]);

        // La cuenta corriente del cliente permanece intacta (sin saldo de deuda y sin movimientos)
        $this->assertEquals(0.00, (float) $this->cliente->fresh()->saldo_cuenta_corriente);
        $this->assertEquals(0, MovimientoCuentaCorrienteCliente::count());
    }

    public function test_venta_contado_sin_cliente_se_registra_correctamente(): void
    {
        $this->abrirCaja();

        $payload = [
            'cliente_id' => null,
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('venta.cliente_id', null);

        $this->assertDatabaseHas('ventas', [
            'cliente_id' => null,
            'tipo_venta' => 'CONTADO',
        ]);
    }

    public function test_venta_contado_falla_si_la_caja_esta_cerrada(): void
    {
        // Sin abrir caja

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ]);

        // Inventario y ventas intactos
        $this->assertEquals(25, $this->productoA->fresh()->stock_actual);
        $this->assertEquals(0, Venta::count());
        $this->assertEquals(0, MovimientoCaja::count());
    }

    public function falla_con_stock_insuficiente_y_no_modifica_ningun_producto(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 2, // Disponible: 25
                ],
                [
                    'producto_id' => $this->productoConAlerta->id,
                    'cantidad'    => 10, // Disponible: 6 -> Falla por stock insuficiente
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => "Stock insuficiente para 'Aceite de Girasol 900ml'. Disponible: 6, solicitado: 10.",
            ]);

        // Rollback total: Ningún producto modificó stock, ni el primero
        $this->assertEquals(25, $this->productoA->fresh()->stock_actual);
        $this->assertEquals(6, $this->productoConAlerta->fresh()->stock_actual);

        // Sin registros huérfanos
        $this->assertEquals(0, Venta::count());
        $this->assertEquals(0, MovimientoCaja::count());
        $this->assertEquals(0, AlertaStock::count());
    }

    public function test_venta_contado_falla_con_carrito_vacio(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items']);
    }

    public function test_venta_contado_falla_con_cantidad_cero_o_negativa(): void
    {
        $this->abrirCaja();

        $payloadCero = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 0,
                ],
            ],
        ];

        $this->postJson('/api/ventas/contado', $payloadCero)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.cantidad']);

        $payloadNegativo = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => -5,
                ],
            ],
        ];

        $this->postJson('/api/ventas/contado', $payloadNegativo)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.cantidad']);
    }

    public function test_venta_contado_falla_con_cantidad_no_entera(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 2.5,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.cantidad']);
    }

    public function test_venta_contado_falla_con_producto_inexistente(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => 99999,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.producto_id']);
    }

    public function test_venta_contado_falla_con_productos_duplicados_en_items(): void
    {
        $this->abrirCaja();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 2,
                ],
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['items.0.producto_id']);
    }

    public function test_venta_contado_falla_con_medio_pago_invalido_o_ausente(): void
    {
        $this->abrirCaja();

        // Sin medio de pago
        $payloadSinMedio = [
            'items' => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $this->postJson('/api/ventas/contado', $payloadSinMedio)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['medio_pago']);

        // Con medio de pago no permitido
        $payloadMedioInvalido = [
            'medio_pago' => 'CRIPTO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $this->postJson('/api/ventas/contado', $payloadMedioInvalido)
            ->assertStatus(422)
            ->assertJsonValidationErrors(['medio_pago']);
    }

    public function test_venta_contado_falla_con_cliente_inexistente(): void
    {
        $this->abrirCaja();

        $payload = [
            'cliente_id' => 99999,
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cliente_id']);
    }

    public function test_usuario_no_autenticado_no_puede_registrar_venta_contado(): void
    {
        // Desautenticar el usuario
        $this->app['auth']->forgetGuards();

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(401);
    }

    public function test_admin_despensa_y_admin_pueden_registrar_venta_contado(): void
    {
        $caja = $this->abrirCaja();

        // Rol admin_despensa
        $adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        Sanctum::actingAs($adminDespensa);

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $responseAdminDespensa = $this->postJson('/api/ventas/contado', $payload);
        $responseAdminDespensa->assertStatus(201);

        // Rol admin
        $admin = User::factory()->create(['role' => 'admin']);
        Sanctum::actingAs($admin);

        $responseAdmin = $this->postJson('/api/ventas/contado', $payload);
        $responseAdmin->assertStatus(201);
    }

    public function test_error_inesperado_retorna_status_500_y_no_persiste_datos(): void
    {
        $this->abrirCaja();

        $mockService = $this->mock(VentaService::class);
        $mockService->shouldReceive('prepararItems')
            ->andThrow(new \RuntimeException('Fallo inesperado de conexión'));

        $payload = [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                [
                    'producto_id' => $this->productoA->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/contado', $payload);

        $response->assertStatus(500)
            ->assertJsonPath('message', 'Ocurrió un error interno al registrar la venta.');

        $this->assertEquals(0, Venta::count());
        $this->assertEquals(0, MovimientoCaja::count());
    }
}
