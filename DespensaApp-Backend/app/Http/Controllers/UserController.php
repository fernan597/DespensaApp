<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use App\Http\Requests\StoreUserRequest;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('role', '!=', 'admin')->get();
        
        return response()->json([
            'ok' => true,
            'users' => $users,
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

            return response()->json([
                'ok' => true,
                'user' => $user,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'ok' => false,
                'message' => 'Error al crear el usuario.', 
            ], 500);
        }

    }

    public function destroy($id){
        try{
            $user = User::find($id);
            if(!$user){
                return response()->json([
                    'ok' => false,
                    'message' => 'Usuario no encontrado.'
                ], 404);
            }

            $user->delete();
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
