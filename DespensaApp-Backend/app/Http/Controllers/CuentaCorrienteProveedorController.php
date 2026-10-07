<?php

namespace App\Http\Controllers;

use App\Models\MovimientoCuentaCorrienteProveedor;
use App\Models\Proveedor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CuentaCorrienteProveedorController extends Controller
{
    /**
     * Listado consolidado de cuentas corrientes de proveedores con KPIs globales y filtros.
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $estado = $request->query('estado', 'todos'); // todos, con_deuda, al_dia

        // Consulta base de proveedores activos
        $query = Proveedor::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('razon_social', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")
                  ->orWhere('direccion', 'like', "%{$search}%");
            });
        }

        if ($estado === 'con_deuda') {
            $query->where('saldo_adeudado', '>', 0);
        } elseif ($estado === 'al_dia') {
            $query->where('saldo_adeudado', '<=', 0);
        }

        // Ordenar primero los que tienen mayor deuda
        $proveedores = $query->withCount('movimientosCuentaCorriente as total_movimientos')
            ->withMax('movimientosCuentaCorriente as ultimo_movimiento_at', 'created_at')
            ->orderByDesc('saldo_adeudado')
            ->orderBy('razon_social')
            ->get();

        // KPIs Globales calculados sobre todos los proveedores
        $todosProveedores = Proveedor::all();
        $totalDeudaGlobal = (float) $todosProveedores->sum('saldo_adeudado');
        $conDeudaCount = $todosProveedores->where('saldo_adeudado', '>', 0)->count();
        $alDiaCount = $todosProveedores->where('saldo_adeudado', '<=', 0)->count();

        $formatedProveedores = $proveedores->map(function (Proveedor $p) {
            $saldo = (float) $p->saldo_adeudado;
            return [
                'id'                   => $p->id,
                'razon_social'         => $p->razon_social,
                'telefono'             => $p->telefono,
                'direccion'            => $p->direccion,
                'saldo_adeudado'       => $saldo,
                'estado_cuenta'        => $saldo > 0 ? 'DEUDOR' : 'AL_DIA',
                'activo'               => (bool) ($p->activo ?? true),
                'total_movimientos'    => (int) ($p->total_movimientos ?? 0),
                'ultimo_movimiento_at' => $p->ultimo_movimiento_at ? (string) $p->ultimo_movimiento_at : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'kpis' => [
                    'total_deuda_global'             => $totalDeudaGlobal,
                    'cantidad_proveedores_con_deuda' => $conDeudaCount,
                    'cantidad_proveedores_al_dia'    => $alDiaCount,
                    'total_proveedores'              => $todosProveedores->count(),
                ],
                'proveedores' => $formatedProveedores,
            ],
        ]);
    }

    /**
     * Detalle de cuenta corriente de un proveedor específico y su historial de movimientos cronológico.
     */
    public function show(Request $request, int|string $id): JsonResponse
    {
        $proveedor = Proveedor::find($id);

        if (!$proveedor) {
            return response()->json([
                'success' => false,
                'message' => 'Proveedor no encontrado.',
            ], 404);
        }

        $fechaDesde = $request->query('fecha_desde');
        $fechaHasta = $request->query('fecha_hasta');

        // 1. Calcular el saldo anterior a la fecha inicial si se envía fecha_desde
        $saldoAnterior = 0.00;
        if ($fechaDesde) {
            $debitosPrevios = (float) MovimientoCuentaCorrienteProveedor::where('proveedor_id', $proveedor->id)
                ->where('tipo_movimiento', 'DEBITO')
                ->whereDate('created_at', '<', $fechaDesde)
                ->sum('monto');

            $creditosPrevios = (float) MovimientoCuentaCorrienteProveedor::where('proveedor_id', $proveedor->id)
                ->where('tipo_movimiento', 'CREDITO')
                ->whereDate('created_at', '<', $fechaDesde)
                ->sum('monto');

            $saldoAnterior = $debitosPrevios - $creditosPrevios;
        }

        // 2. Obtener movimientos en el rango de fechas solicitado
        $movimientosQuery = MovimientoCuentaCorrienteProveedor::where('proveedor_id', $proveedor->id)
            ->with([
                'compra:id,numero_comprobante,total,tipo_pago,created_at',
                'pagoProveedor:id,monto,medio_pago,created_at',
            ])
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc');

        if ($fechaDesde) {
            $movimientosQuery->whereDate('created_at', '>=', $fechaDesde);
        }
        if ($fechaHasta) {
            $movimientosQuery->whereDate('created_at', '<=', $fechaHasta);
        }

        $movimientos = $movimientosQuery->get();

        // 3. Proyectar saldo acumulado secuencialmente
        $saldoAcumulado = $saldoAnterior;
        $movimientosFormateados = $movimientos->map(function (MovimientoCuentaCorrienteProveedor $m) use (&$saldoAcumulado) {
            $monto = (float) $m->monto;

            if ($m->tipo_movimiento === 'DEBITO') {
                $saldoAcumulado += $monto;
                $concepto = $m->compra
                    ? "Compra de mercadería #{$m->compra->id}" . ($m->compra->numero_comprobante ? " (Comp: {$m->compra->numero_comprobante})" : "")
                    : "Compra a crédito #{$m->compra_id}";
            } else {
                $saldoAcumulado -= $monto;
                $medio = $m->pagoProveedor?->medio_pago ?? 'EFECTIVO';
                $concepto = "Pago a proveedor ({$medio})";
            }

            return [
                'id'              => $m->id,
                'fecha'           => $m->created_at?->toDateTimeString(),
                'tipo_movimiento' => $m->tipo_movimiento,
                'monto'           => $monto,
                'saldo_acumulado' => round($saldoAcumulado, 2),
                'concepto'        => $concepto,
                'compra'          => $m->compra ? [
                    'id'                 => $m->compra->id,
                    'numero_comprobante' => $m->compra->numero_comprobante,
                    'total'              => (float) $m->compra->total,
                ] : null,
                'pago_proveedor'  => $m->pagoProveedor ? [
                    'id'         => $m->pagoProveedor->id,
                    'monto'      => (float) $m->pagoProveedor->monto,
                    'medio_pago' => $m->pagoProveedor->medio_pago,
                ] : null,
            ];
        });

        $saldoActual = (float) $proveedor->saldo_adeudado;

        return response()->json([
            'success' => true,
            'data'    => [
                'proveedor' => [
                    'id'             => $proveedor->id,
                    'razon_social'   => $proveedor->razon_social,
                    'telefono'       => $proveedor->telefono,
                    'direccion'      => $proveedor->direccion,
                    'saldo_adeudado' => $saldoActual,
                    'estado_cuenta'  => $saldoActual > 0 ? 'DEUDOR' : 'AL_DIA',
                    'activo'         => (bool) ($proveedor->activo ?? true),
                ],
                'periodo' => [
                    'fecha_desde'    => $fechaDesde,
                    'fecha_hasta'    => $fechaHasta,
                    'saldo_anterior' => round($saldoAnterior, 2),
                ],
                'movimientos' => $movimientosFormateados,
            ],
        ]);
    }
}
