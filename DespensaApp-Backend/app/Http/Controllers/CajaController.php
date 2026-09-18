<?php

namespace App\Http\Controllers;

use App\Http\Requests\AbrirCajaRequest;
use App\Http\Requests\CerrarCajaRequest;
use App\Http\Resources\CajaResource;
use App\Http\Resources\CajaResumenResource;
use App\Models\Caja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CajaController extends Controller
{
    /**
     * GET /api/caja/estado
     *
     * Informa el estado actual de la caja: abierta o cerrada.
     * Si está abierta, devuelve el resumen de ingresos, egresos y saldo esperado
     * formateado a través de CajaResource.
     * El frontend usa este endpoint para habilitar o deshabilitar el botón "Nueva Venta".
     */
    public function estado(Request $request): JsonResponse
    {
        $caja = Caja::abierta()
            ->with('usuarioApertura:id,name')
            ->first();

        if (! $caja) {
            return response()->json([
                'caja_abierta' => false,
                'caja'         => null,
            ], 200);
        }

        return response()->json([
            'caja_abierta' => true,
            'caja'         => new CajaResource($caja),
        ], 200);
    }

    /**
     * POST /api/caja/abrir
     *
     * Registra la apertura de un nuevo turno de caja.
     * Rechaza la operación si ya existe una caja abierta.
     */
    public function abrir(AbrirCajaRequest $request): JsonResponse
    {
        // Verificar si ya existe una caja abierta (sin guardar en variable,
        // ya que no necesitamos su ID en la respuesta de error, solo el hecho)
        if (Caja::abierta()->exists()) {
            return response()->json([
                'message' => 'Ya existe una caja abierta. Ciérrela antes de abrir una nueva.',
            ], 400);
        }

        try {
            $caja = Caja::create([
                'usuario_apertura_id' => $request->user()->id,
                'saldo_inicial'       => $request->saldo_inicial,
                'fecha_apertura'      => now(),
                'estado'              => 'ABIERTA',
            ]);

            $caja->load('usuarioApertura:id,name');

            return response()->json([
                'message' => 'Caja abierta correctamente.',
                'caja'    => new CajaResource($caja),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al abrir la caja.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/caja/cerrar
     *
     * Cierra el turno activo con arqueo de efectivo.
     * Calcula: saldo esperado, diferencia entre lo contado y lo esperado.
     * Diferencia = 0 → cuadrada. Positivo → sobrante. Negativo → faltante.
     * Formatea la respuesta a través de CajaResumenResource.
     */
    public function cerrar(CerrarCajaRequest $request): JsonResponse
    {
        $caja = Caja::abierta()->first();

        if (! $caja) {
            return response()->json([
                'message' => 'No hay ninguna caja abierta para cerrar.',
            ], 404);
        }

        $totalIngresos = $caja->totalIngresos();
        $totalEgresos  = $caja->totalEgresos();
        $saldoEsperado = $caja->saldoEsperado();
        $saldoFinal    = (float) $request->saldo_final;
        $diferencia    = round($saldoFinal - $saldoEsperado, 2);

        $caja->update([
            'usuario_cierre_id' => $request->user()->id,
            'fecha_cierre'      => now(),
            'saldo_final'       => $saldoFinal,
            'estado'            => 'CERRADA',
        ]);

        $caja->load('usuarioCierre:id,name');

        $resumen = [
            'saldo_inicial'         => round((float) $caja->saldo_inicial, 2),
            'total_ingresos'        => round($totalIngresos, 2),
            'total_egresos'         => round($totalEgresos, 2),
            'saldo_esperado'        => round($saldoEsperado, 2),
            'saldo_final_declarado' => $saldoFinal,
            'diferencia'            => $diferencia,
        ];

        return response()->json([
            'message' => 'Caja cerrada correctamente.',
            'resumen' => new CajaResumenResource($caja, $resumen),
        ], 200);
    }

    /**
     * GET /api/cajas
     *
     * Historial de cajas cerradas, accesible solo para admin_despensa.
     * Usa CajaResource::collection() para formatear la paginación completa.
     */
    public function index(): JsonResponse
    {
        $cajas = Caja::with(['usuarioApertura:id,name', 'usuarioCierre:id,name'])
            ->where('estado', 'CERRADA')
            ->latest()
            ->paginate(15);

        return response()->json([
            'cajas' => CajaResource::collection($cajas),
        ], 200);
    }
}
