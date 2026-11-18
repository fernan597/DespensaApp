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
        const response = await apiFetch(`/clientes${query}`);
        return response.data ?? [];
    } catch (error) {
        console.error("Error al obtener clientes:", error);
        throw error;
    }
}

export async function createCliente(clienteData) {
    try {
        const response = await apiFetch("/clientes", {
            method: "POST",
            body: JSON.stringify(clienteData),
        });
        return response.data;
    } catch (error) {
        console.error("Error al crear cliente:", error);
        throw error;
    }
}

export async function updateCliente(id, clienteData) {
    try {
        const response = await apiFetch(`/clientes/${id}`, {
            method: "PUT",
            body: JSON.stringify(clienteData),
        });
        return response.data;
    } catch (error) {
        console.error("Error al actualizar cliente:", error);
        throw error;
    }
}

export async function deleteCliente(id) {
    try {
        const response = await apiFetch(`/clientes/${id}`, {
            method: "DELETE",
        });
        return response;
    } catch (error) {
        console.error("Error al eliminar cliente:", error);
        throw error;
    }
}
