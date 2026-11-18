import { useState, useEffect, useCallback, useMemo } from "react";
import { getClientes, deleteCliente } from "../../../services/clienteService";

/**
 * Custom Hook para gestionar el estado y operaciones de clientes.
 */
export function useClientes() {
    const [clientes, setClientes] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchClientes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getClientes();
            setClientes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al cargar clientes:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchClientes();
    }, [fetchClientes]);

    const removeCliente = async (id) => {
        try {
            await deleteCliente(id);
            setClientes((prev) => prev.filter((c) => c.id !== id));
            return { success: true };
        } catch (error) {
            const msg =
                error.data?.message ||
                error.message ||
                (error.status === 409
                    ? "No se puede eliminar: el cliente registra saldo adeudado o tiene registros asociados."
                    : "Error al eliminar el cliente.");
            return { success: false, message: msg };
        }
    };

    // Búsqueda instantánea en memoria
    const filteredClientes = useMemo(() => {
        if (!search.trim()) return clientes;
        const q = search.toLowerCase();
        return clientes.filter(
            (c) =>
                (c.nombre && c.nombre.toLowerCase().includes(q)) ||
                (c.apellido && c.apellido.toLowerCase().includes(q)) ||
                (c.nombre_completo && c.nombre_completo.toLowerCase().includes(q)) ||
                (c.telefono && c.telefono.toLowerCase().includes(q)) ||
                (c.direccion && c.direccion.toLowerCase().includes(q))
        );
    }, [clientes, search]);

    // KPI: suma de todos los saldos adeudados en cuenta corriente
    const totalSaldoAdeudado = useMemo(
        () => clientes.reduce((acc, c) => acc + (parseFloat(c.saldo_cuenta_corriente) || 0), 0),
        [clientes]
    );

    return {
        clientes: filteredClientes,
        rawClientes: clientes,
        loading,
        search,
        setSearch,
        fetchClientes,
        removeCliente,
        totalSaldoAdeudado,
    };
}
