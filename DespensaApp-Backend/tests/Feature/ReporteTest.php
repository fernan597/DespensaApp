<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Marca;
use App\Models\DetalleVenta;
use App\Models\Product;
use App\Models\User;
use App\Models\Venta;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReporteTest extends TestCase
{
    use RefreshDatabase;

    private User $adminDespensa;
    private Category $categoria;
    private Marca $marca;
    private Product $prodYerba;
    private Product $prodLeche;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminDespensa = User::factory()->create([
            'role' => 'admin_despensa',
        ]);

        Sanctum::actingAs($this->adminDespensa);

        $this->categoria = Category::create([
            'nombre' => 'Almacén',
        ]);

        $this->marca = Marca::create([
            'nombre' => 'Genérica',
        ]);

        $this->prodYerba = Product::create([
            'nombre'        => 'Yerba Mate 1kg',
            'codigo_barra'  => '7790001000011',
            'stock_actual'  => 50,
            'stock_minimo'  => 10,
            'precio_compra' => 2000.00,
            'precio_venta'  => 3000.00,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ]);

        $this->prodLeche = Product::create([
            'nombre'        => 'Leche Entera 1L',
            'codigo_barra'  => '7790001000028',
            'stock_actual'  => 40,
            'stock_minimo'  => 10,
            'precio_compra' => 1000.00,
            'precio_venta'  => 1500.00,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ]);
    }

    public function test_obtener_reporte_de_ventas_filtrado_por_rango_de_fechas(): void
    {
        $fechaDentro1 = Carbon::parse('2026-11-02 10:30:00');
        $fechaDentro2 = Carbon::parse('2026-11-04 16:15:00');
        $fechaFuera   = Carbon::parse('2026-10-15 12:00:00');

        // Venta 1 dentro del rango (Efectivo)
        $v1 = new Venta([
            'user_id'    => $this->adminDespensa->id,
            'total'      => 6000.00,
            'tipo_venta' => 'CONTADO',
            'medio_pago' => 'EFECTIVO',
            'estado'     => 'COMPLETADA',
        ]);
        $v1->created_at = $fechaDentro1;
        $v1->updated_at = $fechaDentro1;
        $v1->save();

        // Venta 2 dentro del rango (Cuenta Corriente)
        $v2 = new Venta([
            'user_id'    => $this->adminDespensa->id,
            'total'      => 4500.00,
            'tipo_venta' => 'CUENTA_CORRIENTE',
            'medio_pago' => 'CREDITO',
            'estado'     => 'COMPLETADA',
        ]);
        $v2->created_at = $fechaDentro2;
        $v2->updated_at = $fechaDentro2;
        $v2->save();

        // Venta 3 fuera del rango
        $v3 = new Venta([
            'user_id'    => $this->adminDespensa->id,
            'total'      => 9000.00,
            'tipo_venta' => 'CONTADO',
            'medio_pago' => 'EFECTIVO',
            'estado'     => 'COMPLETADA',
        ]);
        $v3->created_at = $fechaFuera;
        $v3->updated_at = $fechaFuera;
        $v3->save();

        $response = $this->getJson('/api/reportes/ventas?fecha_desde=2026-11-01&fecha_hasta=2026-11-05');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.resumen.total_facturado', 10500)
            ->assertJsonPath('data.resumen.cantidad_ventas', 2)
            ->assertJsonPath('data.resumen.total_contado', 6000)
            ->assertJsonPath('data.resumen.total_credito', 4500)
            ->assertJsonCount(5, 'data.serie_diaria');
    }

    public function test_obtener_ranking_productos_mas_vendidos(): void
    {
        $fecha = Carbon::parse('2026-11-03 11:00:00');

        $venta = new Venta([
            'user_id'    => $this->adminDespensa->id,
            'total'      => 10500.00,
            'tipo_venta' => 'CONTADO',
            'medio_pago' => 'EFECTIVO',
            'estado'     => 'COMPLETADA',
        ]);
        $venta->created_at = $fecha;
        $venta->updated_at = $fecha;
        $venta->save();

        // 5 unidades de Leche ($7500) y 1 unidad de Yerba ($3000)
        DetalleVenta::create([
            'venta_id'        => $venta->id,
            'product_id'      => $this->prodLeche->id,
            'cantidad'        => 5,
            'precio_unitario' => 1500.00,
            'subtotal'        => 7500.00,
        ]);

        DetalleVenta::create([
            'venta_id'        => $venta->id,
            'product_id'      => $this->prodYerba->id,
            'cantidad'        => 1,
            'precio_unitario' => 3000.00,
            'subtotal'        => 3000.00,
        ]);

        $response = $this->getJson('/api/reportes/mas-vendidos?fecha_desde=2026-11-01&fecha_hasta=2026-11-05');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.resumen.total_unidades_top', 6)
            ->assertJsonPath('data.resumen.total_recaudado_top', 10500)
            ->assertJsonCount(2, 'data.productos')
            ->assertJsonPath('data.productos.0.producto_id', $this->prodLeche->id)
            ->assertJsonPath('data.productos.0.cantidad_vendida', 5)
            ->assertJsonPath('data.productos.1.producto_id', $this->prodYerba->id)
            ->assertJsonPath('data.productos.1.cantidad_vendida', 1);
    }

    public function test_rechaza_rango_de_fechas_invalido(): void
    {
        $response = $this->getJson('/api/reportes/ventas?fecha_desde=2026-11-10&fecha_hasta=2026-11-01');

        $response->assertStatus(422);
    }
}

