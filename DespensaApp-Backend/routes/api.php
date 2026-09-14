<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\MarcaController;

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
        Route::get('/products', [ProductController::class, 'index']);
        Route::post('/products', [ProductController::class, 'store']);
        Route::delete('/products/{id}', [ProductController::class, 'destroy']);
        Route::put('/products/{id}', [ProductController::class, 'update']);
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
        Route::get('/marcas', [MarcaController::class, 'index']);
        Route::post('/marcas', [MarcaController::class, 'store']);
        Route::delete('/marcas/{id}', [MarcaController::class, 'destroy']);
    });

    Route::middleware('role:admin_despensa,empleado')->group(function () {
        
    });

});
