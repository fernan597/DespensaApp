import { apiFetch } from "./api";

/**
 * Registra un cobro o entrega de dinero de un cliente para cancelar deuda de cuenta corriente (CU12).
 *
 * @param {Object} payload
 * @param {number} payload.cliente_id
 * @param {number} payload.monto
 * @param {string} payload.medio_pago - "EFECTIVO" | "TRANSFERENCIA" | "DEBITO" | "CREDITO"
 * @returns {Promise<{ success: boolean, message: string, data: Object }>}
 */
export async function registrarCobroCliente(payload) {
    try {
        const response = await apiFetch("/cobros-clientes", {
            method: "POST",
            body: JSON.stringify(payload),
        });
        return response;
    } catch (error) {
        console.error("Error al registrar cobro a cliente:", error);
        throw error;
    }
}
