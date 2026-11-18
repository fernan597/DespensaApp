<?php

namespace App\Services;

use App\Exceptions\StockInsuficienteException;
use App\Models\DetalleVenta;
use App\Models\Product;
use App\Models\Venta;

/**
 * Lógica común a las ventas de Contado y a Crédito.
 *
 * Debe invocarse SIEMPRE dentro de una transacción (DB::transaction),
 * ya que bloquea filas con lockForUpdate y lanza excepciones para forzar rollback.
 */
class VentaService
{
    /**
     * Constructor con inyección de dependencias.
     * Laravel inyecta automáticamente AlertaStockService gracias al contenedor IoC.
     * La palabra clave 'protected' en el constructor (PHP 8.1+) crea y asigna
     * la propiedad $alertaStockService en un solo paso (constructor promotion).
     */
    public function __construct(
        protected AlertaStockService $alertaStockService
    ) {}

    /**
     * Bloquea los productos solicitados en orden ascendente de ID (previene deadlocks),
     * valida stock suficiente y calcula el total.
     *
     * @param  array  $items  [['producto_id' => int, 'cantidad' => int], ...]
     * @return array{productos: array<int, array{modelo: Product, cantidad: int}>, total: float}
     *
     * @throws StockInsuficienteException Si algún producto no tiene stock suficiente.
     */
    public function prepararItems(array $items): array
    {
        // Extraemos todos los IDs de productos del arreglo $items,
        // los hacemos únicos (evita duplicados) y los ordenamos ascendentemente.
        // Ordenar por ID es fundamental para prevenir deadlocks: si dos transacciones
        // concurrentes bloquean filas en distinto orden pueden bloquearse mutuamente.
        $productIds = collect($items)->pluck('producto_id')->unique()->sort()->values()->all();

        // Consultamos los productos en la BD en el mismo orden ascendente de ID
        // y aplicamos lockForUpdate() para bloquear las filas durante esta transacción.
        // keyBy('id') convierte el resultado en un mapa [id => modelo] para acceso O(1).
        $productosDb = Product::whereIn('id', $productIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        // Inicializamos el arreglo de productos procesados y el total de la venta.
        $productos = [];
        $total     = '0.00'; // Usamos string para BCMath y evitar errores de precisión flotante.

        // Recorremos cada ítem que el usuario quiere comprar.
        foreach ($items as $item) {
            /** @var Product|null $producto */
            // Intentamos obtener el producto del mapa ya consultado (evita queries extra).
            // Si por alguna razón no estuviera (caso raro), lo buscamos directamente con bloqueo.
            $producto = $productosDb->get($item['producto_id'])
                ?? Product::lockForUpdate()->findOrFail($item['producto_id']);

            // Casteamos la cantidad a entero para garantizar que sea un número entero válido.
            $cantidad = (int) $item['cantidad'];

            // Validamos que haya suficiente stock antes de continuar.
            // Si no hay stock, lanzamos una excepción que provoca el rollback de la transacción.
            if ($producto->stock_actual < $cantidad) {
                throw new StockInsuficienteException(
                    "Stock insuficiente para '{$producto->nombre}'. " .
                    "Disponible: {$producto->stock_actual}, solicitado: {$cantidad}."
                );
            }

            // Guardamos el modelo del producto y la cantidad pedida para usarlos luego
            // en registrarVenta() sin necesidad de volver a consultar la BD.
            $productos[] = [
                'modelo'   => $producto,
                'cantidad' => $cantidad,
            ];

            // Calculamos el subtotal de este ítem con bcmul() (multiplicación BCMath)
            // con 2 decimales de precisión. Usamos strings para evitar imprecisiones flotantes.
            $subtotalItem = bcmul((string) $producto->precio_venta, (string) $cantidad, 2);

            // Acumulamos el subtotal al total general usando bcadd() (suma BCMath).
            $total        = bcadd($total, $subtotalItem, 2);
        }

        // Devolvemos los productos preparados y el total calculado.
        // El total se castea a float porque así lo espera el resto del sistema.
        return [
            'productos' => $productos,
            'total'     => (float) $total,
        ];
    }

    /**
     * Crea la cabecera de la venta y sus detalles, descuenta stock y genera alertas de stock mínimo.
     *
     * @param  array  $cabecera   Atributos de Venta (user_id, cliente_id, total, tipo_venta, medio_pago, estado)
     * @param  array  $productos  Resultado de prepararItems()['productos']
     */
    public function registrarVenta(array $cabecera, array $productos): Venta
    {
        // Creamos el registro principal de la venta con los datos de cabecera recibidos.
        // Venta::create() inserta en la tabla y retorna el modelo con su ID generado.
        $venta = Venta::create($cabecera);

        // Recorremos cada producto para registrar su detalle y descontar el stock.
        foreach ($productos as $item) {
            /** @var Product $producto */
            // Extraemos el modelo de producto y la cantidad del arreglo preparado previamente.
            $producto = $item['modelo'];
            $cantidad = $item['cantidad'];

            // Calculamos el subtotal del ítem usando BCMath para garantizar precisión decimal.
            $subtotal = (float) bcmul((string) $producto->precio_venta, (string) $cantidad, 2);

            // Detalle con precio tomado de la BD, nunca del request.
            // Esto es una medida de seguridad: el precio siempre viene del servidor,
            // nunca confiamos en el precio que el cliente pudiera enviar en el formulario.
            DetalleVenta::create([
                'venta_id'        => $venta->id,       // Relaciona el detalle con su venta padre.
                'product_id'      => $producto->id,    // ID del producto vendido.
                'cantidad'        => $cantidad,         // Unidades vendidas.
                'precio_unitario' => $producto->precio_venta, // Precio oficial desde la BD.
                'subtotal'        => $subtotal,         // cantidad × precio unitario.
            ]);

            // Descontar stock: reducimos stock_actual en la cantidad vendida.
            // decrement() hace el UPDATE de forma atómica, evitando condiciones de carrera.
            $producto->decrement('stock_actual', $cantidad);

            // Recargamos el modelo desde la BD para obtener el stock_actual actualizado
            // y pasarlo correctamente al servicio de alertas.
            $producto->refresh();

            // Bitácora de alertas de stock mínimo.
            // Verificamos si el stock cayó por debajo del mínimo y, de ser así,
            // creamos o actualizamos la alerta correspondiente en la BD.
            $this->alertaStockService->sincronizarProducto($producto);
        }

        // Retornamos el modelo Venta recién creado para que el controlador pueda
        // usarlo en la respuesta (p.ej. para devolver el ID al cliente).
        return $venta;
    }
}
