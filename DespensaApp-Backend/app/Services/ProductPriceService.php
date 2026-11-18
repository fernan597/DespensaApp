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
     * Actualiza el costo y el precio de venta de un producto individual.
     * Recibe el ID del producto y los nuevos precios como strings para mantener precisión.
     */
    public function actualizarIndividual(
        int $productId,
        string $precioCompra,
        string $precioVenta
    ): Product {
        // Envolvemos toda la operación en una transacción para garantizar atomicidad:
        // si algo falla, ningún cambio queda a medias en la BD.
        return DB::transaction(function () use ($productId, $precioCompra, $precioVenta) {
            // Bloqueamos la fila del producto con lockForUpdate() para que ninguna otra
            // transacción concurrente pueda modificarla hasta que terminemos.
            // findOrFail() lanza ModelNotFoundException si el producto no existe.
            $product = Product::lockForUpdate()->findOrFail($productId);

            // Actualizamos los precios normalizados (redondeados a 2 decimales con BCMath).
            // normalizar() garantiza que el string siempre tenga exactamente 2 decimales.
            $product->update([
                'precio_compra' => $this->normalizar($precioCompra),
                'precio_venta'  => $this->normalizar($precioVenta),
            ]);

            // Retornamos el producto con sus relaciones de categoría y marca cargadas
            // en modo eager loading (solo los campos id y nombre para ahorrar memoria).
            return $product->load(['categoria:id,nombre', 'marca:id,nombre']);
        });
    }

    /**
     * Actualiza masivamente los precios según el filtro y la regla indicada.
     * Puede filtrar por categoría o por marca, y aplicar aumento porcentual o fijar margen.
     *
     * @return array{updated_count: int, skipped_count: int}
     */
    public function actualizarMasivo(array $data): array
    {
        // Transacción para garantizar que todos los productos se actualicen o ninguno.
        return DB::transaction(function () use ($data) {
            // Iniciamos una consulta sobre la tabla de productos.
            $query = Product::query();

            // Aplicamos el filtro según el tipo indicado por el usuario.
            if ($data['filtro_tipo'] === 'categoria') {
                // Si el filtro es por categoría, restringimos a los productos de esa categoría.
                $query->where('categoria_id', $data['categoria_id']);
            } elseif ($data['filtro_tipo'] === 'marca') {
                // Si el filtro es por marca, restringimos a los productos de esa marca.
                $query->where('marca_id', $data['marca_id']);
            }
            // Si filtro_tipo es 'todos' (u otro valor), no se agrega ningún WHERE y se
            // procesan todos los productos.

            // Bloqueo ordenado para evitar deadlocks y pérdida de cambios concurrentes.
            // Ordenamos por ID ascendente por la misma razón que en VentaService:
            // garantizar un orden consistente de bloqueo entre transacciones concurrentes.
            $products = $query->orderBy('id')->lockForUpdate()->get();

            // Si no hay productos que coincidan con el filtro, lanzamos una excepción
            // para informar al usuario y hacer rollback automático de la transacción.
            if ($products->isEmpty()) {
                throw new ProductPriceException(
                    'No se encontraron productos para el filtro seleccionado.'
                );
            }

            /*
             * Calculamos el factor multiplicador a partir del porcentaje indicado.
             * Fórmula: factor = (100 + porcentaje) / 100
             * Ejemplo: para un 15% de aumento → factor = 115 / 100 = 1.15
             *
             * bcadd() suma con 4 decimales de precisión interna.
             * bcdiv() divide con 6 decimales para mayor exactitud intermedia.
             */
            $factor = bcdiv(
                bcadd('100', (string) $data['valor_porcentaje'], 4),
                '100',
                6
            );

            // Tipo de ajuste: 'porcentaje_aumento' o 'fijar_margen'.
            $tipoAjuste      = $data['tipo_ajuste'];

            // Bandera que indica si también se debe actualizar el precio de compra (costo).
            $actualizarCosto = ! empty($data['actualizar_costo']);

            // Contadores para el resumen que se devuelve al controlador.
            $updatedCount    = 0; // Productos actualizados exitosamente.
            $skippedCount    = 0; // Productos omitidos por no cumplir condiciones.

            // Recorremos cada producto filtrado para aplicar el ajuste de precio.
            foreach ($products as $product) {
                // Obtenemos los precios actuales como strings para operar con BCMath.
                $nuevoCosto = (string) $product->precio_compra;
                $nuevaVenta = (string) $product->precio_venta;

                if ($tipoAjuste === 'porcentaje_aumento') {
                    /*
                     * Modo "porcentaje_aumento": aumentamos el precio de venta (y opcionalmente
                     * el costo) multiplicándolo por el factor calculado.
                     */

                    // Si se debe actualizar el costo Y el costo actual es mayor que cero,
                    // aplicamos el factor también al precio de compra.
                    // bccomp() devuelve 1 si el primer argumento > el segundo.
                    if ($actualizarCosto && bccomp($nuevoCosto, '0.00', 2) === 1) {
                        $nuevoCosto = $this->aplicarFactor($nuevoCosto, $factor);
                    }

                    // Siempre actualizamos el precio de venta con el factor de aumento.
                    $nuevaVenta = $this->aplicarFactor($nuevaVenta, $factor);

                } elseif ($tipoAjuste === 'fijar_margen') {
                    /*
                     * Modo "fijar_margen": el precio de venta = precio de compra × factor.
                     * Esto establece un margen fijo sobre el costo.
                     * Ejemplo: costo = $100, factor = 1.30 → venta = $130 (30% de margen).
                     */

                    // Si el costo es 0 o negativo, no podemos calcular un margen válido,
                    // por lo que omitimos este producto y lo contamos como "skipped".
                    if (bccomp($nuevoCosto, '0.00', 2) !== 1) {
                        $skippedCount++;
                        continue; // Saltamos al siguiente producto del foreach.
                    }

                    // El nuevo precio de venta es el costo multiplicado por el factor de margen.
                    $nuevaVenta = $this->aplicarFactor($nuevoCosto, $factor);
                }

                // Guardamos los nuevos precios calculados en la BD.
                $product->update([
                    'precio_compra' => $nuevoCosto,
                    'precio_venta'  => $nuevaVenta,
                ]);

                // Incrementamos el contador de productos actualizados exitosamente.
                $updatedCount++;
            }

            // Devolvemos el resumen de la operación masiva para informar al usuario.
            return [
                'updated_count' => $updatedCount, // Cuántos productos fueron actualizados.
                'skipped_count' => $skippedCount, // Cuántos fueron omitidos (sin costo válido).
            ];
        });
    }

    /**
     * Multiplica un importe por un factor y lo redondea a 2 decimales.
     * Garantiza que el resultado mínimo sea $0.01 (nunca cero ni negativo).
     *
     * @param  string  $importe  Precio base como string (ej. "150.00").
     * @param  string  $factor   Factor multiplicador como string (ej. "1.150000").
     * @return string            Resultado redondeado a 2 decimales como string.
     */
    private function aplicarFactor(string $importe, string $factor): string
    {
        // Multiplicamos el importe por el factor con 6 decimales de precisión interna
        // para no perder precisión antes de redondear.
        $resultado = bcmul($importe, $factor, 6);

        // Sumamos 0.005 antes de truncar a 2 decimales: esto implementa redondeo comercial
        // (half-up). bcadd con escala 2 trunca; al sumar 0.005 logramos que 0.5 suba al entero.
        $resultado = bcadd($resultado, '0.005', 2);

        // Si el resultado calculado es menor que $0.01 (precio mínimo posible),
        // lo forzamos a $0.01 para evitar precios de $0.00 que romperían la lógica de negocio.
        // bccomp() devuelve -1 si $resultado < '0.01'.
        return bccomp($resultado, '0.01', 2) === -1 ? '0.01' : $resultado;
    }

    /**
     * Normaliza un importe a exactamente 2 decimales usando BCMath.
     * Usar bcadd($x, '0', 2) es el idioma estándar de BCMath para redondear/truncar a 2 decimales.
     *
     * @param  string  $importe  Valor a normalizar (ej. "99.9" → "99.90").
     * @return string            Valor normalizado con 2 decimales.
     */
    private function normalizar(string $importe): string
    {
        // bcadd con '0' y escala 2 simplemente trunca el número a 2 decimales.
        // Es la forma idiomática de BCMath para "asegurar exactamente N decimales".
        return bcadd($importe, '0', 2);
    }
}
