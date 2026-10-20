import { apiFetch } from "./api";

/**
 * Registra una compra de mercadería a un proveedor.
 * El backend incrementa stock, actualiza costos y, según el tipo de pago,
 * genera el egreso de caja (CONTADO) o el débito en la cuenta corriente (CREDITO).
 *
 * @param {{
 *   proveedor_id: number,
 *   tipo_pago: "CONTADO"|"CREDITO",
 *   numero_comprobante?: string|null,
 *   items: Array<{ producto_id: number, cantidad: number, costo_unitario: number }>
 * }} payload
 * @returns {{ message: string, compra: object }}
 */
export async function registrarCompra(payload) {
    const data = await apiFetch("/compras", {
        method: "POST",
        body: JSON.stringify(payload),
    });
    return data;
}
