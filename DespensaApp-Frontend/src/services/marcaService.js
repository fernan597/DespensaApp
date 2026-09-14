import { apiFetch } from "./api";

export async function getMarcas() {
    try {
        const data = await apiFetch("/marcas");
        return data.marcas;
    } catch (error) {
        console.error("Error al obtener marcas:", error);
        throw error;
    }
}

export async function createMarca(marcaData) {
    try {
        const response = await apiFetch("/marcas", {
            method: "POST",
            body: JSON.stringify(marcaData),
        });
        return response.marca;
    } catch (error) {
        console.error("Error al crear marca:", error);
        throw error;
    }
}

export async function deleteMarca(id) {
    try {
        const response = await apiFetch(`/marcas/${id}`, {
            method: "DELETE",
        });
        return response;
    } catch (error) {
        console.error("Error al eliminar marca:", error);
        throw error;
    }
}
