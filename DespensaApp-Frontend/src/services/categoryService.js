import { apiFetch } from "./api";

export async function getCategories() {

    try {
        const data = await apiFetch("/categories");
        return data.categories;
    } catch (error) {
        console.error("Error al obtener categorías:", error);
        throw error;
    }
}

export async function createCategory(categoryData) {
    try {
        const response = await apiFetch("/categories", {
            method: "POST",
            body: JSON.stringify(categoryData),
        });
        return response.category;
    } catch (error) {
        console.error("Error al crear categoría:", error);
        throw error;
    }
}

export async function deleteCategory(id) {
    try {
        const response = await apiFetch(`/categories/${id}`, {
            method: "DELETE",
        })
        return response;
    } catch (error) {
        console.error("Error al eliminar categoría:", error);
        throw error;
    }
}