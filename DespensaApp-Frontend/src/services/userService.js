import { apiFetch } from "./api";

/**
 * Obtiene la lista de usuarios desde la API.
 */
export async function fetchUsers() {
    try {
        const data = await apiFetch("/users");

        // Laravel puede devolver una colección indexada como objeto si se usó where()
        const rawUsers = data.users || [];
        const usersList = Array.isArray(rawUsers) ? rawUsers : Object.values(rawUsers);

        return usersList;
    } catch (error) {
        console.error("Error al obtener usuarios:", error);
        throw error;
    }
}

/**
 * Envía la petición para crear un nuevo usuario.
 * Si el backend aún no tiene el endpoint POST /users implementado (404/405),
 * se simula la creación para permitir pruebas completas en el frontend.
 */
export async function createUser(userData) {
    try {
        const data = await apiFetch("/users", {
            method: "POST",
            body: JSON.stringify(userData),
        });

        return data.user || data;
    } catch (error) {
        throw error;
    }
}

export async function deleteUser(id) {
    try {
        const data = await apiFetch(`/users/${id}`, {
            method: "DELETE",
        });

        return data;
    } catch (error) {
        console.error("Error al eliminar usuario:", error);
        throw error;
    }
}