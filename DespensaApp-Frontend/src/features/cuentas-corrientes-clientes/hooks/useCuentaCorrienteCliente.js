import { useState, useEffect, useCallback } from "react";
import { getCuentasCorrientesClientes } from "../../../services/cuentaCorrienteClienteService";

/**
 * Custom Hook para gestionar el listado y KPIs de cuentas corrientes de clientes.
 */
export function useCuentaCorrienteCliente() {
    const [clientes, setClientes] = useState([]);
    const [kpis, setKpis] = useState({
        total_deuda_global: 0,
        cantidad_clientes_con_deuda: 0,
        cantidad_clientes_al_dia: 0,
        total_clientes: 0,
    });
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos"); // "todos" | "con_deuda" | "al_dia"
    const [loading, setLoading] = useState(true);
    const [selectedClienteId, setSelectedClienteId] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

    const fetchCuentasCorrientes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCuentasCorrientesClientes({
                search: search.trim() || undefined,
                estado: estadoFiltro,
            });
            if (data) {
                setClientes(data.clientes || []);
                if (data.kpis) setKpis(data.kpis);
            }
        } catch (error) {
            console.error("Error al cargar cuentas corrientes de clientes:", error);
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

    const handleOpenHistory = (clienteId) => {
        setSelectedClienteId(clienteId);
        setIsHistoryModalOpen(true);
    };

    const handleCloseHistory = () => {
        setIsHistoryModalOpen(false);
        setSelectedClienteId(null);
    };

    return {
        clientes,
        kpis,
        loading,
        search,
        setSearch,
        estadoFiltro,
        setEstadoFiltro,
        selectedClienteId,
        isHistoryModalOpen,
        handleOpenHistory,
        handleCloseHistory,
        reload: fetchCuentasCorrientes,
    };
}
