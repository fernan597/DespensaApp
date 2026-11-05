import { apiFetch } from "./api";

/**
 * [CU18] Obtiene el reporte agregado de ventas para el rango de fechas indicado.
 *
 * @param {{ fecha_desde?: string, fecha_hasta?: string }} [params={}]
 * @returns {Promise<{
 *   periodo: { fecha_desde: string, fecha_hasta: string, dias: number },
 *   resumen: { total_facturado: number, cantidad_ventas: number, ticket_promedio: number, total_contado: number, total_credito: number },
 *   serie_diaria: Array<{ fecha: string, etiqueta: string, total: number, contado: number, credito: number, cantidad_ventas: number }>,
 *   por_medio_pago: Array<{ id: string, label: string, monto: number, cantidad: number, porcentaje: number }>
 * }>}
 */
export async function getReporteVentas(params = {}) {
    const query = new URLSearchParams();
    if (params.fecha_desde) query.append("fecha_desde", params.fecha_desde);
    if (params.fecha_hasta) query.append("fecha_hasta", params.fecha_hasta);

    const qs = query.toString() ? `?${query.toString()}` : "";
    const response = await apiFetch(`/reportes/ventas${qs}`);
    return response?.data ?? null;
}

/**
 * [CU18] Obtiene el ranking de productos más vendidos en el rango de fechas indicado.
 *
 * @param {{ fecha_desde?: string, fecha_hasta?: string, limit?: number }} [params={}]
 * @returns {Promise<{
 *   periodo: { fecha_desde: string, fecha_hasta: string },
 *   resumen: { total_unidades_top: number, total_recaudado_top: number, cantidad_productos: number },
 *   productos: Array<{ ranking: number, producto_id: number, nombre: string, codigo_barra: string, categoria: string, cantidad_vendida: number, total_recaudado: number, frecuencia_ventas: number }>
 * }>}
 */
export async function getReporteMasVendidos(params = {}) {
    const query = new URLSearchParams();
    if (params.fecha_desde) query.append("fecha_desde", params.fecha_desde);
    if (params.fecha_hasta) query.append("fecha_hasta", params.fecha_hasta);
    if (params.limit) query.append("limit", String(params.limit));

    const qs = query.toString() ? `?${query.toString()}` : "";
    const response = await apiFetch(`/reportes/mas-vendidos${qs}`);
    return response?.data ?? null;
}

