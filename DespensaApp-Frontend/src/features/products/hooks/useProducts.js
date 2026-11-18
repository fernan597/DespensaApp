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


    const fetchCategorias = useCallback(async () => {
        try {
            const response = await getCategories();
            setCategories(response);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
        }
    }, []);

    const fetchMarcas = useCallback(async () => {
        try {
            const response = await getMarcas();
            setMarcas(response);
        } catch (error) {
            console.error("Error al cargar marcas:", error);
        }
    }, []);

    // Cargar productos
    const fetchProducts = useCallback(async () => {
        try {
            setLoading(true);
            const response = await getProducts();
            setProducts(response || []);
        } catch (error) {
            console.error("Error al cargar productos:", error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar metadatos y catálogo una única vez al montar
    useEffect(() => {
        fetchCategorias();
        fetchMarcas();
        fetchProducts();
    }, [fetchCategorias, fetchMarcas, fetchProducts]);

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
        const list = Array.isArray(products) ? products : [];
        if (!search.trim()) return list;
        const q = search.toLowerCase();
        return list.filter((p) =>
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
        fetchCategorias,
        fetchMarcas,
        removeProduct,
    };
}
