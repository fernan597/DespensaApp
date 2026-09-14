import { apiFetch } from "./api";

export async function getProducts() {
    try {
        const data = await apiFetch("/products");
        return data.products;
    } catch (error) {
        console.error("Error al obtener productos:", error);
        throw error;
    }
}

export async function createProduct(productData) {
    try {
        const response = await apiFetch("/products", {
            method: "POST",
            body: JSON.stringify(productData),
        });
        return response.product;
    } catch (error) {
        console.error("Error al crear producto:", error);
        throw error;
    }
}

export async function deleteProduct(id) {
    try {
        const response = await apiFetch(`/products/${id}`, {
            method: "DELETE",
        })
        return response;
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        throw error;
    }
}