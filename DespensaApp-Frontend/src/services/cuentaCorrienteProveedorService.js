import { apiFetch } from "./api";

/**
 * Obtiene el listado de cuentas corrientes de todos los proveedores con KPIs globales y filtros.
 *
 * @param {Object} [params={}]
 * @param {string} [params.search] - Búsqueda por nombre/contacto
 * @param {string} [params.estado] - "todos" | "con_deuda" | "al_dia"
 * @returns {Promise<{ kpis: Object, proveedores: Array }>}
 */
export async function getCuentasCorrientesProveedores(params = {}) {
    try {
        const query = new URLSearchParams();
        if (params.search) query.append("search", params.search);
        if (params.estado && params.estado !== "todos") query.append("estado", params.estado);

        const queryString = query.toString() ? `?${query.toString()}` : "";
        const response = await apiFetch(`/cc-proveedores${queryString}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener cuentas corrientes de proveedores:", error);
        throw error;
    }
}

/**
 * Obtiene el detalle de la cuenta corriente de un proveedor específico con su historial cronológico de movimientos.
 *
 * @param {number|string} proveedorId - ID del proveedor
 * @param {Object} [filters={}]
 * @param {string} [filters.fecha_desde] - Fecha inicial (YYYY-MM-DD)
 * @param {string} [filters.fecha_hasta] - Fecha final (YYYY-MM-DD)
 * @returns {Promise<{ proveedor: Object, periodo: Object, movimientos: Array }>}
 */
export async function getDetalleCuentaCorrienteProveedor(proveedorId, filters = {}) {
    try {
        const query = new URLSearchParams();
        if (filters.fecha_desde) query.append("fecha_desde", filters.fecha_desde);
        if (filters.fecha_hasta) query.append("fecha_hasta", filters.fecha_hasta);

        const queryString = query.toString() ? `?${query.toString()}` : "";
        const response = await apiFetch(`/cc-proveedores/${proveedorId}${queryString}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener detalle de CC para proveedor #${proveedorId}:`, error);
        throw error;
    }
}
