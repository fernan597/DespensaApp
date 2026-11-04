<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Marca;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProductPriceUpdateTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private User $admin;
    private User $empleado;
    private Category $categoria;
    private Category $otraCategoria;
    private Marca $marca;
    private Marca $otraMarca;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->empleado = User::factory()->create(['role' => 'empleado']);

        $this->categoria = Category::create(['nombre' => 'Almacén']);
        $this->otraCategoria = Category::create(['nombre' => 'Bebidas']);
        $this->marca = Marca::create(['nombre' => 'Marca A']);
        $this->otraMarca = Marca::create(['nombre' => 'Marca B']);

        Sanctum::actingAs($this->adminDespensa);
    }

    private function crearProducto(array $overrides = []): Product
    {
        static $secuencia = 0;
        $secuencia++;

        return Product::create(array_merge([
            'nombre'        => "Producto {$secuencia}",
            'codigo_barra'  => "779000000{$secuencia}",
            'stock_actual'  => 10,
            'stock_minimo'  => 3,
            'precio_compra' => 100.00,
            'precio_venta'  => 130.00,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ], $overrides));
    }

    public function test_actualizacion_individual_recalcula_margen_y_devuelve_strings(): void
    {
        $producto = $this->crearProducto();

        $response = $this->putJson('/api/products/precios', [
            'modo'          => 'individual',
            'product_id'    => $producto->id,
            'precio_compra' => 200.00,
            'precio_venta'  => 300.00,
        ]);

        $response->assertOk()
            ->assertJsonPath('product.precio_compra', '200.00')
            ->assertJsonPath('product.precio_venta', '300.00')
            ->assertJsonPath('product.margen_ganancia', '50.00');

        $this->assertSame('200.00', $producto->fresh()->precio_compra);
        $this->assertSame('300.00', $producto->fresh()->precio_venta);
    }

    public function test_producto_inexistente_retorna_404(): void
    {
        $response = $this->putJson('/api/products/precios', [
            'modo'          => 'individual',
            'product_id'    => 99999,
            'precio_compra' => 100,
            'precio_venta'  => 150,
        ]);

        $response->assertNotFound();
    }

    public function test_precio_de_venta_invalido_retorna_422(): void
    {
        $producto = $this->crearProducto();

        $response = $this->putJson('/api/products/precios', [
            'modo'          => 'individual',
            'product_id'    => $producto->id,
            'precio_compra' => 100,
            'precio_venta'  => 0,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['precio_venta']);
    }

    public function test_actualizacion_masiva_por_categoria_aplica_factor_y_costo(): void
    {
        $producto = $this->crearProducto(['precio_compra' => 100.00, 'precio_venta' => 200.00]);
        $otro = $this->crearProducto([
            'categoria_id'  => $this->otraCategoria->id,
            'precio_compra' => 100.00,
            'precio_venta'  => 200.00,
        ]);

        $response = $this->putJson('/api/products/precios', [
            'modo'              => 'masivo',
            'filtro_tipo'       => 'categoria',
            'categoria_id'      => $this->categoria->id,
            'tipo_ajuste'       => 'porcentaje_aumento',
            'valor_porcentaje'  => 10,
            'actualizar_costo'  => true,
        ]);

        $response->assertOk()
            ->assertJsonPath('updated_count', 1)
            ->assertJsonPath('skipped_count', 0);

        $this->assertSame('110.00', $producto->fresh()->precio_compra);
        $this->assertSame('220.00', $producto->fresh()->precio_venta);
        $this->assertSame('100.00', $otro->fresh()->precio_compra);
        $this->assertSame('200.00', $otro->fresh()->precio_venta);
    }

    public function test_actualizacion_masiva_por_marca_fija_margen_sobre_costo(): void
    {
        $producto = $this->crearProducto(['precio_compra' => 100.00, 'precio_venta' => 200.00]);
        $otro = $this->crearProducto([
            'marca_id'      => $this->otraMarca->id,
            'precio_compra' => 100.00,
            'precio_venta'  => 200.00,
        ]);

        $response = $this->putJson('/api/products/precios', [
            'modo'             => 'masivo',
            'filtro_tipo'      => 'marca',
            'marca_id'         => $this->marca->id,
            'tipo_ajuste'      => 'fijar_margen',
            'valor_porcentaje' => 30,
        ]);

        $response->assertOk()
            ->assertJsonPath('updated_count', 1);

        $this->assertSame('130.00', $producto->fresh()->precio_venta);
        $this->assertSame('200.00', $otro->fresh()->precio_venta);
    }

    public function test_actualizacion_masiva_sin_productos_retorna_422(): void
    {
        $categoriaVacia = Category::create(['nombre' => 'Sin productos']);

        $response = $this->putJson('/api/products/precios', [
            'modo'             => 'masivo',
            'filtro_tipo'      => 'categoria',
            'categoria_id'     => $categoriaVacia->id,
            'tipo_ajuste'      => 'porcentaje_aumento',
            'valor_porcentaje' => 10,
        ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'No se encontraron productos para el filtro seleccionado.');
    }

    public function test_producto_con_costo_cero_se_omite_al_fijar_margen(): void
    {
        $producto = $this->crearProducto([
            'precio_compra' => 0.00,
            'precio_venta'  => 50.00,
        ]);

        $response = $this->putJson('/api/products/precios', [
            'modo'             => 'masivo',
            'filtro_tipo'      => 'todos',
            'tipo_ajuste'      => 'fijar_margen',
            'valor_porcentaje' => 30,
        ]);

        $response->assertOk()
            ->assertJsonPath('updated_count', 0)
            ->assertJsonPath('skipped_count', 1);

        $this->assertSame('50.00', $producto->fresh()->precio_venta);
    }

    public function test_producto_eliminado_logicamente_no_se_actualiza_masivamente(): void
    {
        $producto = $this->crearProducto();
        $producto->delete();

        $response = $this->putJson('/api/products/precios', [
            'modo'             => 'masivo',
            'filtro_tipo'      => 'todos',
            'tipo_ajuste'      => 'porcentaje_aumento',
            'valor_porcentaje' => 10,
        ]);

        $response->assertStatus(422);

        $this->assertSame(
            '130.00',
            Product::withTrashed()->find($producto->id)->precio_venta
        );
    }

    public function test_admin_de_plataforma_y_empleado_no_pueden_actualizar_precios(): void
    {
        $producto = $this->crearProducto();
        $payload = [
            'modo'          => 'individual',
            'product_id'    => $producto->id,
            'precio_compra' => 100,
            'precio_venta'  => 150,
        ];

        Sanctum::actingAs($this->admin);
        $this->putJson('/api/products/precios', $payload)->assertForbidden();

        Sanctum::actingAs($this->empleado);
        $this->putJson('/api/products/precios', $payload)->assertForbidden();
    }
}
