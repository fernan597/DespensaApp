import { apiFetch } from "./api";

export async function getProveedores() {
    try {
        const data = await apiFetch("/proveedores");
        return data.data;
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        throw error;
    }
}

export async function createProveedor(proveedorData) {
    try {
        const response = await apiFetch("/proveedores", {
            method: "POST",
            body: JSON.stringify(proveedorData),
        });
        return response.data;
    } catch (error) {
        console.error("Error al crear proveedor:", error);
        throw error;
    }
}

export async function updateProveedor(id, proveedorData) {
    try {
        const response = await apiFetch(`/proveedores/${id}`, {
            method: "PUT",
            body: JSON.stringify(proveedorData),
        });
        return response.data;
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        throw error;
    }
}

export async function deleteProveedor(id) {
    try {
        const response = await apiFetch(`/proveedores/${id}`, {
            method: "DELETE",
        });
        return response;
    } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        throw error;
    }
}
