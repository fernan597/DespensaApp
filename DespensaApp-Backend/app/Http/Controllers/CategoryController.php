<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Resources\CategoryResource;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Category::orderBy('nombre', 'asc')->get();
        return response()->json([
            'categories' => CategoryResource::collection($categories),
        ]);
    }

    public function store(StoreCategoryRequest $request){
        $validated = $request->validated();

        try {
            $category = Category::create([
                'nombre' => $validated['nombre'],
            ]);

            return response()->json([
                'ok' => true,
                'category' => new CategoryResource($category),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Error al crear la categoría.',
                'error' => $e->getMessage(), // temporal, solo para debug
                'line' => $e->getLine(),
        'file' => $e->getFile(),
            ], 500);
        }
    }
    
    public function destroy($id){
        try{
            $category = Category::find($id);
            if(!$category){
                return response()->json([
                    'ok' => false,
                    'message' => 'Categoría no encontrada.'
                ], 404);
            }

            $category->delete();
            return response()->json([
                'ok' => true,
                'message' => 'Categoría eliminada correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Error al eliminar la categoría.'
            ], 500);
        }
    }
}
