import { apiFetch } from "./api";

/**
 * Obtiene el listado de clientes con soporte para búsqueda.
 *
 * @param {string} search - Término de búsqueda opcional (nombre, apellido, teléfono)
 * @returns {Promise<Array>} Lista de clientes
 */
export async function getClientes(search = "") {
    try {
        const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
        const data = await apiFetch(`/clientes${query}`);
        return data.clientes ?? [];
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        throw error;
    }
}
