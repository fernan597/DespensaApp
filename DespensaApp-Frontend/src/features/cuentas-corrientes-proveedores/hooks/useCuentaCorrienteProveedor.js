import { useState, useEffect, useCallback, useMemo } from "react";
import { getCuentasCorrientesProveedores } from "../../../services/cuentaCorrienteProveedorService";

/**
 * Custom Hook para gestionar el listado y KPIs de cuentas corrientes de proveedores.
 */
export function useCuentaCorrienteProveedor() {
    const [proveedores, setProveedores] = useState([]);
    const [kpis, setKpis] = useState({
        total_deuda_global: 0,
        cantidad_proveedores_con_deuda: 0,
        cantidad_proveedores_al_dia: 0,
        total_proveedores: 0,
    });
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos"); // "todos" | "con_deuda" | "al_dia"
    const [loading, setLoading] = useState(true);
    const [selectedProveedorId, setSelectedProveedorId] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const fetchCuentasCorrientes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCuentasCorrientesProveedores({
                search: search.trim() || undefined,
                estado: estadoFiltro,
            });
            if (data) {
                setProveedores(data.proveedores || []);
                if (data.kpis) setKpis(data.kpis);
            }
        } catch (error) {
            console.error("Error al cargar cuentas corrientes:", error);
        } finally {
            setLoading(false);
        }
    }, [search, estadoFiltro]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCuentasCorrientes();
        }, 200);
        return () => clearTimeout(timer);
    }, [fetchCuentasCorrientes]);

    const handleOpenHistory = (proveedorId) => {
        setSelectedProveedorId(proveedorId);
        setIsHistoryModalOpen(true);
    };

    const handleCloseHistory = () => {
        setIsHistoryModalOpen(false);
        setSelectedProveedorId(null);
    };

    return {
        proveedores,
        kpis,
        loading,
        search,
        setSearch,
        estadoFiltro,
        setEstadoFiltro,
        selectedProveedorId,
        isHistoryModalOpen,
        handleOpenHistory,
        handleCloseHistory,
        reload: fetchCuentasCorrientes,
    };
}
