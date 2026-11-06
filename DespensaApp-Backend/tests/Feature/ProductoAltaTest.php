<?php

namespace Tests\Feature;

use App\Enums\AccionAuditoria;
use App\Models\Category;
use App\Models\Marca;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Alta de productos (validaciones, marca por nombre) y listado del catálogo.
 */
class ProductoAltaTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private Category $categoria;
    private Marca $marca;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        $this->categoria     = Category::create(['nombre' => 'Almacén']);
        $this->marca         = Marca::create(['nombre' => 'Arcor']);

        Sanctum::actingAs($this->adminDespensa);
    }

    private function payload(array $override = []): array
    {
        return array_merge([
            'name'          => 'Galletitas 300g',
            'codigo_barra'  => '7790580000001',
            'stock_actual'  => 30,
            'stock_minimo'  => 5,
            'precio_compra' => 800,
            'precio_venta'  => 1200,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ], $override);
    }

    public function test_crea_producto_con_marca_existente_y_queda_auditado(): void
    {
        $this->postJson('/api/products', $this->payload())
            ->assertCreated()
            ->assertJsonPath('product.nombre', 'Galletitas 300g')
            ->assertJsonPath('product.marca.nombre', 'Arcor')
            ->assertJsonPath('product.categoria.nombre', 'Almacén');

        $this->assertDatabaseHas('products', [
            'codigo_barra' => '7790580000001',
            'marca_id'     => $this->marca->id,
        ]);
        $this->assertDatabaseHas('auditorias', [
            'accion' => AccionAuditoria::CREAR_PRODUCTO->value,
        ]);
    }

    public function test_crea_marca_nueva_si_se_envia_marca_nombre(): void
    {
        $this->postJson('/api/products', $this->payload([
            'marca_id'     => null,
            'marca_nombre' => '  Bagley  ',
        ]))->assertCreated();

        $this->assertDatabaseHas('marcas', ['nombre' => 'Bagley']);
    }

    public function test_reutiliza_marca_existente_por_nombre_sin_duplicarla(): void
    {
        $this->postJson('/api/products', $this->payload([
            'marca_id'     => null,
            'marca_nombre' => 'Arcor',
        ]))->assertCreated();

        $this->assertSame(1, Marca::where('nombre', 'Arcor')->count());
    }

    public function test_valida_campos_obligatorios(): void
    {
        $this->postJson('/api/products', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'name', 'codigo_barra', 'stock_actual', 'stock_minimo',
                'precio_compra', 'precio_venta', 'categoria_id', 'marca_nombre',
            ]);
    }

    public function test_valida_valores_numericos_y_relaciones(): void
    {
        $this->postJson('/api/products', $this->payload([
            'stock_actual'  => -1,
            'stock_minimo'  => 2.5,
            'precio_compra' => -100,
            'precio_venta'  => 0,
            'categoria_id'  => 999999,
            'marca_id'      => 999999,
        ]))
            ->assertStatus(422)
            ->assertJsonValidationErrors([
                'stock_actual', 'stock_minimo', 'precio_compra',
                'precio_venta', 'categoria_id', 'marca_id',
            ]);

        $this->assertDatabaseCount('products', 0);
    }

    public function test_rechaza_categoria_eliminada_logicamente(): void
    {
        $eliminada = Category::create(['nombre' => 'Vieja']);
        $eliminada->delete();

        $this->postJson('/api/products', $this->payload(['categoria_id' => $eliminada->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('categoria_id');
    }

    public function test_listado_del_catalogo_incluye_categoria_marca_y_margen(): void
    {
        $this->postJson('/api/products', $this->payload())->assertCreated();

        Sanctum::actingAs(User::factory()->create(['role' => 'empleado']));

        $this->getJson('/api/products')
            ->assertOk()
            ->assertJsonCount(1, 'products')
            ->assertJsonStructure([
                'products' => [[
                    'id', 'nombre', 'codigo_barra', 'stock_actual', 'stock_minimo',
                    'precio_compra', 'precio_venta', 'margen_ganancia',
                    'categoria' => ['id', 'nombre'],
                    'marca'     => ['id', 'nombre'],
                ]],
            ]);
    }

    public function test_empleado_no_puede_crear_productos(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'empleado']));

        $this->postJson('/api/products', $this->payload())->assertForbidden();
        $this->assertDatabaseCount('products', 0);
    }
}

