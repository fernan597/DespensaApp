<?php

namespace App\Http\Controllers;

use App\Exceptions\CajaCerradaException;
use App\Exceptions\FondosInsuficientesException;
use App\Http\Requests\StoreMovimientoCajaRequest;
use App\Http\Resources\MovimientoCajaResource;
use App\Services\MovimientoCajaService;
use Illuminate\Http\JsonResponse;
use InvalidArgumentException;
use Throwable;

class MovimientoCajaController extends Controller
{
    public function __construct(
        protected MovimientoCajaService $movimientoCajaService
    ) {}

    /**
     * Registra un movimiento manual de caja (INGRESO o EGRESO) [CU16].
     *
     * POST /api/caja/movimientos
     */
    public function store(StoreMovimientoCajaRequest $request): JsonResponse
    {
        try {
            $resultado = $this->movimientoCajaService->registrarMovimientoManual(
                userId: $request->user()->id,
                monto: number_format((float) $request->validated('monto'), 2, '.', ''),
                tipo: $request->validated('tipo'),
                concepto: $request->validated('concepto')
            );

            return response()->json([
                'success' => true,
                'message' => 'Movimiento de caja registrado exitosamente.',
                'data'    => new MovimientoCajaResource($resultado['movimiento']),
            ], 201);
        } catch (CajaCerradaException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (FondosInsuficientesException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'detalle' => $e->getDetalle(),
            ], 422);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Ocurrió un error inesperado al registrar el movimiento de caja.',
            ], 500);
        }
    }
}
