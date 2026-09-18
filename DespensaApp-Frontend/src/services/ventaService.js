import { apiFetch } from "./api";

/**
 * Registra una venta de contado.
 * IMPORTANTE: el precio_unitario NO se envía — el backend lo toma de la BD.
 *
 * @param {{ cliente_id: number|null, medio_pago: string, items: Array<{producto_id: number, cantidad: number}> }} payload
 * @returns {{ message: string, venta: object }}
 */
export async function registrarVentaContado(payload) {
    const data = await apiFetch("/ventas/contado", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return data;
}

/**
 * Obtiene el listado paginado de ventas con filtros opcionales.
 * @param {{ fecha_desde?: string, fecha_hasta?: string, cliente_id?: number }} filtros
 * @returns {{ ventas: object }}
 */
export async function getVentas(filtros = {}) {
    const params = new URLSearchParams();
    if (filtros.fecha_desde) params.append("fecha_desde", filtros.fecha_desde);
    if (filtros.fecha_hasta) params.append("fecha_hasta", filtros.fecha_hasta);
    if (filtros.cliente_id)  params.append("cliente_id",  filtros.cliente_id);

    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await apiFetch(`/ventas${query}`);
    return data.ventas;
}

/**
 * Obtiene el detalle completo de una venta por ID (para reimprimir ticket).
 * @param {number} id
 * @returns {{ venta: object }}
 */
export async function getVenta(id) {
    const data = await apiFetch(`/ventas/${id}`);
    return data.venta;
}
