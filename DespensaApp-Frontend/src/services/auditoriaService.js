import { apiFetch } from "./api";

/**
 * Obtiene la bitácora de auditoría paginada y filtrada.
 *
 * @param {Object} params
 * @param {string} [params.search]
 * @param {string} [params.accion]
 * @param {string|number} [params.user_id]
 * @param {string} [params.fecha_desde]
 * @param {string} [params.fecha_hasta]
 * @param {number} [params.page]
 * @param {number} [params.per_page]
 */
export async function getAuditorias(params = {}) {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
            query.set(key, value);
        }
    });

    const queryString = query.toString();

    return apiFetch(`/auditorias${queryString ? `?${queryString}` : ""}`);
}

/**
 * Obtiene el catálogo de usuarios y acciones para los filtros.
 */
export async function getAuditoriaFiltros() {
    return apiFetch("/auditorias/filtros");
}

/**
 * Obtiene el detalle completo de un registro de auditoría.
 */
export async function getAuditoria(id) {
    return apiFetch(`/auditorias/${id}`);
}
