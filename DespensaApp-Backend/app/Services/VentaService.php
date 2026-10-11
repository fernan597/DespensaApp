<?php

namespace App\Services;

use App\Exceptions\StockInsuficienteException;
use App\Models\AlertaStock;
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
     * Bloquea los productos solicitados, valida stock suficiente y calcula el total.
     *
     * @param  array  $items  [['producto_id' => int, 'cantidad' => int], ...]
     * @return array{productos: array<int, array{modelo: Product, cantidad: int}>, total: float}
     *
     * @throws StockInsuficienteException Si algún producto no tiene stock suficiente.
     */
    public function prepararItems(array $items): array
    {
        $productos = [];
        $total     = 0;

        foreach ($items as $item) {
            $producto = Product::lockForUpdate()->findOrFail($item['producto_id']);
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

            $total += $producto->precio_venta * $cantidad;
        }

        return [
            'productos' => $productos,
            'total'     => round($total, 2),
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

            // Detalle con precio tomado de la BD, nunca del request
            DetalleVenta::create([
                'venta_id'        => $venta->id,
                'product_id'      => $producto->id,
                'cantidad'        => $cantidad,
                'precio_unitario' => $producto->precio_venta,
                'subtotal'        => round($producto->precio_venta * $cantidad, 2),
            ]);

            // Descontar stock
            $producto->decrement('stock_actual', $cantidad);
            $producto->refresh();

            // Alerta de stock mínimo
            if ($producto->stock_actual <= $producto->stock_minimo) {
                AlertaStock::create([
                    'product_id' => $producto->id,
                    'mensaje'    => "Stock bajo: '{$producto->nombre}' tiene {$producto->stock_actual} unidad(es) disponible(s).",
                    'atendida'   => false,
                ]);
            }
        }

        return $venta;
    }
}
