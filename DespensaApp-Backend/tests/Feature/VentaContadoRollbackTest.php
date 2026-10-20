<?php

namespace Tests\Feature;

use App\Models\AlertaStock;
use App\Models\Caja;
use App\Models\Category;
use App\Models\Marca;
use App\Models\MovimientoCaja;
use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Rollback real ante errores inesperados (500) en CU07.
 *
 * A diferencia de mockear VentaService::prepararItems (que falla ANTES de
 * escribir algo), acá se fuerza la excepción con eventos de Eloquent en
 * pasos que ocurren DESPUÉS de haber persistido la cabecera, los detalles
 * y/o descontado el stock. Así se prueba que DB::transaction deshace todo.
 *
 * No depende de nombres de métodos internos del servicio.
 */
class VentaContadoRollbackTest extends TestCase
{
    use RefreshDatabase;

    private const ENDPOINT = '/api/ventas/contado';
    private const MENSAJE_500 = 'Ocurrió un error interno al registrar la venta.';

    private User $empleado;
    private Product $productoA;       // stock 25, mínimo 5
    private Product $productoLimite;  // stock 6,  mínimo 5

    protected function setUp(): void
    {
        parent::setUp();

        $this->empleado = User::factory()->create(['role' => 'empleado']);
        Sanctum::actingAs($this->empleado);

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

        $this->productoLimite = Product::create([
            'nombre'        => 'Aceite de Girasol 900ml',
            'codigo_barra'  => '7790003334445',
            'stock_actual'  => 6,
            'stock_minimo'  => 5,
            'precio_compra' => 1200.00,
            'precio_venta'  => 1800.00,
            'categoria_id'  => $categoria->id,
            'marca_id'      => $marca->id,
        ]);

        Caja::create([
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => 10000.00,
            'fecha_apertura'      => now(),
            'estado'              => 'ABIERTA',
        ]);
    }

    /**
     * Verifica que no quedó NADA persistido de la venta fallida.
     */
    private function assertNadaPersistido(int $stockA = 25, int $stockLimite = 6): void
    {
        $this->assertDatabaseCount('ventas', 0);
        $this->assertDatabaseCount('detalles_venta', 0);
        $this->assertDatabaseCount('movimientos_caja', 0);
        $this->assertDatabaseCount('alertas_stock', 0);

        $this->assertEquals($stockA, $this->productoA->fresh()->stock_actual);
        $this->assertEquals($stockLimite, $this->productoLimite->fresh()->stock_actual);
    }

    public function test_falla_al_registrar_movimiento_de_caja_hace_rollback_de_venta_detalle_y_stock(): void
    {
        // El MovimientoCaja se crea al final del flujo (solo en EFECTIVO):
        // venta, detalles y descuento de stock ya ocurrieron cuando explota.
        MovimientoCaja::creating(function () {
            throw new \RuntimeException('Fallo simulado al registrar el movimiento de caja');
        });

        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 2],
            ],
        ]);

        $response->assertStatus(500)
            ->assertJsonPath('message', self::MENSAJE_500);

        $this->assertNadaPersistido();
    }

    public function test_falla_al_generar_alerta_de_stock_hace_rollback_del_descuento_y_de_todo_lo_anterior(): void
    {
        // Vender 1 de 6 deja stock 5 (<= mínimo) y dispara la creación de la alerta.
        // Si la alerta falla, el stock descontado del producto debe volver a 6.
        AlertaStock::creating(function () {
            throw new \RuntimeException('Fallo simulado al crear la alerta de stock');
        });

        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                ['producto_id' => $this->productoA->id,      'cantidad' => 2],
                ['producto_id' => $this->productoLimite->id, 'cantidad' => 1],
            ],
        ]);

        $response->assertStatus(500)
            ->assertJsonPath('message', self::MENSAJE_500);

        // Ni el producto que causó la alerta ni el primero quedan modificados.
        $this->assertNadaPersistido();
    }

    public function test_falla_inesperada_con_medio_digital_tambien_hace_rollback(): void
    {
        // En TRANSFERENCIA no hay MovimientoCaja, así que forzamos el fallo
        // en la alerta para que ocurra igualmente tras escribir venta y stock.
        AlertaStock::creating(function () {
            throw new \RuntimeException('Fallo simulado al crear la alerta de stock');
        });

        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'TRANSFERENCIA',
            'items'      => [
                ['producto_id' => $this->productoLimite->id, 'cantidad' => 1],
            ],
        ]);

        $response->assertStatus(500)
            ->assertJsonPath('message', self::MENSAJE_500);

        $this->assertNadaPersistido();
    }

    public function test_el_500_no_expone_el_detalle_de_la_excepcion_al_cliente(): void
    {
        MovimientoCaja::creating(function () {
            throw new \RuntimeException('SQLSTATE[HY000]: detalle interno sensible');
        });

        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                ['producto_id' => $this->productoA->id, 'cantidad' => 1],
            ],
        ]);

        $response->assertStatus(500);

        $this->assertStringNotContainsString('SQLSTATE', $response->getContent());
        $this->assertStringNotContainsString('detalle interno sensible', $response->getContent());
    }

    // Opcional: si tu controlador registra el error con Log::error(...), podés
    // verificarlo agregando en cualquiera de los tests anteriores, antes del POST:
    //
    //     Log::spy();
    //     ...
    //     Log::shouldHaveReceived('error')->once();
}