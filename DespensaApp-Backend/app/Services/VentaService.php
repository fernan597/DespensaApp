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
        // Obtiene los IDs de los productos sin repetir y ordenados de menor a mayor.
       // El orden consistente evita deadlocks: si dos transacciones bloquean los mismos
      // productos, ambas lo hacen en el mismo orden y no quedan esperándose mutuamente.
        $productIds = collect($items)->pluck('producto_id')->unique()->sort()->values()->all();

        // Trae todos los productos en una sola consulta (evita el problema N+1) y los
    // bloquea con "SELECT ... FOR UPDATE" hasta que termine la transacción.
    // keyBy('id') permite buscarlos después por ID de forma directa.
        $productosDb = Product::whereIn('id', $productIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $productos = [];
        $total     = '0.00';

        foreach ($items as $item) {
            /** @var Product|null $producto */
            // Busca el producto en la colección ya cargada. Si por algún motivo no está,
        // lo consulta de nuevo con lock; findOrFail lanza ModelNotFoundException
        // si el producto no existe.
            $producto = $productosDb->get($item['producto_id'])
                ?? Product::lockForUpdate()->findOrFail($item['producto_id']);

            // Normaliza la cantidad a entero (puede llegar como string desde el request).
            $cantidad = (int) $item['cantidad'];

            // Verifica que alcance el stock; si no, aborta con un mensaje claro
        // indicando producto, stock disponible y cantidad pedida.
            if ($producto->stock_actual < $cantidad) {
                throw new StockInsuficienteException(
                    "Stock insuficiente para '{$producto->nombre}'. " .
                    "Disponible: {$producto->stock_actual}, solicitado: {$cantidad}."
                );
            }
            // Guarda el modelo (para descontar stock después) junto con la cantidad.
            $productos[] = [
                'modelo'   => $producto,
                'cantidad' => $cantidad,
            ];
            // Subtotal del ítem = precio de venta × cantidad, con 2 decimales exactos.
            $subtotalItem = bcmul((string) $producto->precio_venta, (string) $cantidad, 2);
            $total        = bcadd($total, $subtotalItem, 2);
        }

        return [
            'productos' => $productos,
            // Convierte a float solo al final, para devolver el total ya calculado.
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
        $venta = Venta::create($cabecera);

        foreach ($productos as $item) {
            /** @var Product $producto */
            $producto = $item['modelo'];
            $cantidad = $item['cantidad'];

            $subtotal = (float) bcmul((string) $producto->precio_venta, (string) $cantidad, 2);

            // Detalle con precio tomado de la BD, nunca del request
            DetalleVenta::create([
                'venta_id'        => $venta->id,
                'product_id'      => $producto->id,
                'cantidad'        => $cantidad,
                'precio_unitario' => $producto->precio_venta,
                'subtotal'        => $subtotal,
            ]);

            // Descontar stock
            $producto->decrement('stock_actual', $cantidad);
            $producto->refresh();

            // Bitácora de alertas de stock mínimo
            $this->alertaStockService->sincronizarProducto($producto);
        }

        return $venta;
    }
}
