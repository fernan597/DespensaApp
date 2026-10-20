<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * POST /api/login
     *
     * Autentica al usuario con email y contraseña.
     * Devuelve un token de acceso Sanctum si las credenciales son válidas.
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message'    => 'Login exitoso.',
            'token'      => $token,
            'token_type' => 'Bearer',
            'user'       => new UserResource($user),
        ], 200);
    }

    /**
     * POST /api/logout
     *
     * Revoca el token de acceso actual del usuario autenticado.
     * Requiere middleware auth:sanctum.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ], 200);
    }

    /**
     * GET /api/user
     *
     * Devuelve los datos del usuario autenticado.
     * Requiere middleware auth:sanctum.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json(new UserResource($request->user()), 200);
    }
}
