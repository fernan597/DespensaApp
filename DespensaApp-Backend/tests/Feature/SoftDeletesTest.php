<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Cliente;
use App\Models\Marca;
use App\Models\Product;
use App\Models\Proveedor;
use App\Models\User;
use App\Models\Venta;
use App\Models\DetalleVenta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SoftDeletesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create([
            'role' => 'admin_despensa',
        ]);
    }

    public function test_producto_se_elimina_logicamente_y_desaparece_de_listado(): void
    {
        $categoria = Category::create(['nombre' => 'Almacén']);
        $marca     = Marca::create(['nombre' => 'Genérica']);

        $producto = Product::create([
            'nombre'        => 'Arroz 1kg',
            'codigo_barra'  => '7791234567890',
            'stock_actual'  => 50,
            'stock_minimo'  => 10,
            'precio_compra' => '500.00',
            'precio_venta'  => '800.00',
            'categoria_id'  => $categoria->id,
            'marca_id'      => $marca->id,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/products/{$producto->id}");

        $response->assertStatus(200);

        // Ya no aparece en la consulta por defecto
        $this->assertNull(Product::find($producto->id));

        // Sigue existiendo en la BD con deleted_at
        $this->assertDatabaseHas('products', [
            'id' => $producto->id,
        ]);
        $this->assertNotNull(Product::withTrashed()->find($producto->id)->deleted_at);
    }

    public function test_producto_con_ventas_puede_eliminarse_logicamente_sin_error_de_fk(): void
    {
        $categoria = Category::create(['nombre' => 'Bebidas']);
        $marca     = Marca::create(['nombre' => 'Coca Cola']);

        $producto = Product::create([
            'nombre'        => 'Gaseosa Cola 1.5L',
            'codigo_barra'  => '7799999999999',
            'stock_actual'  => 20,
            'stock_minimo'  => 5,
            'precio_compra' => '1000.00',
            'precio_venta'  => '1500.00',
            'categoria_id'  => $categoria->id,
            'marca_id'      => $marca->id,
        ]);

        $venta = Venta::create([
            'user_id'    => $this->admin->id,
            'total'      => '1500.00',
            'tipo_venta' => 'CONTADO',
            'medio_pago' => 'EFECTIVO',
            'estado'     => 'COMPLETADA',
        ]);

        DetalleVenta::create([
            'venta_id'        => $venta->id,
            'product_id'      => $producto->id,
            'cantidad'        => 1,
            'precio_unitario' => '1500.00',
            'subtotal'        => '1500.00',
        ]);

        // Al intentar eliminarlo, no debe dar error 500 por foreign key
        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/products/{$producto->id}");

        $response->assertStatus(200);

        // El producto está soft-deleted y el detalle de venta sigue intacto
        $this->assertNull(Product::find($producto->id));
        $this->assertNotNull(Product::withTrashed()->find($producto->id)->deleted_at);
        $this->assertDatabaseHas('detalles_venta', [
            'product_id' => $producto->id,
            'venta_id'   => $venta->id,
        ]);
    }

    public function test_proveedor_se_elimina_logicamente(): void
    {
        $proveedor = Proveedor::create([
            'razon_social'   => 'Distribuidora Norte S.A.',
            'telefono'       => '3814000000',
            'saldo_adeudado' => '0.00',
            'activo'         => true,
        ]);

        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/proveedores/{$proveedor->id}");

        $response->assertStatus(200);

        $this->assertNull(Proveedor::find($proveedor->id));
        $this->assertNotNull(Proveedor::withTrashed()->find($proveedor->id)->deleted_at);
    }

    public function test_cliente_se_elimina_logicamente(): void
    {
        $cliente = Cliente::create([
            'nombre'                 => 'Juan',
            'apellido'               => 'Pérez',
            'telefono'               => '3815000000',
            'saldo_cuenta_corriente' => '0.00',
        ]);

        $cliente->delete();

        $this->assertNull(Cliente::find($cliente->id));
        $this->assertNotNull(Cliente::withTrashed()->find($cliente->id)->deleted_at);
    }

    public function test_usuario_se_elimina_logicamente(): void
    {
        $superAdmin = User::factory()->create([
            'role' => 'admin',
        ]);

        $empleado = User::factory()->create([
            'role' => 'empleado',
        ]);

        $response = $this->actingAs($superAdmin)
            ->deleteJson("/api/users/{$empleado->id}");

        $response->assertStatus(200);

        $this->assertNull(User::find($empleado->id));
        $this->assertNotNull(User::withTrashed()->find($empleado->id)->deleted_at);
    }

    public function test_categoria_y_marca_se_eliminan_logicamente(): void
    {
        $categoria = Category::create(['nombre' => 'Lácteos']);
        $marca     = Marca::create(['nombre' => 'La Serenísima']);

        $respCat = $this->actingAs($this->admin)
            ->deleteJson("/api/categories/{$categoria->id}");
        $respCat->assertStatus(200);

        $respMarca = $this->actingAs($this->admin)
            ->deleteJson("/api/marcas/{$marca->id}");
        $respMarca->assertStatus(200);

        $this->assertNull(Category::find($categoria->id));
        $this->assertNotNull(Category::withTrashed()->find($categoria->id)->deleted_at);

        $this->assertNull(Marca::find($marca->id));
        $this->assertNotNull(Marca::withTrashed()->find($marca->id)->deleted_at);
    }
}
