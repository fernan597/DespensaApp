import { apiFetch } from "./api";

/**
 * Obtiene el listado de cuentas corrientes de todos los clientes con KPIs globales y filtros.
 *
 * @param {Object} [params={}]
 * @param {string} [params.search] - Búsqueda por nombre, apellido, teléfono o dirección
 * @param {string} [params.estado] - "todos" | "con_deuda" | "al_dia"
 * @returns {Promise<{ kpis: Object, clientes: Array }>}
 */
export async function getCuentasCorrientesClientes(params = {}) {
    try {
        const query = new URLSearchParams();
        if (params.search) query.append("search", params.search);
        if (params.estado && params.estado !== "todos") query.append("estado", params.estado);

        const queryString = query.toString() ? `?${query.toString()}` : "";
        const response = await apiFetch(`/cc-clientes${queryString}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener cuentas corrientes de clientes:", error);
        throw error;
    }
}

/**
 * Obtiene el detalle de la cuenta corriente de un cliente específico con su extracto cronológico secuencial.
 *
 * @param {number|string} clienteId - ID del cliente
 * @param {Object} [filters={}]
 * @param {string} [filters.fecha_desde] - Fecha inicial (YYYY-MM-DD)
 * @param {string} [filters.fecha_hasta] - Fecha final (YYYY-MM-DD)
 * @returns {Promise<{ cliente: Object, periodo: Object, movimientos: Array }>}
 */
export async function getDetalleCuentaCorrienteCliente(clienteId, filters = {}) {
    try {
        const query = new URLSearchParams();
        if (filters.fecha_desde) query.append("fecha_desde", filters.fecha_desde);
        if (filters.fecha_hasta) query.append("fecha_hasta", filters.fecha_hasta);

        const queryString = query.toString() ? `?${query.toString()}` : "";
        const response = await apiFetch(`/cc-clientes/${clienteId}${queryString}`);
        return response.data;
    } catch (error) {
        console.error(`Error al obtener detalle de CC para cliente #${clienteId}:`, error);
        throw error;
    }
}

export { registrarCobroCliente } from "./cobroClienteService";

