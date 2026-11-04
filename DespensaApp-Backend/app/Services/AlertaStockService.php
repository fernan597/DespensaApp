<?php

namespace App\Services;

use App\Models\AlertaStock;
use App\Models\Product;
use App\Http\Resources\ProductResource;

/**
 * Monitoreo y sincronización de alertas de stock mínimo (CU17).
 *
 * La consulta en vivo de productos es la fuente de verdad para la UI.
 * La tabla alertas_stock funciona como bitácora de eventos: guarda una
 * alerta abierta por producto y la resuelve cuando se repone el stock.
 */
class AlertaStockService
{
    /**
     * Productos que alcanzaron o cayeron por debajo del stock mínimo.
     *
     * @return array{total_alertas: int, agotados: int, bajo_minimo: int, products: mixed}
     */
    public function listar(): array
    {
        $products = Product::with(['categoria:id,nombre', 'marca:id,nombre'])
            ->whereColumn('stock_actual', '<=', 'stock_minimo')
            ->orderBy('stock_actual', 'asc')
            ->orderBy('id', 'asc')
            ->get();

        $agotados   = $products->where('stock_actual', '<=', 0)->count();
        $bajoMinimo = $products->where('stock_actual', '>', 0)->count();

        return [
            'total_alertas' => $products->count(),
            'agotados'      => $agotados,
            'bajo_minimo'   => $bajoMinimo,
            'products'      => ProductResource::collection($products),
        ];
    }

    /**
     * Mantiene sincronizada la bitácora de alertas de un producto.
     */
    public function sincronizarProducto(Product $producto): void
    {
        $alertaAbierta = AlertaStock::where('product_id', $producto->id)
            ->where('atendida', false)
            ->first();

        if ($producto->stock_actual <= $producto->stock_minimo) {
            $mensaje = "Stock bajo: '{$producto->nombre}' tiene {$producto->stock_actual} unidad(es) disponible(s).";

            if ($alertaAbierta) {
                $alertaAbierta->update(['mensaje' => $mensaje]);
                return;
            }

            AlertaStock::create([
                'product_id' => $producto->id,
                'mensaje'    => $mensaje,
                'atendida'   => false,
            ]);

            return;
        }

        // Si se repuso por encima del mínimo, se resuelven las alertas abiertas.
        AlertaStock::where('product_id', $producto->id)
            ->where('atendida', false)
            ->update(['atendida' => true]);
    }
}
