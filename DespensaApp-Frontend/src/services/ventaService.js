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


export async function getVentas(filtros = {}) {
    //traer todas las ventas y aplicarle los filtros si se envian
}


export async function getVenta(id) {
    // obtener una venta por id

}
