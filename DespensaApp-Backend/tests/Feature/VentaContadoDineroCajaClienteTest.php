<?php
 
namespace Tests\Feature;
 
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
 

class VentaContadoDineroCajaClienteTest extends TestCase
{
   use RefreshDatabase;
 
    private const ENDPOINT = '/api/ventas/contado';
 
    private User $empleado;
    private Category $categoria;
    private Marca $marca;
 
    protected function setUp(): void
    {
        parent::setUp();
 
        $this->empleado  = User::factory()->create(['role' => 'empleado']);
        Sanctum::actingAs($this->empleado);
 
        $this->categoria = Category::create(['nombre' => 'Almacén']);
        $this->marca     = Marca::create(['nombre' => 'Marca Líder']);
    }
 
    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------
 
    private function crearProducto(string $nombre, string $codigo, float $precioVenta, int $stock = 50): Product
    {
        return Product::create([
            'nombre'        => $nombre,
            'codigo_barra'  => $codigo,
            'stock_actual'  => $stock,
            'stock_minimo'  => 5,
            'precio_compra' => 1.00,
            'precio_venta'  => $precioVenta,
            'categoria_id'  => $this->categoria->id,
            'marca_id'      => $this->marca->id,
        ]);
    }
 
    private function crearCaja(string $estado, float $saldoInicial = 10000.00): Caja
    {
        return Caja::create([
            'usuario_apertura_id' => $this->empleado->id,
            'saldo_inicial'       => $saldoInicial,
            'fecha_apertura'      => now(),
            'estado'              => $estado,
        ]);
    }
 
    /** Formatea cualquier valor numérico a string con 2 decimales exactos. */
    private function dos(mixed $valor): string
    {
        return number_format((float) $valor, 2, '.', '');
    }
 
    // ------------------------------------------------------------------
    // B. Dinero, centavos y precisión decimal
    // ------------------------------------------------------------------
 
    public function test_calcula_con_centavos_sin_errores_de_punto_flotante(): void
    {
        $caja = $this->crearCaja('ABIERTA');
 
        // Precios elegidos porque rompen con floats:
        //   0.10 * 3  = 0.30000000000000004
        //   1.10 * 3  = 3.3000000000000003
        $diez   = $this->crearProducto('Caramelo',  '7790000000001', 0.10);
        $uno10  = $this->crearProducto('Chicle',    '7790000000002', 1.10);
        $chaca  = $this->crearProducto('Galletita', '7790000000003', 850.33);
 
        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'EFECTIVO',
            'items'      => [
                ['producto_id' => $diez->id,  'cantidad' => 3], // 0.30
                ['producto_id' => $uno10->id, 'cantidad' => 3], // 3.30
                ['producto_id' => $chaca->id, 'cantidad' => 3], // 2550.99
            ],
        ]);
 
        $response->assertStatus(201);
 
        // Total esperado: 0.30 + 3.30 + 2550.99 = 2554.59
        $this->assertSame('2554.59', $this->dos($response->json('venta.total')));
 
        $venta = Venta::firstOrFail();
        $this->assertSame('2554.59', $this->dos($venta->total));
 
        // Subtotales por línea al centavo.
        $this->assertDatabaseHas('detalles_venta', ['product_id' => $diez->id,  'subtotal' => 0.30]);
        $this->assertDatabaseHas('detalles_venta', ['product_id' => $uno10->id, 'subtotal' => 3.30]);
        $this->assertDatabaseHas('detalles_venta', ['product_id' => $chaca->id, 'subtotal' => 2550.99]);
 
        // El total de la cabecera coincide con la suma de los subtotales persistidos.
        $sumaSubtotales = \DB::table('detalles_venta')->where('venta_id', $venta->id)->sum('subtotal');
        $this->assertSame($this->dos($venta->total), $this->dos($sumaSubtotales));
 
        // El movimiento de caja coincide al centavo con el total de la venta.
        $movimiento = MovimientoCaja::where('caja_id', $caja->id)->firstOrFail();
        $this->assertSame('2554.59', $this->dos($movimiento->monto));
    }
 
    public function test_ignora_subtotal_y_precio_unitario_maliciosos_del_cliente(): void
    {
        $this->crearCaja('ABIERTA');
        $producto = $this->crearProducto('Fideos', '7790000000004', 850.33);
 
        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'EFECTIVO',
            'subtotal'   => 1.00,
            'total'      => 0.01,
            'items'      => [[
                'producto_id'     => $producto->id,
                'cantidad'        => 3,
                'precio_unitario' => 0.01,
                'subtotal'        => 1.00,
            ]],
        ]);
 
        $response->assertStatus(201);
 
        $this->assertSame('2550.99', $this->dos($response->json('venta.total')));
        $this->assertDatabaseHas('detalles_venta', [
            'product_id'      => $producto->id,
            'precio_unitario' => 850.33,
            'subtotal'        => 2550.99,
        ]);
    }
 
    // ------------------------------------------------------------------
    // C. Caja
    // ------------------------------------------------------------------
 
    public function test_caja_existente_pero_cerrada_bloquea_la_venta(): void
    {
        $this->crearCaja('CERRADA');
        $producto = $this->crearProducto('Fideos', '7790000000005', 850.00, 25);
 
        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'EFECTIVO',
            'items'      => [['producto_id' => $producto->id, 'cantidad' => 1]],
        ]);
 
        $response->assertStatus(422)
            ->assertJsonFragment([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ]);
 
        $this->assertEquals(25, $producto->fresh()->stock_actual);
        $this->assertDatabaseCount('ventas', 0);
        $this->assertDatabaseCount('movimientos_caja', 0);
    }
 
    public function test_con_varias_cajas_historicas_vincula_el_movimiento_a_la_unica_abierta(): void
    {
        // Abierta en el medio: ni la primera ni la última por id,
        // para detectar un first()/latest() sin filtrar por estado.
        $this->crearCaja('CERRADA');
        $this->crearCaja('CERRADA');
        $this->crearCaja('CERRADA');
        $abierta = $this->crearCaja('ABIERTA');
        $this->crearCaja('CERRADA');
        $this->crearCaja('CERRADA');
 
        $producto = $this->crearProducto('Fideos', '7790000000006', 850.00);
 
        $response = $this->postJson(self::ENDPOINT, [
            'medio_pago' => 'EFECTIVO',
            'items'      => [['producto_id' => $producto->id, 'cantidad' => 2]],
        ]);
 
        $response->assertStatus(201);
 
        $this->assertDatabaseCount('movimientos_caja', 1);
        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id' => $abierta->id,
            'tipo'    => 'INGRESO_VENTA',
            'monto'   => 1700.00,
        ]);
 
        // Ninguna caja cerrada recibió movimientos.
        $this->assertSame(
            0,
            MovimientoCaja::where('caja_id', '!=', $abierta->id)->count()
        );
    }
 
    // ------------------------------------------------------------------
    // D. Clientes
    // ------------------------------------------------------------------
 
    public function test_cliente_con_deuda_previa_mantiene_su_saldo_tras_una_venta_de_contado(): void
    {
        $caja = $this->crearCaja('ABIERTA');
 
        $cliente = Cliente::create([
            'nombre'                 => 'Juan',
            'apellido'               => 'Perez',
            'telefono'               => '1122334455',
            'direccion'              => 'Av. Siempre Viva 742',
            'saldo_cuenta_corriente' => 5000.00,
        ]);
 
        $producto = $this->crearProducto('Producto 1500', '7790000000007', 1500.00);
 
        $response = $this->postJson(self::ENDPOINT, [
            'cliente_id' => $cliente->id,
            'medio_pago' => 'EFECTIVO',
            'items'      => [['producto_id' => $producto->id, 'cantidad' => 1]],
        ]);
 
        $response->assertStatus(201)
            ->assertJsonPath('venta.cliente_id', $cliente->id);
 
        // La deuda no se suma, no se descuenta y no se reinicia.
        $this->assertSame('5000.00', $this->dos($cliente->fresh()->saldo_cuenta_corriente));
        $this->assertSame(0, MovimientoCuentaCorrienteCliente::count());
 
        // La venta sí impacta en la caja por el monto de contado.
        $this->assertDatabaseHas('movimientos_caja', [
            'caja_id' => $caja->id,
            'tipo'    => 'INGRESO_VENTA',
            'monto'   => 1500.00,
        ]);
    }
}
