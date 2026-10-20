<?php

namespace App\Http\Controllers;

use App\Enums\MedioPago;
use App\Exceptions\FondosInsuficientesException;
use App\Exceptions\PagoProveedorException;
use App\Http\Requests\StorePagoProveedorRequest;
use App\Http\Resources\PagoProveedorResource;
use App\Http\Resources\ProveedorResource;
use App\Services\PagoProveedorService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;

class PagoProveedorController extends Controller
{
    public function __construct(
        protected PagoProveedorService $pagoProveedorService
    ) {}

    /**
     * Registra un pago a proveedor para cancelar parte o la totalidad de la deuda pendiente (CU14).
     *
     * POST /api/pagos-proveedores
     */
    public function store(StorePagoProveedorRequest $request): JsonResponse
    {
        try {
            $resultado = $this->pagoProveedorService->registrarPago(
                proveedorId: (int) $request->validated('proveedor_id'),
                userId:  $request->user()->id,
                monto: number_format((float) $request->validated('monto'), 2, '.', ''),
                medioPago: MedioPago::from($request->validated('medio_pago'))
            );

            return response()->json([
                'success' => true,
                'message' => 'Pago a proveedor registrado exitosamente.',
                'data'    => [
                    'pago'      => new PagoProveedorResource($resultado['pago']),
                    'proveedor' => new ProveedorResource($resultado['proveedor']),
                ],
            ], 201);
        } catch (FondosInsuficientesException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'detalle' => $e->getDetalle(),
            ], 422);
        } catch (PagoProveedorException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado.',
            ], 404);
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado al procesar el pago al proveedor. Por favor, intente nuevamente.',
            ], 500);
        }
    }
}
