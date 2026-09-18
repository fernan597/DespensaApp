<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CajaController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MarcaController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\VentaController;
use Illuminate\Http\Request;
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
    Route::get('/user', function (Request $request) {
        return response()->json($request->user());
    });
    Route::post('/logout', [AuthController::class, 'logout']);
    

    // Rutas protegidas por rol
    Route::middleware('role:admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    Route::middleware('role:admin_despensa')->group(function () {
        Route::post('/products', [ProductController::class, 'store']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
        Route::post('/marcas', [MarcaController::class, 'store']);
        Route::delete('/marcas/{id}', [MarcaController::class, 'destroy']);
        // Historial de cajas (solo admin del negocio)
        Route::get('/cajas', [CajaController::class, 'index']);
    });

    Route::middleware('role:admin,admin_despensa,empleado')->group(function () {
        // --- Catálogo (lectura requerida para POS y gestión) ---
        Route::get('/products',   [ProductController::class, 'index']);
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/marcas',     [MarcaController::class, 'index']);

        // --- Caja ---
        Route::get('/caja/estado',  [CajaController::class, 'estado']);
        Route::post('/caja/abrir',  [CajaController::class, 'abrir']);
        Route::post('/caja/cerrar', [CajaController::class, 'cerrar']);

        // --- Ventas ---
        Route::post('/ventas/contado', [VentaController::class, 'storeContado']);
        Route::get('/ventas',          [VentaController::class, 'index']);
        Route::get('/ventas/{id}',     [VentaController::class, 'show']);
    });

});
