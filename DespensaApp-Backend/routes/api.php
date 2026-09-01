<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Aquí se registran las rutas de la API. Todas están bajo el prefijo "/api".
|
*/

// Rutas públicas — no requieren autenticación
Route::post('/login', [AuthController::class, 'login']);

// Rutas protegidas — requieren token Sanctum válido
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Rutas protegidas por rol
    Route::middleware('role:admin')->group(function () {
        Route::get('/admin/test', function () {
            return response()->json(['message' => 'Acceso concedido a administrador.']);
        });
    });
});
