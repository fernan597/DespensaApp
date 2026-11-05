import { apiFetch } from "./api";

export const STOCK_UPDATED_EVENT = "despensa:stock-updated";

/**
 * Dispara un evento global para que el widget/badge de alertas de stock
 * se refresque automáticamente tras ventas, compras o ediciones de catálogo.
 */
export function notifyStockUpdated() {
    if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(STOCK_UPDATED_EVENT));
    }
}

/**
 * [CU17] Obtiene los productos con stock_actual <= stock_minimo
 * y las métricas de resumen (total_alertas, agotados, bajo_minimo).
 */
export async function getAlertasStockMinimo() {
    try {
        const data = await apiFetch("/alertas/stock-minimo");
        return {
            total_alertas: data.total_alertas ?? 0,
            agotados: data.agotados ?? 0,
            bajo_minimo: data.bajo_minimo ?? 0,
            products: data.products ?? [],
        };
    } catch (error) {
        console.error("Error al obtener alertas de stock mínimo:", error);
        throw error;
    }
}

