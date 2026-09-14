<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Models\Product;
use App\Models\Marca;
use Illuminate\Http\Request;
use App\Http\Resources\ProductResource;

class ProductController extends Controller
{
    public function index(){
        $products = Product::with(['categoria:id,nombre', 'marca:id,nombre'])
            ->orderBy('id', 'desc')
            ->get();

        return response()->json([
            'products' => ProductResource::collection($products),
        ]);
    }

    public function store(StoreProductRequest $request){
        $validatedData = $request->validated();
        try{
            $marcaId = $validatedData['marca_id'] ?? null;
            if (!empty($validatedData['marca_nombre'])) {
                $marca = Marca::firstOrCreate([
                    'nombre' => trim($validatedData['marca_nombre'])
                ]);
                $marcaId = $marca->id;
            }

            $product = Product::create([
                'nombre' => $validatedData['name'],
                'codigo_barra' => $validatedData['codigo_barra'],
                'stock_actual' => $validatedData['stock_actual'],
                'stock_minimo' => $validatedData['stock_minimo'],
                'precio_compra' => $validatedData['precio_compra'],
                'precio_venta' => $validatedData['precio_venta'],
                'categoria_id' => $validatedData['categoria_id'],
                'marca_id' => $marcaId,
            ]);

            $product->load(['categoria:id,nombre', 'marca:id,nombre']);

            return response()->json([
                'message' => 'Producto creado exitosamente',
                'product' => new ProductResource($product),
            ], 201);
        }catch(\Exception $error){
            return response()->json([
                'message' => 'Error al crear el producto',
                'error' => $error->getMessage()
            ], 500);
        }
    }

    public function destroy($id){
        try{
            $product = Product::find($id);
            if(!$product){
                return response()->json([
                    'message' => 'Producto no encontrado'
                ], 404);
            }
            $product->delete();
            return response()->json([
                'message' => 'Producto eliminado exitosamente',
            ]);
        }catch(\Exception $error){
            return response()->json([
                'message' => 'Error al eliminar el producto',
                'error' => $error->getMessage()
            ], 500);
        }
    }
    
}
