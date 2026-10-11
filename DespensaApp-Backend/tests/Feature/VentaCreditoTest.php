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
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VentaCreditoTest extends TestCase
{
    use RefreshDatabase;

    private User $empleado;
    private Cliente $cliente;
    private Product $producto;
    private Product $productoConAlerta;

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create([
            'role' => 'empleado',
        ]);

        Sanctum::actingAs($this->empleado);

        $this->cliente = Cliente::create([
            'nombre'                 => 'Carlos',
            'apellido'               => 'Gomez',
            'telefono'               => '1155443322',
            'direccion'              => 'Calle Falsa 123',
            'saldo_cuenta_corriente' => 0.00,
        ]);

        $categoria = Category::create(['nombre' => 'Almacén']);
        $marca     = Marca::create(['nombre' => 'Marca X']);

        $this->producto = Product::create([
            'nombre'        => 'Yerba Mate 1kg',
            'codigo_barra'  => '7791234567890',
            'stock_actual'  => 20,
            'stock_minimo'  => 5,
            'precio_compra' => 1500.00,
            'precio_venta'  => 2200.00,
            'categoria_id'  => $categoria->id,
            'marca_id'      => $marca->id,
        ]);

        $this->productoConAlerta = Product::create([
            'nombre'        => 'Azúcar 1kg',
            'codigo_barra'  => '7799876543210',
            'stock_actual'  => 6,
            'stock_minimo'  => 5,
            'precio_compra' => 800.00,
            'precio_venta'  => 1000.00,
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

    public function test_venta_a_credito_exitosa_camino_feliz(): void
    {
        $this->abrirCaja();

        $payload = [
            'cliente_id' => $this->cliente->id,
            'items'      => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad'    => 2, // 2 * 2200 = 4400
                ],
                [
                    'producto_id' => $this->productoConAlerta->id,
                    'cantidad'    => 2, // 2 * 1000 = 2000, stock baja de 6 a 4 (<= 5)
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/credito', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('venta.tipo_venta', 'CUENTA_CORRIENTE')
            ->assertJsonPath('venta.medio_pago', 'CREDITO')
            ->assertJsonPath('venta.cliente_id', $this->cliente->id);

        $this->assertDatabaseHas('ventas', [
            'cliente_id' => $this->cliente->id,
            'total'      => 6400.00,
            'tipo_venta' => 'CUENTA_CORRIENTE',
            'medio_pago' => 'CREDITO',
            'estado'     => 'COMPLETADA',
        ]);

        // 1. Stock descontado
        $this->assertEquals(18, $this->producto->fresh()->stock_actual);
        $this->assertEquals(4, $this->productoConAlerta->fresh()->stock_actual);

        // 2. Alerta de stock emitida para el producto que cruzó umbral
        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $this->productoConAlerta->id,
            'atendida'   => false,
        ]);

        // 3. Movimiento de cuenta corriente cliente DEBITO registrado
        $this->assertDatabaseHas('movimientos_cuenta_corriente_clientes', [
            'cliente_id'      => $this->cliente->id,
            'monto'           => 6400.00,
            'tipo_movimiento' => 'DEBITO',
        ]);

        // 4. Saldo adeudado del cliente incrementado
        $this->assertEquals(6400.00, (float) $this->cliente->fresh()->saldo_cuenta_corriente);

        // 5. NO genera movimiento de caja
        $this->assertEquals(0, MovimientoCaja::count());
    }

    public function test_venta_a_credito_falla_sin_cliente(): void
    {
        $this->abrirCaja();

        $payload = [
            'items' => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/credito', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cliente_id']);
    }

    public function test_venta_a_credito_falla_con_cliente_inexistente(): void
    {
        $this->abrirCaja();

        $payload = [
            'cliente_id' => 99999,
            'items'      => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/credito', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['cliente_id']);
    }

    public function test_venta_a_credito_falla_si_la_caja_esta_cerrada(): void
    {
        // No abrimos la caja

        $payload = [
            'cliente_id' => $this->cliente->id,
            'items'      => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad'    => 1,
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/credito', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.']);

        // Stock y deuda del cliente permanecen intactos
        $this->assertEquals(20, $this->producto->fresh()->stock_actual);
        $this->assertEquals(0.00, (float) $this->cliente->fresh()->saldo_cuenta_corriente);
        $this->assertEquals(0, Venta::count());
    }

    public function test_venta_a_credito_falla_con_rollback_si_stock_insuficiente(): void
    {
        $this->abrirCaja();

        $payload = [
            'cliente_id' => $this->cliente->id,
            'items'      => [
                [
                    'producto_id' => $this->producto->id,
                    'cantidad'    => 25, // Disponible: 20
                ],
            ],
        ];

        $response = $this->postJson('/api/ventas/credito', $payload);

        $response->assertStatus(422);

        // Rollback completo: sin cambios en stock, sin ventas, sin movimientos de cuenta corriente
        $this->assertEquals(20, $this->producto->fresh()->stock_actual);
        $this->assertEquals(0.00, (float) $this->cliente->fresh()->saldo_cuenta_corriente);
        $this->assertEquals(0, Venta::count());
        $this->assertEquals(0, MovimientoCuentaCorrienteCliente::count());
    }

    public function test_listado_y_busqueda_de_clientes(): void
    {
        Cliente::create([
            'nombre'   => 'Mariana',
            'apellido' => 'Lopez',
            'telefono' => '1199887766',
        ]);

        $response = $this->getJson('/api/clientes');
        $response->assertStatus(200)
            ->assertJsonCount(2, 'clientes');

        $searchResponse = $this->getJson('/api/clientes?search=Mariana');
        $searchResponse->assertStatus(200)
            ->assertJsonCount(1, 'clientes')
            ->assertJsonPath('clientes.0.nombre', 'Mariana');
    }
}
