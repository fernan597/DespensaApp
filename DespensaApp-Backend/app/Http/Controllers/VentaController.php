<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreVentaContadoRequest;
use App\Models\AlertaStock;
use App\Models\Caja;
use App\Models\DetalleVenta;
use App\Models\MovimientoCaja;
use App\Models\Product;
use App\Models\Venta;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VentaController extends Controller
{
    /**
     * POST /api/ventas/contado
     *
     * Registra una venta de contado en una transacción atómica.
     *
     * Pasos dentro de la transacción:
     *  1. Verifica que exista una caja abierta.
     *  2. Bloquea filas de productos para evitar race conditions (lockForUpdate).
     *  3. Valida stock suficiente para cada ítem; si falla, hace rollback.
     *  4. Crea la cabecera de la Venta.
     *  5. Crea cada DetalleVenta usando el precio desde la BD (no del request).
     *  6. Decrementa el stock de cada producto.
     *  7. Genera AlertaStock si el stock quedó en mínimo o por debajo.
     *  8. Si el medio de pago es EFECTIVO, genera un MovimientoCaja de ingreso.
     */
    public function storeContado(StoreVentaContadoRequest $request): JsonResponse
    {
        // 1. Verificar caja abierta antes de iniciar la transacción
        $caja = Caja::abierta()->first();

        if (! $caja) {
            return response()->json([
                'message' => 'No hay caja abierta. Abra la caja antes de registrar una venta.',
            ], 422);
        }

        try {
            $venta = DB::transaction(function () use ($request, $caja) {

                $items     = $request->items;
                $total     = 0;
                $productos = [];

                // 2 y 3. Bloquear filas y verificar stock
                foreach ($items as $item) {
                    $producto = Product::lockForUpdate()->findOrFail($item['producto_id']);

                    if ($producto->stock_actual < $item['cantidad']) {
                        throw new \Exception(
                            "Stock insuficiente para '{$producto->nombre}'. " .
                            "Disponible: {$producto->stock_actual}, solicitado: {$item['cantidad']}."
                        );
                    }

                    $productos[] = [
                        'modelo'   => $producto,
                        'cantidad' => (int) $item['cantidad'],
                    ];

                    $total += $producto->precio_venta * $item['cantidad'];
                }

                // 4. Crear la cabecera de la venta
                $venta = Venta::create([
                    'user_id'    => request()->user()->id,
                    'cliente_id' => $request->cliente_id ?? null,
                    'total'      => round($total, 2),
                    'tipo_venta' => 'CONTADO',
                    'medio_pago' => $request->medio_pago,
                    'estado'     => 'COMPLETADA',
                ]);

                foreach ($productos as $item) {
                    $producto = $item['modelo'];
                    $cantidad = $item['cantidad'];

                    // 5. Crear detalle (precio tomado de la BD, nunca del request)
                    DetalleVenta::create([
                        'venta_id'        => $venta->id,
                        'product_id'      => $producto->id,
                        'cantidad'        => $cantidad,
                        'precio_unitario' => $producto->precio_venta,
                        'subtotal'        => round($producto->precio_venta * $cantidad, 2),
                    ]);

                    // 6. Decrementar stock
                    $producto->decrement('stock_actual', $cantidad);
                    $producto->refresh();

                    // 7. Alerta de stock mínimo
                    if ($producto->stock_actual <= $producto->stock_minimo) {
                        AlertaStock::create([
                            'product_id' => $producto->id,
                            'mensaje'    => "Stock bajo: '{$producto->nombre}' tiene {$producto->stock_actual} unidad(es) disponible(s).",
                            'atendida'   => false,
                        ]);
                    }
                }

                // 8. Movimiento de caja solo si pagó en efectivo
                if ($request->medio_pago === 'EFECTIVO') {
                    MovimientoCaja::create([
                        'caja_id'  => $caja->id,
                        'monto'    => round($total, 2),
                        'tipo'     => 'INGRESO_VENTA',
                        'concepto' => "Venta #" . $venta->id,
                        'venta_id' => $venta->id,
                    ]);
                }

                return $venta;
            });

            // Cargar relaciones para la respuesta
            $venta->load([
                'user:id,name',
                'cliente:id,nombre,apellido',
                'detalles.producto:id,nombre,codigo_barra',
            ]);

            return response()->json([
                'message' => 'Venta registrada correctamente.',
                'venta'   => $venta,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/ventas
     *
     * Listado paginado de ventas con filtros opcionales de fecha y cliente.
     *
     * Query params opcionales:
     *   - fecha_desde (Y-m-d)
     *   - fecha_hasta (Y-m-d)
     *   - cliente_id
     */
    public function index(Request $request): JsonResponse
    {
        $query = Venta::with([
            'user:id,name',
            'cliente:id,nombre,apellido',
        ])->latest();

        if ($request->filled('fecha_desde') && $request->filled('fecha_hasta')) {
            $query->whereBetween('created_at', [
                $request->fecha_desde . ' 00:00:00',
                $request->fecha_hasta . ' 23:59:59',
            ]);
        }

        if ($request->filled('cliente_id')) {
            $query->where('cliente_id', $request->cliente_id);
        }

        $ventas = $query->paginate(20);

        return response()->json([
            'ventas' => $ventas,
        ], 200);
    }

    /**
     * GET /api/ventas/{id}
     *
     * Detalle completo de una venta para reimprimir ticket o consulta.
     */
    public function show(int $id): JsonResponse
    {
        $venta = Venta::with([
            'user:id,name',
            'cliente:id,nombre,apellido',
            'detalles.producto:id,nombre,codigo_barra',
        ])->find($id);

        if (! $venta) {
            return response()->json([
                'message' => 'Venta no encontrada.',
            ], 404);
        }

        return response()->json([
            'venta' => $venta,
        ], 200);
    }
}
