import { apiFetch } from "./api";

/**
 * Obtiene el estado actual de la caja (abierta/cerrada).
 * @returns {{ caja_abierta: boolean, caja: object|null }}
 */
export async function getCajaEstado() {
    const data = await apiFetch("/caja/estado");
    return data;
}

/**
 * Abre un nuevo turno de caja.
 * @param {number} saldoInicial - Dinero inicial en caja.
 * @returns {{ message: string, caja: object }}
 */
export async function abrirCaja(saldoInicial) {
    const data = await apiFetch("/caja/abrir", {
        method: "POST",
        body: JSON.stringify({ saldo_inicial: saldoInicial }),
    });
    return data;
}

/**
 * Cierra el turno activo de caja con arqueo de efectivo.
 * @param {number} saldoFinal - Dinero contado físicamente al cierre.
 * @returns {{ message: string, resumen: object }}
 */
export async function cerrarCaja(saldoFinal) {
    const data = await apiFetch("/caja/cerrar", {
        method: "POST",
        body: JSON.stringify({ saldo_final: saldoFinal }),
    });
    return data;
}

/**
 * Obtiene el historial de cajas cerradas (solo admin_despensa).
 * @returns {{ cajas: object }}
 */
export async function getHistorialCajas() {
    const data = await apiFetch("/cajas");
    return data.cajas;
}
