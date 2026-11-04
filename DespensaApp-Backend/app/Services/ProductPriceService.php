<?php

namespace App\Services;

use App\Exceptions\ProductPriceException;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

/**
 * Lógica de actualización individual y masiva de precios y márgenes (CU06).
 *
 * Todos los importes se calculan como strings con BCMath para evitar
 * errores de precisión propios de los flotantes.
 */
class ProductPriceService
{
    /**
     * Actualiza el costo y el precio de venta de un producto.
     */
    public function actualizarIndividual(
        int $productId,
        string $precioCompra,
        string $precioVenta
    ): Product {
        return DB::transaction(function () use ($productId, $precioCompra, $precioVenta) {
            $product = Product::lockForUpdate()->findOrFail($productId);

            $product->update([
                'precio_compra' => $this->normalizar($precioCompra),
                'precio_venta'  => $this->normalizar($precioVenta),
            ]);

            return $product->load(['categoria:id,nombre', 'marca:id,nombre']);
        });
    }

    /**
     * Actualiza masivamente los precios según el filtro y la regla indicada.
     *
     * @return array{updated_count: int, skipped_count: int}
     */
    public function actualizarMasivo(array $data): array
    {
        return DB::transaction(function () use ($data) {
            $query = Product::query();

            if ($data['filtro_tipo'] === 'categoria') {
                $query->where('categoria_id', $data['categoria_id']);
            } elseif ($data['filtro_tipo'] === 'marca') {
                $query->where('marca_id', $data['marca_id']);
            }

            // Bloqueo ordenado para evitar deadlocks y pérdida de cambios concurrentes.
            $products = $query->orderBy('id')->lockForUpdate()->get();

            if ($products->isEmpty()) {
                throw new ProductPriceException(
                    'No se encontraron productos para el filtro seleccionado.'
                );
            }

            $factor = bcdiv(
                bcadd('100', (string) $data['valor_porcentaje'], 4),
                '100',
                6
            );

            $tipoAjuste      = $data['tipo_ajuste'];
            $actualizarCosto = ! empty($data['actualizar_costo']);
            $updatedCount    = 0;
            $skippedCount    = 0;

            foreach ($products as $product) {
                $nuevoCosto = (string) $product->precio_compra;
                $nuevaVenta = (string) $product->precio_venta;

                if ($tipoAjuste === 'porcentaje_aumento') {
                    if ($actualizarCosto && bccomp($nuevoCosto, '0.00', 2) === 1) {
                        $nuevoCosto = $this->aplicarFactor($nuevoCosto, $factor);
                    }

                    $nuevaVenta = $this->aplicarFactor($nuevaVenta, $factor);
                } elseif ($tipoAjuste === 'fijar_margen') {
                    // Sin costo no es posible calcular un margen sobre la compra.
                    if (bccomp($nuevoCosto, '0.00', 2) !== 1) {
                        $skippedCount++;
                        continue;
                    }

                    $nuevaVenta = $this->aplicarFactor($nuevoCosto, $factor);
                }

                $product->update([
                    'precio_compra' => $nuevoCosto,
                    'precio_venta'  => $nuevaVenta,
                ]);

                $updatedCount++;
            }

            return [
                'updated_count' => $updatedCount,
                'skipped_count' => $skippedCount,
            ];
        });
    }

    private function aplicarFactor(string $importe, string $factor): string
    {
        $resultado = bcmul($importe, $factor, 6);

        // Redondeo half-up a dos decimales sin usar flotantes.
        $resultado = bcadd($resultado, '0.005', 2);

        return bccomp($resultado, '0.01', 2) === -1 ? '0.01' : $resultado;
    }

    private function normalizar(string $importe): string
    {
        return bcadd($importe, '0', 2);
    }
}
