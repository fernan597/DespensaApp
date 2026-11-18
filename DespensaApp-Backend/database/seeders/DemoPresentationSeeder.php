<?php

namespace Database\Seeders;

use App\Enums\AccionAuditoria;
use App\Models\AlertaStock;
use App\Models\Auditoria;
use App\Models\Caja;
use App\Models\Category;
use App\Models\Cliente;
use App\Models\CobroCliente;
use App\Models\Compra;
use App\Models\DetalleCompra;
use App\Models\DetalleVenta;
use App\Models\Marca;
use App\Models\MovimientoCaja;
use App\Models\MovimientoCuentaCorrienteCliente;
use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\PagoProveedor;
use App\Models\Product;
use App\Models\Proveedor;
use App\Models\User;
use App\Models\Venta;
use App\Services\AlertaStockService;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DemoPresentationSeeder extends Seeder
{
    /**
     * Pobla la base de datos con un escenario realista de Despensa Argentina
     * listo para demostración en video.
     */
    public function run(): void
    {
        $driver = DB::getDriverName();

        if ($driver === 'pgsql') {
            DB::statement('TRUNCATE TABLE auditorias, alertas_stock, movimientos_caja, movimientos_cuenta_corriente_clientes, movimientos_cuenta_corriente_proveedores, cobros_clientes, pagos_proveedores, detalles_venta, ventas, detalles_compra, compras, cajas, products, proveedores, clientes, categories, marcas RESTART IDENTITY CASCADE;');
        } else {
            Schema::disableForeignKeyConstraints();
            DB::table('auditorias')->truncate();
            DB::table('alertas_stock')->truncate();
            DB::table('movimientos_caja')->truncate();
            DB::table('movimientos_cuenta_corriente_clientes')->truncate();
            DB::table('movimientos_cuenta_corriente_proveedores')->truncate();
            DB::table('cobros_clientes')->truncate();
            DB::table('pagos_proveedores')->truncate();
            DB::table('detalles_venta')->truncate();
            DB::table('ventas')->truncate();
            DB::table('detalles_compra')->truncate();
            DB::table('compras')->truncate();
            DB::table('cajas')->truncate();
            DB::table('products')->truncate();
            DB::table('proveedores')->truncate();
            DB::table('clientes')->truncate();
            DB::table('categories')->truncate();
            DB::table('marcas')->truncate();
            Schema::enableForeignKeyConstraints();
        }

        $ahora = Carbon::now();

        // =====================================================================
        // 1. USUARIOS (3 ROLES DEL SISTEMA)
        // =====================================================================
        $adminEmail       = env('ADMIN_EMAIL') ?: 'admin@despensa.com';
        $adminPassword    = env('ADMIN_PASSWORD') ?: 'admin1234';
        $despensaEmail    = env('ADMIN_DESPENSA_EMAIL') ?: 'despensa@gmail.com';
        $despensaPassword = env('ADMIN_DESPENSA_PASSWORD') ?: 'despensa1234';

        $userAdmin = User::updateOrCreate(
            ['email' => $adminEmail],
            [
                'name'     => 'Administrador de Sistema',
                'password' => Hash::make($adminPassword),
                'role'     => 'admin',
            ]
        );

        $userDespensa = User::updateOrCreate(
            ['email' => $despensaEmail],
            [
                'name'     => 'Fernando (Admin Despensa)',
                'password' => Hash::make($despensaPassword),
                'role'     => 'admin_despensa',
            ]
        );

        $userEmpleado = User::updateOrCreate(
            ['email' => 'cajero@despensa.com'],
            [
                'name'     => 'Martín López (Cajero T. Mañana)',
                'password' => Hash::make('cajero1234'),
                'role'     => 'empleado',
            ]
        );

        $userEmpleadoTarde = User::updateOrCreate(
            ['email' => 'cajero.tarde@despensa.com'],
            [
                'name'     => 'Valentina Sosa (Cajera T. Tarde)',
                'password' => Hash::make('cajero1234'),
                'role'     => 'empleado',
            ]
        );

        // =====================================================================
        // 2. CATEGORÍAS REALES
        // =====================================================================
        $categoriasNombres = [
            'Lácteos',
            'Almacén',
            'Bebidas',
            'Yerbas e Infusiones',
            'Galletitas y Panificados',
            'Fiambres y Quesos',
            'Conservas y Enlatados',
            'Limpieza e Higiene',
        ];

        $categorias = [];
        foreach ($categoriasNombres as $nombre) {
            $categorias[$nombre] = Category::create(['nombre' => $nombre]);
        }

        // =====================================================================
        // 3. MARCAS REALES
        // =====================================================================
        $marcasNombres = [
            'La Serenísima',
            'Ilolay',
            'Matarazzo',
            'Gallo',
            'Natura',
            'Ledesma',
            'Pureza',
            'Playadito',
            'Taragüi',
            'Coca-Cola',
            'Quilmes',
            'Villavicencio',
            'Bagley',
            'Arcor',
            'La Campagnola',
            'Paladini',
            'Ala',
            'Magistral',
        ];

        $marcas = [];
        foreach ($marcasNombres as $nombre) {
            $marcas[$nombre] = Marca::create(['nombre' => $nombre]);
        }

        // =====================================================================
        // 4. CATÁLOGO DE 22 PRODUCTOS REALES DE DESPENSA ARGENTINA
        // =====================================================================
        $catalogoProductos = [
            // --- 2 Productos AGOTADOS (Stock = 0) para lucir las Alertas en el Dashboard ---
            [
                'key'           => 'leche_serenisima',
                'nombre'        => 'Leche Entera La Serenísima Larga Vida 1L',
                'codigo_barra'  => '7790742100105',
                'stock_actual'  => 0,
                'stock_minimo'  => 15,
                'precio_compra' => 1150.00,
                'precio_venta'  => 1550.00,
                'categoria'     => 'Lácteos',
                'marca'         => 'La Serenísima',
            ],
            [
                'key'           => 'aceite_natura',
                'nombre'        => 'Aceite de Girasol Natura 1.5L',
                'codigo_barra'  => '7790272001019',
                'stock_actual'  => 0,
                'stock_minimo'  => 10,
                'precio_compra' => 2350.00,
                'precio_venta'  => 3150.00,
                'categoria'     => 'Almacén',
                'marca'         => 'Natura',
            ],

            // --- 3 Productos en ALERTA DE STOCK BAJO (Stock <= Mínimo) ---
            [
                'key'           => 'yerba_playadito',
                'nombre'        => 'Yerba Mate Playadito Suave 1Kg',
                'codigo_barra'  => '7793704000016',
                'stock_actual'  => 3,
                'stock_minimo'  => 12,
                'precio_compra' => 3100.00,
                'precio_venta'  => 4200.00,
                'categoria'     => 'Yerbas e Infusiones',
                'marca'         => 'Playadito',
            ],
            [
                'key'           => 'coca_cola_225',
                'nombre'        => 'Coca-Cola Sabor Original 2.25L',
                'codigo_barra'  => '7790895000997',
                'stock_actual'  => 4,
                'stock_minimo'  => 15,
                'precio_compra' => 2400.00,
                'precio_venta'  => 3300.00,
                'categoria'     => 'Bebidas',
                'marca'         => 'Coca-Cola',
            ],
            [
                'key'           => 'azucar_ledesma',
                'nombre'        => 'Azúcar Clásica Ledesma 1Kg',
                'codigo_barra'  => '7792180000019',
                'stock_actual'  => 5,
                'stock_minimo'  => 15,
                'precio_compra' => 950.00,
                'precio_venta'  => 1350.00,
                'categoria'     => 'Almacén',
                'marca'         => 'Ledesma',
            ],

            // --- 17 Productos con STOCK NORMAL ---
            [
                'key'           => 'fideos_matarazzo',
                'nombre'        => 'Fideos Tallarín Matarazzo 500g',
                'codigo_barra'  => '7790070411017',
                'stock_actual'  => 42,
                'stock_minimo'  => 12,
                'precio_compra' => 980.00,
                'precio_venta'  => 1400.00,
                'categoria'     => 'Almacén',
                'marca'         => 'Matarazzo',
            ],
            [
                'key'           => 'arroz_gallo',
                'nombre'        => 'Arroz Gallo Oro Parboil 1Kg',
                'codigo_barra'  => '7790070318521',
                'stock_actual'  => 30,
                'stock_minimo'  => 10,
                'precio_compra' => 1650.00,
                'precio_venta'  => 2300.00,
                'categoria'     => 'Almacén',
                'marca'         => 'Gallo',
            ],
            [
                'key'           => 'harina_pureza',
                'nombre'        => 'Harina de Trigo Pureza Ultra Refinada 0000 1Kg',
                'codigo_barra'  => '7792180100252',
                'stock_actual'  => 28,
                'stock_minimo'  => 10,
                'precio_compra' => 820.00,
                'precio_venta'  => 1180.00,
                'categoria'     => 'Almacén',
                'marca'         => 'Pureza',
            ],
            [
                'key'           => 'pure_tomate_arcor',
                'nombre'        => 'Puré de Tomate Arcor Brick 520g',
                'codigo_barra'  => '7790580145101',
                'stock_actual'  => 36,
                'stock_minimo'  => 12,
                'precio_compra' => 750.00,
                'precio_venta'  => 1100.00,
                'categoria'     => 'Conservas y Enlatados',
                'marca'         => 'Arcor',
            ],
            [
                'key'           => 'atun_campagnola',
                'nombre'        => 'Atún al Natural La Campagnola 170g',
                'codigo_barra'  => '7790580652005',
                'stock_actual'  => 22,
                'stock_minimo'  => 8,
                'precio_compra' => 1950.00,
                'precio_venta'  => 2750.00,
                'categoria'     => 'Conservas y Enlatados',
                'marca'         => 'La Campagnola',
            ],
            [
                'key'           => 'yerba_taragui',
                'nombre'        => 'Yerba Mate Taragüi Con Palo 1Kg',
                'codigo_barra'  => '7790387010053',
                'stock_actual'  => 24,
                'stock_minimo'  => 10,
                'precio_compra' => 2950.00,
                'precio_venta'  => 4000.00,
                'categoria'     => 'Yerbas e Infusiones',
                'marca'         => 'Taragüi',
            ],
            [
                'key'           => 'chocolinas',
                'nombre'        => 'Galletitas Chocolinas Bagley 170g',
                'codigo_barra'  => '7790040929906',
                'stock_actual'  => 35,
                'stock_minimo'  => 10,
                'precio_compra' => 1100.00,
                'precio_venta'  => 1550.00,
                'categoria'     => 'Galletitas y Panificados',
                'marca'         => 'Bagley',
            ],
            [
                'key'           => 'surtido_bagley',
                'nombre'        => 'Galletitas Surtido Bagley Paquete 390g',
                'codigo_barra'  => '7790040112209',
                'stock_actual'  => 25,
                'stock_minimo'  => 8,
                'precio_compra' => 1850.00,
                'precio_venta'  => 2600.00,
                'categoria'     => 'Galletitas y Panificados',
                'marca'         => 'Bagley',
            ],
            [
                'key'           => 'yogur_serenisima',
                'nombre'        => 'Yogur Bebible Frutilla La Serenísima Sachet 900g',
                'codigo_barra'  => '7790742334104',
                'stock_actual'  => 18,
                'stock_minimo'  => 8,
                'precio_compra' => 1450.00,
                'precio_venta'  => 2050.00,
                'categoria'     => 'Lácteos',
                'marca'         => 'La Serenísima',
            ],
            [
                'key'           => 'manteca_serenisima',
                'nombre'        => 'Manteca Calidad Extra La Serenísima 200g',
                'codigo_barra'  => '7790742140200',
                'stock_actual'  => 16,
                'stock_minimo'  => 6,
                'precio_compra' => 2100.00,
                'precio_venta'  => 2950.00,
                'categoria'     => 'Lácteos',
                'marca'         => 'La Serenísima',
            ],
            [
                'key'           => 'dulce_leche_serenisima',
                'nombre'        => 'Dulce de Leche Colonial La Serenísima 400g',
                'codigo_barra'  => '7790742201505',
                'stock_actual'  => 20,
                'stock_minimo'  => 8,
                'precio_compra' => 1750.00,
                'precio_venta'  => 2450.00,
                'categoria'     => 'Lácteos',
                'marca'         => 'La Serenísima',
            ],
            [
                'key'           => 'queso_cremoso_ilolay',
                'nombre'        => 'Queso Cremoso Ilolay Fraccionado 500g',
                'codigo_barra'  => '7790350001200',
                'stock_actual'  => 14,
                'stock_minimo'  => 5,
                'precio_compra' => 3400.00,
                'precio_venta'  => 4700.00,
                'categoria'     => 'Fiambres y Quesos',
                'marca'         => 'Ilolay',
            ],
            [
                'key'           => 'jamon_cocido_paladini',
                'nombre'        => 'Jamón Cocido Feteado Paladini Bandeja 200g',
                'codigo_barra'  => '7790503001156',
                'stock_actual'  => 15,
                'stock_minimo'  => 6,
                'precio_compra' => 2300.00,
                'precio_venta'  => 3200.00,
                'categoria'     => 'Fiambres y Quesos',
                'marca'         => 'Paladini',
            ],
            [
                'key'           => 'cerveza_quilmes',
                'nombre'        => 'Cerveza Quilmes Clásica Retornable 1L',
                'codigo_barra'  => '7792798000012',
                'stock_actual'  => 36,
                'stock_minimo'  => 12,
                'precio_compra' => 1900.00,
                'precio_venta'  => 2700.00,
                'categoria'     => 'Bebidas',
                'marca'         => 'Quilmes',
            ],
            [
                'key'           => 'agua_villavicencio',
                'nombre'        => 'Agua Mineral Sin Gas Villavicencio 2L',
                'codigo_barra'  => '7790315000248',
                'stock_actual'  => 32,
                'stock_minimo'  => 10,
                'precio_compra' => 1050.00,
                'precio_venta'  => 1500.00,
                'categoria'     => 'Bebidas',
                'marca'         => 'Villavicencio',
            ],
            [
                'key'           => 'jabon_liquido_ala',
                'nombre'        => 'Jabón Líquido Ala Para Diluir Lavado Perfecto 500ml',
                'codigo_barra'  => '7791293041209',
                'stock_actual'  => 14,
                'stock_minimo'  => 5,
                'precio_compra' => 3800.00,
                'precio_venta'  => 5200.00,
                'categoria'     => 'Limpieza e Higiene',
                'marca'         => 'Ala',
            ],
            [
                'key'           => 'detergente_magistral',
                'nombre'        => 'Detergente Concentrado Magistral Limón 500ml',
                'codigo_barra'  => '7794640171109',
                'stock_actual'  => 19,
                'stock_minimo'  => 6,
                'precio_compra' => 2150.00,
                'precio_venta'  => 2990.00,
                'categoria'     => 'Limpieza e Higiene',
                'marca'         => 'Magistral',
            ],
        ];

        $alertaStockService = app(AlertaStockService::class);
        $productos = [];

        foreach ($catalogoProductos as $item) {
            $producto = Product::create([
                'nombre'        => $item['nombre'],
                'codigo_barra'  => $item['codigo_barra'],
                'stock_actual'  => $item['stock_actual'],
                'stock_minimo'  => $item['stock_minimo'],
                'precio_compra' => $item['precio_compra'],
                'precio_venta'  => $item['precio_venta'],
                'categoria_id'  => $categorias[$item['categoria']]->id,
                'marca_id'      => $marcas[$item['marca']]->id,
            ]);

            $alertaStockService->sincronizarProducto($producto);
            $productos[$item['key']] = $producto;
        }

        // =====================================================================
        // 5. PROVEEDORES REALES
        // =====================================================================
        $provMayorista = Proveedor::create([
            'razon_social'   => 'Distribuidora Mayorista El Sol S.R.L.',
            'telefono'       => '351-4891200',
            'direccion'      => 'Av. Circunvalación Sur 4250, Parque Industrial',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        $provLacteos = Proveedor::create([
            'razon_social'   => 'Lácteos y Frescos del Sur S.A.',
            'telefono'       => '351-4228910',
            'direccion'      => 'Ruta Nacional 9 Km 695',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        $provBebidas = Proveedor::create([
            'razon_social'   => 'Embotelladora y Bebidas Cuyo S.A.',
            'telefono'       => '351-5104433',
            'direccion'      => 'Bv. Los Alemanes 3120',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        $provMolinos = Proveedor::create([
            'razon_social'   => 'Molinos y Alimentos Río de la Plata S.A.',
            'telefono'       => '351-4719080',
            'direccion'      => 'Av. Sabattini 2890',
            'saldo_adeudado' => 0.00,
            'activo'         => true,
        ]);

        // =====================================================================
        // 6. CLIENTES REALES
        // =====================================================================
        $cliConsumidorFinal = Cliente::create([
            'nombre'                 => 'Consumidor',
            'apellido'               => 'Final',
            'telefono'               => null,
            'direccion'              => null,
            'saldo_cuenta_corriente' => 0.00,
        ]);

        $cliMaria = Cliente::create([
            'nombre'                 => 'María Elena',
            'apellido'               => 'Gómez',
            'telefono'               => '351-6123456',
            'direccion'              => 'San Martín 452, B° Alberdi',
            'saldo_cuenta_corriente' => 0.00,
        ]);

        $cliCarlos = Cliente::create([
            'nombre'                 => 'Carlos Alberto',
            'apellido'               => 'Rodríguez',
            'telefono'               => '351-5987654',
            'direccion'              => 'Belgrano 815, B° Observatorio',
            'saldo_cuenta_corriente' => 0.00,
        ]);

        $cliLucia = Cliente::create([
            'nombre'                 => 'Lucía',
            'apellido'               => 'Fernández',
            'telefono'               => '351-3445566',
            'direccion'              => 'Caseros 1120, B° Centro',
            'saldo_cuenta_corriente' => 0.00,
        ]);

        $cliJorge = Cliente::create([
            'nombre'                 => 'Jorge Luis',
            'apellido'               => 'Martínez',
            'telefono'               => '351-2778899',
            'direccion'              => 'Av. Colón 1940, Dpto 4B',
            'saldo_cuenta_corriente' => 0.00,
        ]);

        // =====================================================================
        // 7. COMPRAS A PROVEEDORES Y CUENTAS CORRIENTES DE PROVEEDORES
        // =====================================================================
        // Compra 1 (hace 5 días) a Distribuidora Mayorista El Sol en Cuenta Corriente: $115.600
        $fechaCompra1 = $ahora->copy()->subDays(5)->setTime(9, 15);
        $compra1 = Compra::create([
            'user_id'            => $userDespensa->id,
            'proveedor_id'       => $provMayorista->id,
            'numero_comprobante' => 'FC-A-0004-00018420',
            'total'              => 115600.00,
            'tipo_pago'          => 'CUENTA_CORRIENTE',
            'pendiente_pago'     => true,
            'estado'             => 'RECIBIDA',
            'created_at'         => $fechaCompra1,
            'updated_at'         => $fechaCompra1,
        ]);

        DetalleCompra::create([
            'compra_id'         => $compra1->id,
            'product_id'        => $productos['fideos_matarazzo']->id,
            'cantidad'          => 40,
            'costo_adquisicion' => 980.00,
            'subtotal'          => 39200.00,
            'created_at'        => $fechaCompra1,
            'updated_at'        => $fechaCompra1,
        ]);
        DetalleCompra::create([
            'compra_id'         => $compra1->id,
            'product_id'        => $productos['arroz_gallo']->id,
            'cantidad'          => 20,
            'costo_adquisicion' => 1650.00,
            'subtotal'          => 33000.00,
            'created_at'        => $fechaCompra1,
            'updated_at'        => $fechaCompra1,
        ]);
        DetalleCompra::create([
            'compra_id'         => $compra1->id,
            'product_id'        => $productos['yerba_taragui']->id,
            'cantidad'          => 15,
            'costo_adquisicion' => 2893.33,
            'subtotal'          => 43400.00,
            'created_at'        => $fechaCompra1,
            'updated_at'        => $fechaCompra1,
        ]);

        MovimientoCuentaCorrienteProveedor::create([
            'proveedor_id'    => $provMayorista->id,
            'monto'           => 115600.00,
            'tipo_movimiento' => 'DEBITO',
            'compra_id'       => $compra1->id,
            'created_at'      => $fechaCompra1,
            'updated_at'      => $fechaCompra1,
        ]);

        // Pago parcial a Distribuidora Mayorista El Sol (hace 3 días): $50.000 -> Queda debiendo $65.600
        $fechaPagoProv1 = $ahora->copy()->subDays(3)->setTime(12, 30);
        $pagoProv1 = PagoProveedor::create([
            'proveedor_id' => $provMayorista->id,
            'user_id'      => $userDespensa->id,
            'monto'        => 50000.00,
            'medio_pago'   => 'TRANSFERENCIA',
            'created_at'   => $fechaPagoProv1,
            'updated_at'   => $fechaPagoProv1,
        ]);

        MovimientoCuentaCorrienteProveedor::create([
            'proveedor_id'      => $provMayorista->id,
            'monto'             => 50000.00,
            'tipo_movimiento'   => 'CREDITO',
            'pago_proveedor_id' => $pagoProv1->id,
            'created_at'        => $fechaPagoProv1,
            'updated_at'        => $fechaPagoProv1,
        ]);

        $provMayorista->update(['saldo_adeudado' => 65600.00]);

        // Compra 2 (hace 2 días) a Lácteos y Frescos del Sur S.A. en Cuenta Corriente: $83.200
        $fechaCompra2 = $ahora->copy()->subDays(2)->setTime(10, 0);
        $compra2 = Compra::create([
            'user_id'            => $userDespensa->id,
            'proveedor_id'       => $provLacteos->id,
            'numero_comprobante' => 'FC-A-0002-00095104',
            'total'              => 83200.00,
            'tipo_pago'          => 'CUENTA_CORRIENTE',
            'pendiente_pago'     => true,
            'estado'             => 'RECIBIDA',
            'created_at'         => $fechaCompra2,
            'updated_at'         => $fechaCompra2,
        ]);

        DetalleCompra::create([
            'compra_id'         => $compra2->id,
            'product_id'        => $productos['queso_cremoso_ilolay']->id,
            'cantidad'          => 15,
            'costo_adquisicion' => 3400.00,
            'subtotal'          => 51000.00,
            'created_at'        => $fechaCompra2,
            'updated_at'        => $fechaCompra2,
        ]);
        DetalleCompra::create([
            'compra_id'         => $compra2->id,
            'product_id'        => $productos['jamon_cocido_paladini']->id,
            'cantidad'          => 14,
            'costo_adquisicion' => 2300.00,
            'subtotal'          => 32200.00,
            'created_at'        => $fechaCompra2,
            'updated_at'        => $fechaCompra2,
        ]);

        MovimientoCuentaCorrienteProveedor::create([
            'proveedor_id'    => $provLacteos->id,
            'monto'           => 83200.00,
            'tipo_movimiento' => 'DEBITO',
            'compra_id'       => $compra2->id,
            'created_at'      => $fechaCompra2,
            'updated_at'      => $fechaCompra2,
        ]);

        $provLacteos->update(['saldo_adeudado' => 83200.00]);

        // =====================================================================
        // 8. CAJAS Y VENTAS DE LOS ÚLTIMOS 7 DÍAS (DASHBOARD + POS + CC CLIENTES)
        // =====================================================================
        // Función auxiliar para insertar una venta histórica coherente
        $crearVentaHistorica = function (
            Caja $caja,
            User $vendedor,
            ?Cliente $cliente,
            string $tipoVenta,
            string $medioPago,
            array $lineas,
            Carbon $fecha
        ) {
            $total = 0.0;
            foreach ($lineas as $linea) {
                /** @var Product $prod */
                $prod = $linea['producto'];
                $cant = $linea['cantidad'];
                $total += round(((float) $prod->precio_venta) * $cant, 2);
            }
            $total = round($total, 2);

            $venta = Venta::create([
                'user_id'    => $vendedor->id,
                'cliente_id' => $cliente?->id,
                'total'      => $total,
                'tipo_venta' => $tipoVenta,
                'medio_pago' => $medioPago,
                'estado'     => 'COMPLETADA',
                'created_at' => $fecha,
                'updated_at' => $fecha,
            ]);

            foreach ($lineas as $linea) {
                /** @var Product $prod */
                $prod = $linea['producto'];
                $cant = $linea['cantidad'];
                $subtotal = round(((float) $prod->precio_venta) * $cant, 2);

                DetalleVenta::create([
                    'venta_id'        => $venta->id,
                    'product_id'      => $prod->id,
                    'cantidad'        => $cant,
                    'precio_unitario' => $prod->precio_venta,
                    'subtotal'        => $subtotal,
                    'created_at'      => $fecha,
                    'updated_at'      => $fecha,
                ]);
            }

            if ($tipoVenta === 'CONTADO' && $medioPago === 'EFECTIVO') {
                MovimientoCaja::create([
                    'caja_id'    => $caja->id,
                    'user_id'    => $vendedor->id,
                    'monto'      => $total,
                    'tipo'       => 'INGRESO_VENTA',
                    'concepto'   => "Venta #{$venta->id}",
                    'venta_id'   => $venta->id,
                    'created_at' => $fecha,
                    'updated_at' => $fecha,
                ]);
            }

            if ($tipoVenta === 'CUENTA_CORRIENTE' && $cliente) {
                MovimientoCuentaCorrienteCliente::create([
                    'cliente_id'      => $cliente->id,
                    'monto'           => $total,
                    'tipo_movimiento' => 'DEBITO',
                    'venta_id'        => $venta->id,
                    'created_at'      => $fecha,
                    'updated_at'      => $fecha,
                ]);
                $cliente->increment('saldo_cuenta_corriente', $total);
            }

            return $venta;
        };

        // Planificación de ventas diarias en los 6 días previos (con cajas cerradas)
        $planDiasPrevios = [
            6 => [
                ['hora' => 9,  'tipo' => 'CONTADO', 'medio' => 'EFECTIVO',      'cli' => null,      'items' => [['leche_serenisima', 3], ['chocolinas', 2], ['azucar_ledesma', 1]]],
                ['hora' => 11, 'tipo' => 'CONTADO', 'medio' => 'TRANSFERENCIA', 'cli' => null,      'items' => [['yerba_playadito', 2], ['surtido_bagley', 1]]],
                ['hora' => 18, 'tipo' => 'CONTADO', 'medio' => 'EFECTIVO',      'cli' => null,      'items' => [['coca_cola_225', 2], ['queso_cremoso_ilolay', 1], ['jamon_cocido_paladini', 1]]],
            ],
            5 => [
                ['hora' => 10, 'tipo' => 'CONTADO',          'medio' => 'EFECTIVO', 'cli' => null,     'items' => [['fideos_matarazzo', 3], ['pure_tomate_arcor', 3], ['aceite_natura', 1]]],
                ['hora' => 13, 'tipo' => 'CUENTA_CORRIENTE', 'medio' => 'CREDITO',  'cli' => $cliMaria,'items' => [['yerba_playadito', 1], ['leche_serenisima', 4], ['dulce_leche_serenisima', 1], ['manteca_serenisima', 1]]],
                ['hora' => 19, 'tipo' => 'CONTADO',          'medio' => 'DEBITO',   'cli' => null,     'items' => [['cerveza_quilmes', 4], ['surtido_bagley', 2]]],
            ],
            4 => [
                ['hora' => 9,  'tipo' => 'CONTADO',          'medio' => 'EFECTIVO',      'cli' => null,      'items' => [['arroz_gallo', 2], ['atun_campagnola', 2], ['agua_villavicencio', 2]]],
                ['hora' => 12, 'tipo' => 'CUENTA_CORRIENTE', 'medio' => 'CREDITO',       'cli' => $cliCarlos,'items' => [['coca_cola_225', 3], ['queso_cremoso_ilolay', 1], ['jamon_cocido_paladini', 2]]],
                ['hora' => 17, 'tipo' => 'CONTADO',          'medio' => 'TRANSFERENCIA', 'cli' => null,      'items' => [['jabon_liquido_ala', 1], ['detergente_magistral', 2]]],
                ['hora' => 20, 'tipo' => 'CONTADO',          'medio' => 'EFECTIVO',      'cli' => null,      'items' => [['coca_cola_225', 2], ['cerveza_quilmes', 3]]],
            ],
            3 => [
                ['hora' => 10, 'tipo' => 'CONTADO',          'medio' => 'EFECTIVO', 'cli' => null,     'items' => [['leche_serenisima', 4], ['yogur_serenisima', 2], ['harina_pureza', 2]]],
                ['hora' => 14, 'tipo' => 'CUENTA_CORRIENTE', 'medio' => 'CREDITO',  'cli' => $cliLucia,'items' => [['yerba_taragui', 1], ['azucar_ledesma', 2], ['chocolinas', 2]]],
                ['hora' => 19, 'tipo' => 'CONTADO',          'medio' => 'EFECTIVO', 'cli' => null,     'items' => [['fideos_matarazzo', 4], ['pure_tomate_arcor', 4], ['queso_cremoso_ilolay', 1]]],
            ],
            2 => [
                ['hora' => 9,  'tipo' => 'CONTADO',          'medio' => 'EFECTIVO',      'cli' => null,     'items' => [['yerba_playadito', 2], ['leche_serenisima', 3], ['dulce_leche_serenisima', 2]]],
                ['hora' => 12, 'tipo' => 'CUENTA_CORRIENTE', 'medio' => 'CREDITO',       'cli' => $cliJorge,'items' => [['aceite_natura', 2], ['arroz_gallo', 2], ['atun_campagnola', 2]]],
                ['hora' => 16, 'tipo' => 'CONTADO',          'medio' => 'TRANSFERENCIA', 'cli' => null,     'items' => [['coca_cola_225', 4], ['jamon_cocido_paladini', 2], ['queso_cremoso_ilolay', 1]]],
                ['hora' => 20, 'tipo' => 'CONTADO',          'medio' => 'EFECTIVO',      'cli' => null,     'items' => [['cerveza_quilmes', 6], ['agua_villavicencio', 3]]],
            ],
            1 => [
                ['hora' => 10, 'tipo' => 'CONTADO',          'medio' => 'EFECTIVO',      'cli' => null,     'items' => [['leche_serenisima', 5], ['manteca_serenisima', 2], ['chocolinas', 3]]],
                ['hora' => 13, 'tipo' => 'CUENTA_CORRIENTE', 'medio' => 'CREDITO',       'cli' => $cliMaria,'items' => [['coca_cola_225', 2], ['fideos_matarazzo', 2], ['pure_tomate_arcor', 2], ['queso_cremoso_ilolay', 1]]],
                ['hora' => 18, 'tipo' => 'CONTADO',          'medio' => 'DEBITO',        'cli' => null,     'items' => [['jabon_liquido_ala', 2], ['detergente_magistral', 1], ['yerba_playadito', 1]]],
                ['hora' => 20, 'tipo' => 'CONTADO',          'medio' => 'EFECTIVO',      'cli' => null,     'items' => [['coca_cola_225', 3], ['surtido_bagley', 2]]],
            ],
        ];

        foreach ($planDiasPrevios as $diasAtras => $ventasDelDia) {
            $diaApertura = $ahora->copy()->subDays($diasAtras)->setTime(8, 0);
            $diaCierre   = $ahora->copy()->subDays($diasAtras)->setTime(21, 30);

            $cajaHistorica = Caja::create([
                'usuario_apertura_id' => $userEmpleado->id,
                'usuario_cierre_id'   => $userDespensa->id,
                'saldo_inicial'       => 40000.00,
                'saldo_final'         => 0.00,
                'fecha_apertura'      => $diaApertura,
                'fecha_cierre'        => $diaCierre,
                'estado'              => 'CERRADA',
                'created_at'          => $diaApertura,
                'updated_at'          => $diaCierre,
            ]);

            foreach ($ventasDelDia as $idx => $vData) {
                $fechaVenta = $ahora->copy()->subDays($diasAtras)->setTime($vData['hora'], ($idx * 15) % 60);
                $lineas = array_map(fn ($par) => [
                    'producto' => $productos[$par[0]],
                    'cantidad' => $par[1],
                ], $vData['items']);

                $crearVentaHistorica(
                    $cajaHistorica,
                    $idx % 2 === 0 ? $userEmpleado : $userDespensa,
                    $vData['cli'],
                    $vData['tipo'],
                    $vData['medio'],
                    $lineas,
                    $fechaVenta
                );
            }

            // Si fue hace 3 días, Lucía Fernández abonó el total de su cuenta corriente
            if ($diasAtras === 3) {
                $saldoLucia = (float) $cliLucia->fresh()->saldo_cuenta_corriente;
                $fechaCobroLucia = $ahora->copy()->subDays(3)->setTime(18, 45);
                $cobroLucia = CobroCliente::create([
                    'cliente_id' => $cliLucia->id,
                    'user_id'    => $userEmpleado->id,
                    'monto'      => $saldoLucia,
                    'medio_pago' => 'EFECTIVO',
                    'created_at' => $fechaCobroLucia,
                    'updated_at' => $fechaCobroLucia,
                ]);
                MovimientoCuentaCorrienteCliente::create([
                    'cliente_id'       => $cliLucia->id,
                    'monto'            => $saldoLucia,
                    'tipo_movimiento'  => 'CREDITO',
                    'cobro_cliente_id' => $cobroLucia->id,
                    'created_at'       => $fechaCobroLucia,
                    'updated_at'       => $fechaCobroLucia,
                ]);
                MovimientoCaja::create([
                    'caja_id'          => $cajaHistorica->id,
                    'user_id'          => $userEmpleado->id,
                    'monto'            => $saldoLucia,
                    'tipo'             => 'INGRESO_COBRO_CLIENTE',
                    'concepto'         => "Cobro CC Cliente: {$cliLucia->nombre} {$cliLucia->apellido}",
                    'cobro_cliente_id' => $cobroLucia->id,
                    'created_at'       => $fechaCobroLucia,
                    'updated_at'       => $fechaCobroLucia,
                ]);
                $cliLucia->update(['saldo_cuenta_corriente' => 0.00]);
            }

            // Actualizar saldo final de la caja histórica al saldo esperado
            $cajaHistorica->update([
                'saldo_final' => (float) $cajaHistorica->saldoEsperado(),
            ]);
        }

        // =====================================================================
        // 9. CAJA ABIERTA DE HOY + OPERACIONES DEL TURNO ACTUAL
        // =====================================================================
        $aperturaHoy = $ahora->copy()->subHours(4);
        $cajaHoy = Caja::create([
            'usuario_apertura_id' => $userDespensa->id,
            'usuario_cierre_id'   => null,
            'saldo_inicial'       => 50000.00,
            'saldo_final'         => null,
            'fecha_apertura'      => $aperturaHoy,
            'fecha_cierre'        => null,
            'estado'              => 'ABIERTA',
            'created_at'          => $aperturaHoy,
            'updated_at'          => $aperturaHoy,
        ]);

        // Venta 1 de hoy (Contado Efectivo)
        $ventaHoy1 = $crearVentaHistorica(
            $cajaHoy,
            $userDespensa,
            $cliConsumidorFinal,
            'CONTADO',
            'EFECTIVO',
            [
                ['producto' => $productos['yerba_playadito'], 'cantidad' => 2],
                ['producto' => $productos['chocolinas'], 'cantidad' => 2],
                ['producto' => $productos['azucar_ledesma'], 'cantidad' => 1],
            ],
            $ahora->copy()->subHours(3)
        );

        // Venta 2 de hoy (Contado Transferencia)
        $ventaHoy2 = $crearVentaHistorica(
            $cajaHoy,
            $userEmpleado,
            $cliConsumidorFinal,
            'CONTADO',
            'TRANSFERENCIA',
            [
                ['producto' => $productos['coca_cola_225'], 'cantidad' => 2],
                ['producto' => $productos['queso_cremoso_ilolay'], 'cantidad' => 1],
                ['producto' => $productos['jamon_cocido_paladini'], 'cantidad' => 1],
            ],
            $ahora->copy()->subHours(2)
        );

        // Venta 3 de hoy (Contado Efectivo)
        $ventaHoy3 = $crearVentaHistorica(
            $cajaHoy,
            $userEmpleado,
            $cliConsumidorFinal,
            'CONTADO',
            'EFECTIVO',
            [
                ['producto' => $productos['fideos_matarazzo'], 'cantidad' => 2],
                ['producto' => $productos['pure_tomate_arcor'], 'cantidad' => 2],
                ['producto' => $productos['arroz_gallo'], 'cantidad' => 1],
            ],
            $ahora->copy()->subMinutes(75)
        );

        // Cobro parcial de hoy a María Elena Gómez ($10.000 en Efectivo) para que quede en el turno actual
        $fechaCobroMaria = $ahora->copy()->subMinutes(40);
        $cobroMaria = CobroCliente::create([
            'cliente_id' => $cliMaria->id,
            'user_id'    => $userDespensa->id,
            'monto'      => 10000.00,
            'medio_pago' => 'EFECTIVO',
            'created_at' => $fechaCobroMaria,
            'updated_at' => $fechaCobroMaria,
        ]);
        MovimientoCuentaCorrienteCliente::create([
            'cliente_id'       => $cliMaria->id,
            'monto'            => 10000.00,
            'tipo_movimiento'  => 'CREDITO',
            'cobro_cliente_id' => $cobroMaria->id,
            'created_at'       => $fechaCobroMaria,
            'updated_at'       => $fechaCobroMaria,
        ]);
        MovimientoCaja::create([
            'caja_id'          => $cajaHoy->id,
            'user_id'          => $userDespensa->id,
            'monto'            => 10000.00,
            'tipo'             => 'INGRESO_COBRO_CLIENTE',
            'concepto'         => "Cobro parcial CC Cliente: {$cliMaria->nombre} {$cliMaria->apellido}",
            'cobro_cliente_id' => $cobroMaria->id,
            'created_at'       => $fechaCobroMaria,
            'updated_at'       => $fechaCobroMaria,
        ]);
        $cliMaria->decrement('saldo_cuenta_corriente', 10000.00);

        // =====================================================================
        // 10. BITÁCORA DE AUDITORÍA REALISTA (CU03)
        // =====================================================================
        $logsAuditoria = [
            [
                'user_id'    => $userAdmin->id,
                'accion'     => AccionAuditoria::INICIO_SESION->value,
                'detalle'    => "Inicio de sesión exitoso de {$userAdmin->name} ({$userAdmin->email}).",
                'created_at' => $ahora->copy()->subDays(5)->setTime(8, 30),
            ],
            [
                'user_id'    => $userAdmin->id,
                'accion'     => AccionAuditoria::CREAR_USUARIO->value,
                'detalle'    => "Creación del usuario '{$userEmpleado->name}' ({$userEmpleado->email}) con rol 'empleado'.",
                'created_at' => $ahora->copy()->subDays(5)->setTime(8, 40),
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::REGISTRAR_COMPRA->value,
                'detalle'    => "Compra #{$compra1->id} a {$provMayorista->razon_social} por $ 115600.00 (CUENTA_CORRIENTE).",
                'created_at' => $fechaCompra1,
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::PAGO_PROVEEDOR->value,
                'detalle'    => "Pago #{$pagoProv1->id} a {$provMayorista->razon_social} por $ 50000.00 (TRANSFERENCIA).",
                'created_at' => $fechaPagoProv1,
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::REGISTRAR_COMPRA->value,
                'detalle'    => "Compra #{$compra2->id} a {$provLacteos->razon_social} por $ 83200.00 (CUENTA_CORRIENTE).",
                'created_at' => $fechaCompra2,
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::ACTUALIZAR_PRECIOS->value,
                'detalle'    => "Actualización masiva de precios (+8.5%) aplicada sobre 5 productos de la categoría 'Lácteos'.",
                'created_at' => $ahora->copy()->subDays(1)->setTime(11, 20),
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::INICIO_SESION->value,
                'detalle'    => "Inicio de sesión exitoso de {$userDespensa->name} ({$userDespensa->email}).",
                'created_at' => $aperturaHoy->copy()->subMinutes(5),
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::ABRIR_CAJA->value,
                'detalle'    => "Apertura de caja #{$cajaHoy->id} con saldo inicial de $ 50000.00.",
                'created_at' => $aperturaHoy,
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::VENTA_CONTADO->value,
                'detalle'    => "Venta #{$ventaHoy1->id} de contado por $ {$ventaHoy1->total} (EFECTIVO).",
                'created_at' => $ahora->copy()->subHours(3),
            ],
            [
                'user_id'    => $userEmpleado->id,
                'accion'     => AccionAuditoria::VENTA_CONTADO->value,
                'detalle'    => "Venta #{$ventaHoy2->id} de contado por $ {$ventaHoy2->total} (TRANSFERENCIA).",
                'created_at' => $ahora->copy()->subHours(2),
            ],
            [
                'user_id'    => $userEmpleado->id,
                'accion'     => AccionAuditoria::VENTA_CONTADO->value,
                'detalle'    => "Venta #{$ventaHoy3->id} de contado por $ {$ventaHoy3->total} (EFECTIVO).",
                'created_at' => $ahora->copy()->subMinutes(75),
            ],
            [
                'user_id'    => $userDespensa->id,
                'accion'     => AccionAuditoria::COBRO_CLIENTE->value,
                'detalle'    => "Cobro #{$cobroMaria->id} a cliente {$cliMaria->nombre} {$cliMaria->apellido} por $ 10000.00 (EFECTIVO).",
                'created_at' => $fechaCobroMaria,
            ],
        ];

        foreach ($logsAuditoria as $log) {
            DB::table('auditorias')->insert([
                'user_id'    => $log['user_id'],
                'accion'     => $log['accion'],
                'detalle'    => $log['detalle'],
                'created_at' => $log['created_at'],
                'updated_at' => $log['created_at'],
            ]);
        }
    }
}

