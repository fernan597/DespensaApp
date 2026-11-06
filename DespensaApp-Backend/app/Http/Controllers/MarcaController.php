<?php

namespace App\Http\Controllers;

use App\Enums\AccionAuditoria;
use Illuminate\Http\Request;
use App\Models\Marca;
use App\Http\Requests\StoreMarcaRequest;
use App\Http\Resources\MarcaResource;
use App\Services\AuditoriaService;

class MarcaController extends Controller
{
    public function __construct(
        protected AuditoriaService $auditoriaService
    ) {}
    public function index(){
        $marcas = Marca::orderBy('nombre', 'asc')->get();
        return response()->json([
            'marcas' => MarcaResource::collection($marcas),
        ]);
    }

    public function store(StoreMarcaRequest $request){
        $validatedData = $request->validated();
        try{
            $marca = Marca::create([
                'nombre' => $validatedData['nombre'],
            ]);

            $this->auditoriaService->registrar(
                AccionAuditoria::CREAR_MARCA,
                "Marca #{$marca->id} creada: {$marca->nombre}."
            );

            return response()->json([
                'message' => 'Marca creada exitosamente',
                'marca' => new MarcaResource($marca),
            ], 201);
        }catch(\Exception $error){
            return response()->json([
                'message' => 'Error al crear la marca',
                'error' => $error->getMessage()
            ], 500);
        }
    }

    public function destroy($id){
        try{
            $marca = Marca::find($id);
            if(!$marca){
                return response()->json([
                    'message' => 'Marca no encontrada'
                ], 404);
            }

            if ($marca->products()->exists()) {
                return response()->json([
                    'message' => 'No se puede eliminar la marca porque tiene productos activos asociados.'
                ], 409);
            }

            $marca->delete();

            $this->auditoriaService->registrar(
                AccionAuditoria::ELIMINAR_MARCA,
                "Marca #{$marca->id} eliminada: {$marca->nombre}."
            );

            return response()->json([
                'message' => 'Marca eliminada exitosamente',
            ]);
        }catch(\Exception $error){
            return response()->json([
                'message' => 'Error al eliminar la marca',
                'error' => $error->getMessage()
            ], 500);
        }
    }
}
