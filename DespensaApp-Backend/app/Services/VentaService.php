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
        $productIds = collect($items)->pluck('producto_id')->unique()->sort()->values()->all();
        $productosDb = Product::whereIn('id', $productIds)
            ->orderBy('id')
            ->lockForUpdate()
            ->get()
            ->keyBy('id');

        $productos = [];
        $total     = '0.00';

        foreach ($items as $item) {
            /** @var Product|null $producto */
            $producto = $productosDb->get($item['producto_id'])
                ?? Product::lockForUpdate()->findOrFail($item['producto_id']);

            $cantidad = (int) $item['cantidad'];

            if ($producto->stock_actual < $cantidad) {
                throw new StockInsuficienteException(
                    "Stock insuficiente para '{$producto->nombre}'. " .
                    "Disponible: {$producto->stock_actual}, solicitado: {$cantidad}."
                );
            }

            $productos[] = [
                'modelo'   => $producto,
                'cantidad' => $cantidad,
            ];

            $subtotalItem = bcmul((string) $producto->precio_venta, (string) $cantidad, 2);
            $total        = bcadd($total, $subtotalItem, 2);
        }

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
