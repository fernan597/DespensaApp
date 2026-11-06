<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\DetalleVenta;
use App\Models\Marca;
use App\Models\Product;
use App\Models\Proveedor;
use App\Models\User;
use App\Models\Venta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Listados y detalles de compras (historial) y ventas.
 */
class ConsultaComprasVentasTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private User $empleado;
    private Proveedor $proveedor;
    private Product $producto;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create(['role' => 'admin_despensa']);
        $this->empleado      = User::factory()->create(['role' => 'empleado']);
        $this->proveedor     = Proveedor::create(['razon_social' => 'Mayorista SA']);

        $this->producto = Product::create([
            'nombre'        => 'Yerba 1kg',
            'codigo_barra'  => '7790000000099',
            'stock_actual'  => 20,
            'stock_minimo'  => 5,
            'precio_compra' => 1000,
            'precio_venta'  => 1500,
            'categoria_id'  => Category::create(['nombre' => 'Almacén'])->id,
            'marca_id'      => Marca::create(['nombre' => 'Genérica'])->id,
        ]);
    }

    private function crearCompra(float $total, string $comprobante): Compra
    {
        $compra = Compra::create([
            'user_id'            => $this->adminDespensa->id,
            'proveedor_id'       => $this->proveedor->id,
            'numero_comprobante' => $comprobante,
            'total'              => $total,
            'tipo_pago'          => 'CONTADO',
            'pendiente_pago'     => false,
            'estado'             => 'RECIBIDA',
        ]);

        DetalleCompra::create([
            'compra_id'         => $compra->id,
            'product_id'        => $this->producto->id,
            'cantidad'          => 1,
            'costo_adquisicion' => $total,
            'subtotal'          => $total,
        ]);

        return $compra;
    }

    private function crearVenta(float $total): Venta
    {
        $venta = Venta::create([
            'user_id'    => $this->empleado->id,
            'total'      => $total,
            'tipo_venta' => 'CONTADO',
            'medio_pago' => 'EFECTIVO',
            'estado'     => 'COMPLETADA',
        ]);

        DetalleVenta::create([
            'venta_id'        => $venta->id,
            'product_id'      => $this->producto->id,
            'cantidad'        => 1,
            'precio_unitario' => $total,
            'subtotal'        => $total,
        ]);

        return $venta;
    }

    // ---------------------------------------------------------------
    // Compras
    // ---------------------------------------------------------------

    public function test_historial_de_compras_paginado_del_mas_reciente(): void
    {
        $primera = $this->crearCompra(1000, 'A-0001');
        $segunda = $this->crearCompra(2000, 'A-0002');
        $this->crearCompra(3000, 'A-0003');

        Sanctum::actingAs($this->adminDespensa);

        $this->getJson('/api/compras?per_page=2')
            ->assertOk()
            ->assertJsonCount(2, 'compras.data')
            ->assertJsonPath('compras.meta.total', 3)
            ->assertJsonPath('compras.meta.last_page', 2)
            ->assertJsonPath('compras.data.1.id', $segunda->id);

        $this->getJson('/api/compras?per_page=2&page=2')
            ->assertOk()
            ->assertJsonCount(1, 'compras.data')
            ->assertJsonPath('compras.data.0.id', $primera->id);
    }

    public function test_detalle_de_compra_y_404(): void
    {
        $compra = $this->crearCompra(1500, 'B-0001');

        Sanctum::actingAs($this->adminDespensa);

        $this->getJson("/api/compras/{$compra->id}")
            ->assertOk()
            ->assertJsonPath('compra.id', $compra->id)
            ->assertJsonPath('compra.numero_comprobante', 'B-0001')
            ->assertJsonPath('compra.proveedor_id', $this->proveedor->id);

        $this->getJson('/api/compras/999999')->assertNotFound();
    }

    public function test_empleado_no_ve_compras(): void
    {
        $compra = $this->crearCompra(1000, 'C-0001');

        Sanctum::actingAs($this->empleado);

        $this->getJson('/api/compras')->assertForbidden();
        $this->getJson("/api/compras/{$compra->id}")->assertForbidden();
    }

    // ---------------------------------------------------------------
    // Ventas
    // ---------------------------------------------------------------

    public function test_listado_de_ventas_del_mas_reciente(): void
    {
        $vieja = $this->crearVenta(500);
        $nueva = $this->crearVenta(900);

        Sanctum::actingAs($this->empleado);

        $this->getJson('/api/ventas')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.id', $nueva->id)
            ->assertJsonPath('data.1.id', $vieja->id);
    }

    public function test_detalle_de_venta_incluye_items_y_404(): void
    {
        $venta = $this->crearVenta(1500);

        Sanctum::actingAs($this->adminDespensa);

        $this->getJson("/api/ventas/{$venta->id}")
            ->assertOk()
            ->assertJsonPath('data.id', $venta->id)
            ->assertJsonPath('data.total', 1500)
            ->assertJsonPath('data.user.id', $this->empleado->id);

        $this->getJson('/api/ventas/999999')->assertNotFound();
    }

    public function test_admin_sistema_no_ve_ventas(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));

        $this->getJson('/api/ventas')->assertForbidden();
    }
}

