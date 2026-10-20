import { apiFetch } from "./api";

/**
 * Registra un pago a proveedor para cancelar parte o la totalidad de la deuda pendiente (CU14).
 *
 * @param {Object} payload
 * @param {number} payload.proveedor_id
 * @param {number} payload.monto
 * @param {string} payload.medio_pago - "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO"
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export async function registrarPagoProveedor(payload) {
    try {
        const response = await apiFetch("/pagos-proveedores", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return response;
    } catch (error) {
        console.error("Error al registrar pago a proveedor:", error);
        throw error;
    }
}
