import { apiFetch } from "./api";
import { notifyStockUpdated } from "./alertaStockService";

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
        notifyStockUpdated();
        return response.product;
    } catch (error) {
        console.error("Error al crear producto:", error);
        throw error;
    }
}

export async function updateProduct(id, productData) {
    try {
        const response = await apiFetch(`/products/${id}`, {
            method: "PUT",
            body: JSON.stringify(productData),
        });
        notifyStockUpdated();
        return response.product;
    } catch (error) {
        console.error("Error al actualizar producto:", error);
        throw error;
    }
}

export async function deleteProduct(id) {
    try {
        const response = await apiFetch(`/products/${id}`, {
            method: "DELETE",
        })
        notifyStockUpdated();
        return response;
    } catch (error) {
        console.error("Error al eliminar producto:", error);
        throw error;
    }
}

/**
 * [CU06] Actualiza precios y márgenes de forma individual o masiva (por categoría/marca).
 */
export async function updateProductPrices(payload) {
    try {
        const response = await apiFetch("/products/precios", {
            method: "PUT",
            body: JSON.stringify(payload),
        });
        return response;
    } catch (error) {
        console.error("Error al actualizar precios:", error);
        throw error;
    }
}