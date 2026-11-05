<?php

namespace Tests\Feature;

use App\Models\AlertaStock;
use App\Models\Caja;
use App\Models\Category;
use App\Models\Marca;
use App\Models\Product;
use App\Models\Proveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * CU17 - Monitorear Alertas de Stock Mínimo.
 *
 * La consulta en vivo de productos es la fuente de verdad de la UI;
 * la tabla alertas_stock se comporta como bitácora de eventos.
 */
class AlertaStockMonitoreoTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private User $empleado;
    private User $admin;
    private Category $categoria;
    private Marca $marca;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        $this->empleado      = User::factory()->create(['role' => 'empleado']);
        $this->admin         = User::factory()->create(['role' => 'admin']);

        $this->categoria = Category::create(['nombre' => 'Almacén']);
        $this->marca     = Marca::create(['nombre' => 'Genérica']);

        Sanctum::actingAs($this->adminDespensa);
    }

    private function crearProducto(array $overrides = []): Product
    {
        static $secuencia = 0;
        $secuencia++;

        return Product::create(array_merge([
            'nombre'        => "Producto {$secuencia}",
            'codigo_barra'  => "779100000{$secuencia}",
            'stock_actual'  => 10,
            'stock_minimo'  => 5,
            'precio_compra' => 100.00,
            'precio_venta'  => 150.00,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ], $overrides));
    }

    private function abrirCaja(): void
    {
        Caja::create([
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => 10000.00,
            'fecha_apertura'      => now(),
            'estado'              => 'ABIERTA',
        ]);
    }

    private function vender(Product $producto, int $cantidad): void
    {
        $this->postJson('/api/ventas/contado', [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                ['producto_id' => $producto->id, 'cantidad' => $cantidad],
            ],
        ])->assertStatus(201);
    }

    public function test_listado_devuelve_metricas_y_ordena_por_criticidad(): void
    {
        $agotado = $this->crearProducto(['stock_actual' => 0, 'stock_minimo' => 5]);
        $bajo    = $this->crearProducto(['stock_actual' => 3, 'stock_minimo' => 5]);
        $this->crearProducto(['stock_actual' => 10, 'stock_minimo' => 5]);

        $response = $this->getJson('/api/alertas/stock-minimo');

        $response->assertOk()
            ->assertJsonPath('total_alertas', 2)
            ->assertJsonPath('agotados', 1)
            ->assertJsonPath('bajo_minimo', 1)
            ->assertJsonCount(2, 'products')
            ->assertJsonPath('products.0.id', $agotado->id)
            ->assertJsonPath('products.1.id', $bajo->id);
    }

    public function test_incluye_productos_con_stock_igual_al_minimo(): void
    {
        $limite = $this->crearProducto(['stock_actual' => 5, 'stock_minimo' => 5]);

        $response = $this->getJson('/api/alertas/stock-minimo');

        $response->assertOk()
            ->assertJsonPath('total_alertas', 1)
            ->assertJsonPath('bajo_minimo', 1)
            ->assertJsonPath('products.0.id', $limite->id);
    }

    public function test_empleado_puede_consultar_alertas(): void
    {
        Sanctum::actingAs($this->empleado);

        $this->getJson('/api/alertas/stock-minimo')->assertOk();
    }

    public function test_admin_de_plataforma_no_puede_consultar_alertas(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/alertas/stock-minimo')->assertForbidden();
    }

    public function test_usuario_no_autenticado_recibe_401(): void
    {
        $this->app['auth']->forgetGuards();

        $this->getJson('/api/alertas/stock-minimo')->assertUnauthorized();
    }

    public function test_ventas_sucesivas_no_duplican_la_alerta_abierta(): void
    {
        $this->abrirCaja();

        $producto = $this->crearProducto(['stock_actual' => 8, 'stock_minimo' => 5]);

        // 8 -> 7 -> 6: todavía por encima del mínimo, sin alertas.
        $this->vender($producto, 1);
        $this->vender($producto, 1);
        $this->assertDatabaseCount('alertas_stock', 0);

        // 6 -> 5: alcanza el mínimo.
        $this->vender($producto, 1);
        $this->assertDatabaseCount('alertas_stock', 1);

        // 5 -> 4: sigue por debajo, no debe crear otra alerta abierta.
        $this->vender($producto, 1);

        $this->assertDatabaseCount('alertas_stock', 1);
        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $producto->id,
            'atendida'   => false,
        ]);

        $alerta = AlertaStock::where('product_id', $producto->id)->first();
        $this->assertStringContainsString('4 unidad', $alerta->mensaje);
    }

    public function test_compra_que_repone_stock_resuelve_la_alerta_abierta(): void
    {
        $producto = $this->crearProducto(['stock_actual' => 3, 'stock_minimo' => 5]);

        AlertaStock::create([
            'product_id' => $producto->id,
            'mensaje'    => 'Stock bajo',
            'atendida'   => false,
        ]);

        $proveedor = Proveedor::create([
            'razon_social'   => 'Distribuidora Central S.A.',
            'telefono'       => '1122334455',
            'direccion'      => 'Av. Siempre Viva 123',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        $this->postJson('/api/compras', [
            'proveedor_id'       => $proveedor->id,
            'tipo_pago'          => 'CREDITO',
            'numero_comprobante' => 'FC-A-9001',
            'items'              => [
                [
                    'producto_id'    => $producto->id,
                    'cantidad'       => 10,
                    'costo_unitario' => 110.00,
                ],
            ],
        ])->assertStatus(201);

        $this->assertSame(13, $producto->fresh()->stock_actual);

        $this->assertDatabaseMissing('alertas_stock', [
            'product_id' => $producto->id,
            'atendida'   => false,
        ]);
        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $producto->id,
            'atendida'   => true,
        ]);
    }

    public function test_compra_que_no_supera_el_minimo_mantiene_la_alerta_abierta(): void
    {
        $producto = $this->crearProducto(['stock_actual' => 2, 'stock_minimo' => 5]);

        AlertaStock::create([
            'product_id' => $producto->id,
            'mensaje'    => 'Stock bajo',
            'atendida'   => false,
        ]);

        $proveedor = Proveedor::create([
            'razon_social'   => 'Distribuidora Central S.A.',
            'telefono'       => '1122334455',
            'direccion'      => 'Av. Siempre Viva 123',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        $this->postJson('/api/compras', [
            'proveedor_id'       => $proveedor->id,
            'tipo_pago'          => 'CREDITO',
            'numero_comprobante' => 'FC-A-9002',
            'items'              => [
                [
                    'producto_id'    => $producto->id,
                    'cantidad'       => 2,
                    'costo_unitario' => 110.00,
                ],
            ],
        ])->assertStatus(201);

        $this->assertSame(4, $producto->fresh()->stock_actual);
        $this->assertDatabaseCount('alertas_stock', 1);
        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $producto->id,
            'atendida'   => false,
        ]);
    }

    public function test_crear_producto_bajo_el_minimo_genera_alerta(): void
    {
        $response = $this->postJson('/api/products', [
            'name'          => 'Yerba Mate 1kg',
            'codigo_barra'  => '779100009999',
            'stock_actual'  => 2,
            'stock_minimo'  => 5,
            'precio_compra' => 900.00,
            'precio_venta'  => 1400.00,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $response->json('product.id'),
            'atendida'   => false,
        ]);
    }

    public function test_actualizar_producto_por_encima_del_minimo_resuelve_alerta(): void
    {
        $producto = $this->crearProducto(['stock_actual' => 2, 'stock_minimo' => 5]);

        AlertaStock::create([
            'product_id' => $producto->id,
            'mensaje'    => 'Stock bajo',
            'atendida'   => false,
        ]);

        $response = $this->putJson("/api/products/{$producto->id}", [
            'name'          => $producto->nombre,
            'codigo_barra'  => $producto->codigo_barra,
            'stock_actual'  => 20,
            'stock_minimo'  => 5,
            'precio_compra' => 100.00,
            'precio_venta'  => 150.00,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ]);

        $response->assertOk();

        $this->assertDatabaseHas('alertas_stock', [
            'product_id' => $producto->id,
            'atendida'   => true,
        ]);
    }

    public function test_productos_eliminados_logicamente_no_aparecen_en_el_listado(): void
    {
        $producto = $this->crearProducto(['stock_actual' => 1, 'stock_minimo' => 5]);
        $producto->delete();

        $response = $this->getJson('/api/alertas/stock-minimo');

        $response->assertOk()
            ->assertJsonPath('total_alertas', 0)
            ->assertJsonCount(0, 'products');
    }
}
