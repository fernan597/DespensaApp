<?php

namespace Tests\Feature;

use App\Enums\AccionAuditoria;
use App\Models\Category;
use App\Models\Marca;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Alta, listado, validaciones y permisos de Categorías y Marcas.
 */
class CategoriaMarcaTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private User $empleado;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        $this->empleado      = User::factory()->create(['role' => 'empleado']);
        $this->admin         = User::factory()->create(['role' => 'admin']);
    }

    // ---------------------------------------------------------------
    // Categorías
    // ---------------------------------------------------------------

    public function test_admin_despensa_crea_categoria_y_queda_auditada(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $this->postJson('/api/categories', ['nombre' => 'Limpieza'])
            ->assertCreated()
            ->assertJsonPath('ok', true)
            ->assertJsonPath('category.nombre', 'Limpieza');

        $this->assertDatabaseHas('categories', ['nombre' => 'Limpieza']);
        $this->assertDatabaseHas('auditorias', [
            'user_id' => $this->adminDespensa->id,
            'accion'  => AccionAuditoria::CREAR_CATEGORIA->value,
        ]);
    }

    public function test_categoria_valida_nombre_obligatorio_largo_y_unico(): void
    {
        Sanctum::actingAs($this->adminDespensa);
        Category::create(['nombre' => 'Bebidas']);

        $this->postJson('/api/categories', [])
            ->assertStatus(422)->assertJsonValidationErrors('nombre');

        $this->postJson('/api/categories', ['nombre' => str_repeat('a', 256)])
            ->assertStatus(422)->assertJsonValidationErrors('nombre');

        $this->postJson('/api/categories', ['nombre' => 'Bebidas'])
            ->assertStatus(422)->assertJsonValidationErrors('nombre');

        $this->assertDatabaseCount('categories', 1);
    }

    public function test_puede_recrear_categoria_con_nombre_de_una_eliminada_logicamente(): void
    {
        Sanctum::actingAs($this->adminDespensa);
        Category::create(['nombre' => 'Temporada'])->delete();

        $this->postJson('/api/categories', ['nombre' => 'Temporada'])->assertCreated();
    }

    public function test_listado_de_categorias_ordenado_alfabeticamente_para_pos(): void
    {
        Category::create(['nombre' => 'Verduras']);
        Category::create(['nombre' => 'Almacén']);
        Category::create(['nombre' => 'Lácteos']);

        Sanctum::actingAs($this->empleado);

        $this->getJson('/api/categories')
            ->assertOk()
            ->assertJsonCount(3, 'categories')
            ->assertJsonPath('categories.0.nombre', 'Almacén')
            ->assertJsonPath('categories.2.nombre', 'Verduras');
    }

    public function test_categoria_con_productos_no_se_puede_eliminar(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $categoria = Category::create(['nombre' => 'Almacén']);
        $marca     = Marca::create(['nombre' => 'Genérica']);
        Product::create([
            'nombre' => 'Arroz', 'codigo_barra' => '7790000000001',
            'stock_actual' => 10, 'stock_minimo' => 2,
            'precio_compra' => 100, 'precio_venta' => 150,
            'categoria_id' => $categoria->id, 'marca_id' => $marca->id,
        ]);

        $this->deleteJson("/api/categories/{$categoria->id}")->assertStatus(409);
        $this->deleteJson('/api/categories/999999')->assertNotFound();
        $this->assertNotSoftDeleted('categories', ['id' => $categoria->id]);
    }

    public function test_empleado_y_admin_sistema_no_pueden_crear_ni_eliminar_categorias(): void
    {
        $categoria = Category::create(['nombre' => 'Bebidas']);

        foreach ([$this->empleado, $this->admin] as $usuario) {
            Sanctum::actingAs($usuario);
            $this->postJson('/api/categories', ['nombre' => 'Nueva'])->assertForbidden();
            $this->deleteJson("/api/categories/{$categoria->id}")->assertForbidden();
        }

        Sanctum::actingAs($this->admin);
        $this->getJson('/api/categories')->assertForbidden();
    }

    // ---------------------------------------------------------------
    // Marcas
    // ---------------------------------------------------------------

    public function test_admin_despensa_crea_marca_y_queda_auditada(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $this->postJson('/api/marcas', ['nombre' => 'La Serenísima'])
            ->assertCreated()
            ->assertJsonPath('marca.nombre', 'La Serenísima');

        $this->assertDatabaseHas('auditorias', [
            'accion' => AccionAuditoria::CREAR_MARCA->value,
        ]);
    }

    public function test_marca_valida_nombre_obligatorio_y_unico(): void
    {
        Sanctum::actingAs($this->adminDespensa);
        Marca::create(['nombre' => 'Arcor']);

        $this->postJson('/api/marcas', ['nombre' => ''])
            ->assertStatus(422)->assertJsonValidationErrors('nombre');

        $this->postJson('/api/marcas', ['nombre' => 'Arcor'])
            ->assertStatus(422)->assertJsonValidationErrors('nombre');
    }

    public function test_listado_de_marcas_ordenado_alfabeticamente(): void
    {
        Marca::create(['nombre' => 'Molto']);
        Marca::create(['nombre' => 'Arcor']);

        Sanctum::actingAs($this->empleado);

        $this->getJson('/api/marcas')
            ->assertOk()
            ->assertJsonCount(2, 'marcas')
            ->assertJsonPath('marcas.0.nombre', 'Arcor');
    }

    public function test_marca_sin_productos_se_elimina_y_con_productos_no(): void
    {
        Sanctum::actingAs($this->adminDespensa);

        $libre     = Marca::create(['nombre' => 'Libre']);
        $usada     = Marca::create(['nombre' => 'Usada']);
        $categoria = Category::create(['nombre' => 'Almacén']);
        Product::create([
            'nombre' => 'Fideos', 'codigo_barra' => '7790000000002',
            'stock_actual' => 10, 'stock_minimo' => 2,
            'precio_compra' => 100, 'precio_venta' => 150,
            'categoria_id' => $categoria->id, 'marca_id' => $usada->id,
        ]);

        $this->deleteJson("/api/marcas/{$libre->id}")->assertOk();
        $this->assertSoftDeleted('marcas', ['id' => $libre->id]);

        $this->deleteJson("/api/marcas/{$usada->id}")->assertStatus(409);
        $this->assertNotSoftDeleted('marcas', ['id' => $usada->id]);
    }

    public function test_empleado_no_puede_crear_marcas(): void
    {
        Sanctum::actingAs($this->empleado);

        $this->postJson('/api/marcas', ['nombre' => 'X'])->assertForbidden();
    }
}

