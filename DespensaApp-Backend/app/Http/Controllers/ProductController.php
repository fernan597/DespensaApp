<?php

namespace App\Http\Controllers;

use App\Exceptions\ProductPriceException;
use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductPricesRequest;
use App\Http\Resources\ProductResource;
use App\Models\Marca;
use App\Models\Product;
use App\Services\AlertaStockService;
use App\Services\ProductPriceService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['categoria:id,nombre', 'marca:id,nombre'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'products' => ProductResource::collection($products),
        ]);
    }

    public function store(StoreProductRequest $request, AlertaStockService $alertaStockService)
    {
        $validatedData = $request->validated();

        try {
            $product = DB::transaction(function () use ($validatedData, $alertaStockService) {
                $marcaId = $validatedData['marca_id'] ?? null;

                if (! empty($validatedData['marca_nombre'])) {
                    $marca = Marca::firstOrCreate([
                        'nombre' => trim($validatedData['marca_nombre']),
                    ]);
                    $marcaId = $marca->id;
                }

                $product = Product::create([
                    'nombre'       => $validatedData['name'],
                    'codigo_barra' => $validatedData['codigo_barra'],
                    'stock_actual' => $validatedData['stock_actual'],
                    'stock_minimo' => $validatedData['stock_minimo'],
                    'precio_compra' => $validatedData['precio_compra'],
                    'precio_venta' => $validatedData['precio_venta'],
                    'categoria_id' => $validatedData['categoria_id'],
                    'marca_id'     => $marcaId,
                ]);

                $alertaStockService->sincronizarProducto($product);

                return $product;
            });

            $product->load(['categoria:id,nombre', 'marca:id,nombre']);

            return response()->json([
                'message' => 'Producto creado exitosamente',
                'product' => new ProductResource($product),
            ], 201);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Error al crear el producto',
                'error'   => $error->getMessage(),
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $product = Product::find($id);

            if (! $product) {
                return response()->json([
                    'message' => 'Producto no encontrado',
                ], 404);
            }

            $product->delete();

            return response()->json([
                'message' => 'Producto eliminado exitosamente',
            ]);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Error al eliminar el producto',
                'error'   => $error->getMessage(),
            ], 500);
        }
    }

    public function update($id, StoreProductRequest $request, AlertaStockService $alertaStockService)
    {
        $validatedData = $request->validated();

        $product = Product::find($id);

        if (! $product) {
            return response()->json([
                'message' => 'Producto no encontrado',
            ], 404);
        }

        try {
            DB::transaction(function () use ($product, $validatedData, $alertaStockService) {
                $marcaId = $validatedData['marca_id'] ?? null;

                if (! empty($validatedData['marca_nombre'])) {
                    $marca = Marca::firstOrCreate([
                        'nombre' => trim($validatedData['marca_nombre']),
                    ]);
                    $marcaId = $marca->id;
                }

                $product->update([
                    'nombre'       => $validatedData['name'],
                    'codigo_barra' => $validatedData['codigo_barra'],
                    'stock_actual' => $validatedData['stock_actual'],
                    'stock_minimo' => $validatedData['stock_minimo'],
                    'precio_compra' => $validatedData['precio_compra'],
                    'precio_venta' => $validatedData['precio_venta'],
                    'categoria_id' => $validatedData['categoria_id'],
                    'marca_id'     => $marcaId,
                ]);

                $alertaStockService->sincronizarProducto($product);
            });

            $product->load(['categoria:id,nombre', 'marca:id,nombre']);

            return response()->json([
                'message' => 'Producto actualizado exitosamente',
                'product' => new ProductResource($product),
            ]);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Error al actualizar el producto',
                'error'   => $error->getMessage(),
            ], 500);
        }
    }

    /**
     * [CU06] Actualizar Precios y Márgenes (Individual o Masivo por Categoría/Marca).
     */
    public function updatePrecios(
        UpdateProductPricesRequest $request,
        ProductPriceService $service
    ) {
        $data = $request->validated();

        try {
            if ($data['modo'] === 'individual') {
                $product = $service->actualizarIndividual(
                    (int) $data['product_id'],
                    (string) $data['precio_compra'],
                    (string) $data['precio_venta']
                );

                return response()->json([
                    'message' => 'Precio y margen actualizados correctamente',
                    'product' => new ProductResource($product),
                ]);
            }

            $resultado = $service->actualizarMasivo($data);

            $mensaje = "Se actualizaron los precios de {$resultado['updated_count']} producto(s) exitosamente.";

            if ($resultado['skipped_count'] > 0) {
                $mensaje .= " Se omitieron {$resultado['skipped_count']} producto(s) sin costo de compra.";
            }

            return response()->json([
                'message'       => $mensaje,
                'updated_count' => $resultado['updated_count'],
                'skipped_count' => $resultado['skipped_count'],
            ]);
        } catch (ModelNotFoundException $error) {
            return response()->json([
                'message' => 'Producto no encontrado',
            ], 404);
        } catch (ProductPriceException $error) {
            return response()->json([
                'message' => $error->getMessage(),
            ], 422);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'message' => 'Error al actualizar los precios',
            ], 500);
        }
    }
}
