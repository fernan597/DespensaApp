<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\MovimientoCuentaCorrienteCliente;
use App\Services\CuentaCorrienteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CuentaCorrienteClienteController extends Controller
{
    public function __construct(
        protected CuentaCorrienteService $cuentaCorrienteService
    ) {}

    /**
     * Listado consolidado de cuentas corrientes de clientes con KPIs globales y filtros.
     *
     * GET /api/cc-clientes
     */
    public function index(Request $request): JsonResponse
    {
        $search = $request->query('search');
        $estado = $request->query('estado', 'todos'); // todos, con_deuda, al_dia

        $query = Cliente::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('apellido', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%")
                  ->orWhere('direccion', 'like', "%{$search}%");
            });
        }

        if ($estado === 'con_deuda') {
            $query->where('saldo_cuenta_corriente', '>', 0);
        } elseif ($estado === 'al_dia') {
            $query->where('saldo_cuenta_corriente', '<=', 0);
        }

        // Ordenar primero los clientes con mayor deuda acumulada
        $clientes = $query->withCount('movimientosCuentaCorriente as total_movimientos')
            ->withMax('movimientosCuentaCorriente as ultimo_movimiento_at', 'created_at')
            ->orderByDesc('saldo_cuenta_corriente')
            ->orderBy('nombre')
            ->orderBy('apellido')
            ->get();

        // KPIs Globales calculados mediante el servicio centralizado
        $todosClientes = Cliente::all();
        $kpis = $this->cuentaCorrienteService->calcularKpis($todosClientes, 'saldo_cuenta_corriente');

        $formatedClientes = $clientes->map(function (Cliente $c) {
            $saldo = (float) $c->saldo_cuenta_corriente;
            return [
                'id'                     => $c->id,
                'nombre'                 => $c->nombre,
                'apellido'               => $c->apellido,
                'nombre_completo'        => trim("{$c->nombre} {$c->apellido}"),
                'telefono'               => $c->telefono,
                'direccion'              => $c->direccion,
                'saldo_cuenta_corriente' => $saldo,
                'estado_cuenta'          => $saldo > 0 ? 'DEUDOR' : 'AL_DIA',
                'total_movimientos'      => (int) ($c->total_movimientos ?? 0),
                'ultimo_movimiento_at'   => $c->ultimo_movimiento_at ? (string) $c->ultimo_movimiento_at : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => [
                'kpis' => [
                    'total_deuda_global'          => $kpis['total_deuda_global'],
                    'cantidad_clientes_con_deuda' => $kpis['cantidad_con_deuda'],
                    'cantidad_clientes_al_dia'    => $kpis['cantidad_al_dia'],
                    'total_clientes'              => $kpis['total'],
                ],
                'clientes' => $formatedClientes,
            ],
        ]);
    }

    /**
     * Detalle de cuenta corriente de un cliente específico con extracto cronológico secuencial.
     *
     * GET /api/cc-clientes/{id}
     */
    public function show(Request $request, int|string $id): JsonResponse
    {
        $cliente = Cliente::find($id);

        if (!$cliente) {
            return response()->json([
                'success' => false,
                'message' => 'Cliente no encontrado.',
            ], 404);
        }

        $fechaDesde = $request->query('fecha_desde');
        $fechaHasta = $request->query('fecha_hasta');

        // 1. Calcular el saldo anterior a la fecha inicial mediante el servicio
        $saldoAnterior = $this->cuentaCorrienteService->calcularSaldoAnterior(
            MovimientoCuentaCorrienteCliente::class,
            'cliente_id',
            $cliente->id,
            $fechaDesde
        );

        // 2. Obtener movimientos en el rango de fechas solicitado
        $movimientosQuery = MovimientoCuentaCorrienteCliente::where('cliente_id', $cliente->id)
            ->with([
                'venta:id,total,tipo_venta,medio_pago,created_at',
                'cobroCliente:id,monto,medio_pago,created_at',
            ])
            ->orderBy('created_at', 'asc')
            ->orderBy('id', 'asc');

        $this->cuentaCorrienteService->aplicarFiltroFechas($movimientosQuery, $fechaDesde, $fechaHasta);

        $movimientos = $movimientosQuery->get();

        // 3. Proyectar saldo acumulado secuencialmente
        $movimientosFormateados = $this->cuentaCorrienteService->proyectarMovimientos(
            $movimientos,
            $saldoAnterior,
            function (MovimientoCuentaCorrienteCliente $m, float $saldoAcumulado) {
                $monto = (float) $m->monto;

                if ($m->tipo_movimiento === 'DEBITO') {
                    $concepto = $m->venta
                        ? "Venta a crédito #{$m->venta->id}"
                        : "Compra fiada a crédito";
                } else {
                    $medio = $m->cobroCliente?->medio_pago ?? 'EFECTIVO';
                    $concepto = "Pago recibido ({$medio})";
                }

                return [
                    'id'              => $m->id,
                    'fecha'           => $m->created_at?->toDateTimeString(),
                    'tipo_movimiento' => $m->tipo_movimiento,
                    'monto'           => $monto,
                    'saldo_acumulado' => $saldoAcumulado,
                    'concepto'        => $concepto,
                    'venta'           => $m->venta ? [
                        'id'         => $m->venta->id,
                        'total'      => (float) $m->venta->total,
                        'tipo_venta' => $m->venta->tipo_venta,
                        'medio_pago' => $m->venta->medio_pago,
                    ] : null,
                    'cobro_cliente'   => $m->cobroCliente ? [
                        'id'         => $m->cobroCliente->id,
                        'monto'      => (float) $m->cobroCliente->monto,
                        'medio_pago' => $m->cobroCliente->medio_pago,
                    ] : null,
                ];
            }
        );

        $saldoActual = (float) $cliente->saldo_cuenta_corriente;

        return response()->json([
            'success' => true,
            'data'    => [
                'cliente' => [
                    'id'                     => $cliente->id,
                    'nombre'                 => $cliente->nombre,
                    'apellido'               => $cliente->apellido,
                    'nombre_completo'        => trim("{$cliente->nombre} {$cliente->apellido}"),
                    'telefono'               => $cliente->telefono,
                    'direccion'              => $cliente->direccion,
                    'saldo_cuenta_corriente' => $saldoActual,
                    'estado_cuenta'          => $saldoActual > 0 ? 'DEUDOR' : 'AL_DIA',
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
