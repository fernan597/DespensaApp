import { apiFetch } from "./api";

/**
 * Registra una venta de contado.
 * IMPORTANTE: el precio_unitario NO se envía — el backend lo toma de la BD.
 *
 * @param {{ cliente_id: number|null, medio_pago: string, items: Array<{producto_id: number, cantidad: number}> }} payload
 * @returns {Promise<{ message: string, venta: object }>}
 */
export async function registrarVentaContado(payload) {
    const data = await apiFetch("/ventas/contado", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return data;
}

/**
 * Registra una venta a crédito (fiado).
 * Requiere obligatoriamente un cliente_id.
 *
 * @param {{ cliente_id: number, items: Array<{producto_id: number, cantidad: number}> }} payload
 * @returns {Promise<{ message: string, venta: object }>}
 */
export async function registrarVentaCredito(payload) {
    const data = await apiFetch("/ventas/credito", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return data;
}

/**
 * Obtiene el listado de ventas.
 *
 * @returns {Promise<Array<object>>}
 */
export async function getVentas() {
    const data = await apiFetch("/ventas");
    return data?.data ?? [];
}

/**
 * Obtiene el detalle de una venta por ID.
 *
 * @param {number|string} id
 * @returns {Promise<object|null>}
 */
export async function getVenta(id) {
    const data = await apiFetch(`/ventas/${id}`);
    return data?.data ?? null;
}
