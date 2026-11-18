import { useState, useEffect, useCallback, useMemo } from "react";
import { getProveedores, deleteProveedor } from "../../../services/proveedorService";

/**
 * Custom Hook para gestionar el estado y operaciones de proveedores.
 */
export function useProveedores() {
    const [proveedores, setProveedores] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchProveedores = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProveedores();
            setProveedores(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al cargar proveedores:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProveedores();
    }, [fetchProveedores]);

    const removeProveedor = async (id) => {
        try {
            await deleteProveedor(id);
            setProveedores((prev) => prev.filter((p) => p.id !== id));
            return { success: true };
        } catch (error) {
            const msg =
                error.data?.message ||
                error.message ||
                (error.status === 409
                    ? "No se puede eliminar: el proveedor tiene compras o saldo registrado."
                    : "Error al eliminar el proveedor.");
            return { success: false, message: msg };
        }
    };

    // Búsqueda instantánea en memoria
    const filteredProveedores = useMemo(() => {
        if (!search.trim()) return proveedores;
        const q = search.toLowerCase();
        return proveedores.filter(
            (p) =>
                (p.razon_social && p.razon_social.toLowerCase().includes(q)) ||
                (p.telefono && p.telefono.toLowerCase().includes(q)) ||
                (p.direccion && p.direccion.toLowerCase().includes(q))
        );
    }, [proveedores, search]);

    // KPI: suma de todos los saldos adeudados
    const totalSaldoAdeudado = useMemo(
        () => proveedores.reduce((acc, p) => acc + (parseFloat(p.saldo_adeudado) || 0), 0),
        [proveedores]
    );

    return {
        proveedores: filteredProveedores,
        rawProveedores: proveedores,
        loading,
        search,
        setSearch,
        fetchProveedores,
        removeProveedor,
        totalSaldoAdeudado,
    };
}
