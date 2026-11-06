<?php

namespace App\Http\Controllers;

use App\Enums\AccionAuditoria;
use App\Http\Requests\StoreUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Caja;
use App\Models\User;
use App\Services\AuditoriaService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function __construct(
        protected AuditoriaService $auditoriaService
    ) {}
    public function index()
    {
        $users = User::where('role', '!=', 'admin')->get();
        
        return response()->json([
            'ok' => true,
            'users' => UserResource::collection($users),
        ]);
    }

    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();

        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => $validated['role'],
            ]);

            $this->auditoriaService->registrar(
                AccionAuditoria::CREAR_USUARIO,
                "Usuario creado #{$user->id}: {$user->name} <{$user->email}> (rol {$user->role})."
            );

            return response()->json([
                'ok' => true,
                'user' => new UserResource($user),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Error al crear el usuario.', 
            ], 500);
        }

    }

    public function destroy(Request $request, $id){
        try{
            $user = User::find($id);
            if(!$user){
                return response()->json([
                    'ok' => false,
                    'message' => 'Usuario no encontrado.'
                ], 404);
            }

            if ($request->user() && $request->user()->id === $user->id) {
                return response()->json([
                    'ok' => false,
                    'message' => 'No puede eliminar su propio usuario en sesión.'
                ], 409);
            }

            if (Caja::abierta()->where('usuario_apertura_id', $user->id)->exists()) {
                return response()->json([
                    'ok' => false,
                    'message' => 'No se puede eliminar el usuario porque tiene una caja abierta actualmente.'
                ], 409);
            }

            $user->tokens()->delete();
            $user->delete();

            $this->auditoriaService->registrar(
                AccionAuditoria::ELIMINAR_USUARIO,
                "Usuario eliminado #{$user->id}: {$user->name} <{$user->email}> (rol {$user->role})."
            );

            return response()->json([
                'ok' => true,
                'message' => 'Usuario eliminado correctamente.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Error al eliminar el usuario.'
            ], 500);
        }
    }
}
