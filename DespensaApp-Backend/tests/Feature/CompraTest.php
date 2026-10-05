<?php

namespace Tests\Feature;

use App\Models\Caja;
use App\Models\Category;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\Marca;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\Product;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CompraTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private Proveedor $proveedor;
    private Product $productoA;
    private Product $productoB;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create([
            'role' => 'admin_despensa',
        ]);

        Sanctum::actingAs($this->adminDespensa);

        $this->proveedor = Proveedor::create([
            'razon_social'   => 'Distribuidora Central S.A.',
            'telefono'       => '1122334455',
            'direccion'      => 'Av. Siempre Viva 123',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        $categoria = Category::create(['nombre' => 'Alimentos']);
        $marca = Marca::create(['nombre' => 'Generica']);

        $this->productoA = Product::create([
            'nombre'         => 'Arroz 1kg',
            'codigo_barra'   => '7790001001',
            'stock_actual'   => 10,
            'stock_minimo'   => 5,
            'precio_compra'  => 800.00,
            'precio_venta'   => 1200.00,
            'categoria_id'   => $categoria->id,
            'marca_id'       => $marca->id,
        ]);

        $this->productoB = Product::create([
            'nombre'         => 'Fideos 500g',
            'codigo_barra'   => '7790001002',
            'stock_actual'   => 20,
            'stock_minimo'   => 5,
            'precio_compra'  => 600.00,
            'precio_venta'   => 950.00,
            'categoria_id'   => $categoria->id,
            'marca_id'       => $marca->id,
        ]);
    }

    public function test_compra_contado_camino_feliz(): void
    {
        // Abrir caja para permitir el egreso
        $caja = Caja::create([
            'usuario_apertura_id' => $this->adminDespensa->id,
            'saldo_inicial'       => 50000.00,
            'fecha_apertura'      => now(),
            'estado'              => 'ABIERTA',
        ]);

        $payload = [
            'proveedor_id'       => $this->proveedor->id,
            'tipo_pago'          => 'CONTADO',
            'numero_comprobante' => 'FC-A-0001',
            'items'              => [
                [
                    'producto_id'    => $this->productoA->id,
                    'cantidad'       => 15,
                    'costo_unitario' => 850.00,
                ],
                [
                    'producto_id'    => $this->productoB->id,
                    'cantidad'       => 10,
                    'costo_unitario' => 650.00,
                ],
            ],
        ];

        // Total esperado: (15 * 850) + (10 * 650) = 12750 + 6500 = 19250
        $response = $this->postJson('/api/compras', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('compra.total', '19250.00')
            ->assertJsonPath('compra.tipo_pago', 'CONTADO')
            ->assertJsonPath('compra.numero_comprobante', 'FC-A-0001');

        // 1. Verificar stock incrementado y costos actualizados
        $this->assertEquals(25, $this->productoA->fresh()->stock_actual);
        $this->assertEquals(850.00, (float) $this->productoA->fresh()->precio_compra);

        $this->assertEquals(30, $this->productoB->fresh()->stock_actual);
        $this->assertEquals(650.00, (float) $this->productoB->fresh()->precio_compra);

        // 2. Verificar que se creó la compra y los 2 detalles
        $this->assertDatabaseHas('compras', [
            'proveedor_id'       => $this->proveedor->id,
            'total'              => 19250.00,
            'tipo_pago'          => 'CONTADO',
            'numero_comprobante' => 'FC-A-0001',
        ]);

        $this->assertDatabaseCount('detalles_compra', 2);

        // 3. Verificar que se generó el egreso de caja vinculado
        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id' => $caja->id,
            'monto'   => 19250.00,
            'tipo'    => 'EGRESO_PAGO_PROVEEDOR',
        ]);
    }

    public function test_compra_credito_camino_feliz(): void
    {
        $payload = [
            'proveedor_id'       => $this->proveedor->id,
            'tipo_pago'          => 'CREDITO',
            'numero_comprobante' => 'FC-A-0002',
            'items'              => [
                [
                    'producto_id'    => $this->productoA->id,
                    'cantidad'       => 5,
                    'costo_unitario' => 900.00,
                ],
            ],
        ];

        // Total esperado: 5 * 900 = 4500
        $response = $this->postJson('/api/compras', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('compra.total', '4500.00')
            ->assertJsonPath('compra.tipo_pago', 'CUENTA_CORRIENTE')
            ->assertJsonPath('compra.pendiente_pago', true);

        // 1. Verificar stock y costo
        $this->assertEquals(15, $this->productoA->fresh()->stock_actual);
        $this->assertEquals(900.00, (float) $this->productoA->fresh()->precio_compra);

        // 2. Verificar saldo adeudado del proveedor incrementado
        $this->assertEquals(4500.00, (float) $this->proveedor->fresh()->saldo_adeudado);

        // 3. Verificar movimiento de cuenta corriente generado
        $this->assertDatabaseHas('movimientos_cuenta_corriente_proveedores', [
            'proveedor_id'    => $this->proveedor->id,
            'monto'           => 4500.00,
            'tipo_movimiento' => 'DEBITO',
        ]);

        // 4. No debe haber movimientos de caja
        $this->assertDatabaseCount('movimientos_caja', 0);
    }

    public function test_compra_contado_falla_si_caja_esta_cerrada(): void
    {
        // No hay caja abierta
        $payload = [
            'proveedor_id' => $this->proveedor->id,
            'tipo_pago'    => 'CONTADO',
            'items'        => [
                [
                    'producto_id'    => $this->productoA->id,
                    'cantidad'       => 5,
                    'costo_unitario' => 800.00,
                ],
            ],
        ];

        $response = $this->postJson('/api/compras', $payload);

        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'No hay caja abierta para registrar el egreso de una compra de contado. Abra la caja primero.',
            ]);

        // Stock no debe haber cambiado
        $this->assertEquals(10, $this->productoA->fresh()->stock_actual);
    }

    public function test_compra_falla_si_proveedor_esta_inactivo(): void
    {
        $proveedorInactivo = Proveedor::create([
            'razon_social'   => 'Proveedor Inactivo S.R.L.',
            'saldo_adeudado' => 0.00,
            'activo'         => false,
        ]);

        $payload = [
            'proveedor_id' => $proveedorInactivo->id,
            'tipo_pago'    => 'CREDITO',
            'items'        => [
                [
                    'producto_id'    => $this->productoA->id,
                    'cantidad'       => 1,
                    'costo_unitario' => 500.00,
                ],
            ],
        ];

        $response = $this->postJson('/api/compras', $payload);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['proveedor_id']);
    }

    public function test_validaciones_de_cantidades_costos_y_productos_duplicados(): void
    {
        // Sin ítems
        $this->postJson('/api/compras', [
            'proveedor_id' => $this->proveedor->id,
            'tipo_pago'    => 'CREDITO',
            'items'        => [],
        ])->assertStatus(422)->assertJsonValidationErrors(['items']);

        // Cantidad <= 0 o decimal
        $this->postJson('/api/compras', [
            'proveedor_id' => $this->proveedor->id,
            'tipo_pago'    => 'CREDITO',
            'items'        => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 0, 'costo_unitario' => 100],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['items.0.cantidad']);

        $this->postJson('/api/compras', [
            'proveedor_id' => $this->proveedor->id,
            'tipo_pago'    => 'CREDITO',
            'items'        => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 1.5, 'costo_unitario' => 100],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['items.0.cantidad']);

        // Costo <= 0
        $this->postJson('/api/compras', [
            'proveedor_id' => $this->proveedor->id,
            'tipo_pago'    => 'CREDITO',
            'items'        => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 1, 'costo_unitario' => 0],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['items.0.costo_unitario']);

        // Producto duplicado en la misma compra
        $this->postJson('/api/compras', [
            'proveedor_id' => $this->proveedor->id,
            'tipo_pago'    => 'CREDITO',
            'items'        => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 1, 'costo_unitario' => 100],
                ['producto_id' => $this->productoA->id, 'cantidad' => 2, 'costo_unitario' => 120],
            ],
        ])->assertStatus(422)->assertJsonValidationErrors(['items.0.producto_id']);
    }

    public function test_no_permite_comprobante_duplicado_mismo_proveedor(): void
    {
        $payload = [
            'proveedor_id'       => $this->proveedor->id,
            'tipo_pago'          => 'CREDITO',
            'numero_comprobante' => 'REPETIDO-001',
            'items'              => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 2, 'costo_unitario' => 500],
            ],
        ];

        // Primera compra: éxito
        $this->postJson('/api/compras', $payload)->assertStatus(201);

        // Segunda compra con el mismo comprobante: error 422 controlado
        $response = $this->postJson('/api/compras', $payload);
        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => "Ya existe una compra registrada con el comprobante 'REPETIDO-001' para este proveedor.",
            ]);
    }
}
