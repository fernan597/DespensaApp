import { useState, useEffect, useCallback, useMemo } from "react";
import { getProducts, deleteProduct } from "../../../services/productService";
import { getCategories } from "../../../services/categoryService";
import { getMarcas } from "../../../services/marcaService";

/**
 * Custom Hook para gestionar el estado, metadatos y operaciones de productos.
 */
export function useProducts() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [marcas, setMarcas] = useState([]);

    // Cargar metadatos (categorías y marcas)
    const fetchMetadata = useCallback(async () => {
        try {
            const [cats, brs] = await Promise.all([
                getCategories().catch(() => []),
                getMarcas().catch(() => []),
            ]);
            setCategories(Array.isArray(cats) ? cats : []);
            setMarcas(Array.isArray(brs) ? brs : []);
        } catch (error) {
            console.error("Error al cargar categorías o marcas:", error);
        }
    }, []);

    // Cargar productos
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            const productList = Array.isArray(data) ? data : data?.products || [];
            setProducts(productList);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar metadatos y catálogo una única vez al montar
    useEffect(() => {
        fetchMetadata();
        fetchProducts();
    }, [fetchMetadata, fetchProducts]);

    // Eliminar producto con confirmación
    const removeProduct = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return false;

        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
            return true;
        } catch (error) {
            alert(error.message || "Error al eliminar el producto");
            return false;
        }
    };

    // Búsqueda instantánea en memoria (0ms de latencia, sin peticiones de red)
    const filteredProducts = useMemo(() => {
        if (!search.trim()) return products;
        const q = search.toLowerCase();
        return products.filter((p) =>
            (p.nombre && p.nombre.toLowerCase().includes(q)) ||
            (p.codigo_barra && p.codigo_barra.toLowerCase().includes(q)) ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(q)) ||
            (p.marca?.nombre && p.marca.nombre.toLowerCase().includes(q))
        );
    }, [products, search]);

    return {
        products: filteredProducts,
        rawProducts: products,
        loading,
        search,
        setSearch,
        categories,
        marcas,
        fetchProducts,
        fetchMetadata,
        removeProduct,
    };
}
