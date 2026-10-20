import { useState, useEffect, useCallback } from "react";
import { getCuentasCorrientesClientes } from "../../../services/cuentaCorrienteClienteService";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Custom Hook para gestionar el listado y KPIs de cuentas corrientes de clientes con paginación.
 */
export function useCuentaCorrienteCliente() {
    const [clientes, setClientes] = useState([]);
    const [kpis, setKpis] = useState({
        total_deuda_global: 0,
        cantidad_clientes_con_deuda: 0,
        cantidad_clientes_al_dia: 0,
        total_clientes: 0,
    });
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: 0,
        to: 0,
    });
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [search, setSearch] = useState("");
    const [estadoFiltro, setEstadoFiltro] = useState("todos"); // "todos" | "con_deuda" | "al_dia"
    const [loading, setLoading] = useState(true);
    const [selectedClienteId, setSelectedClienteId] = useState(null);
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [selectedClienteCobro, setSelectedClienteCobro] = useState(null);
    const [isCobroModalOpen, setIsCobroModalOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState(null);

    // Cuando cambia el filtro de búsqueda o el estado, reiniciamos a la página 1
    const handleSearchChange = (val) => {
        setSearch(val);
        setPage(1);
    };

    const handleEstadoChange = (val) => {
        setEstadoFiltro(val);
        setPage(1);
    };

    const fetchCuentasCorrientes = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getCuentasCorrientesClientes({
                search: search.trim() || undefined,
                estado: estadoFiltro,
                page,
                per_page: perPage,
            });
            if (data) {
                setClientes(data.clientes || []);
                if (data.kpis) setKpis(data.kpis);
                if (data.pagination) setPagination(data.pagination);
            }
        } catch (error) {
            console.error("Error al cargar cuentas corrientes de clientes:", error);
        } finally {
            setLoading(false);
        }
    }, [search, estadoFiltro, page, perPage]);

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

    const handleOpenCobro = (cliente) => {
        setSelectedClienteCobro(cliente);
        setIsCobroModalOpen(true);
    };

    const handleCloseCobro = () => {
        setIsCobroModalOpen(false);
        setSelectedClienteCobro(null);
    };

    const handleCobroExitoso = (response) => {
        fetchCuentasCorrientes();
        const clienteNom = response?.data?.cliente?.nombre_completo || "el cliente";
        const monto = response?.data?.cobro?.monto;
        setToastMessage(`Cobro de ${formatCurrency(monto)} registrado exitosamente para ${clienteNom}.`);
    };

    return {
        clientes,
        kpis,
        pagination,
        page,
        setPage,
        perPage,
        setPerPage,
        loading,
        search,
        setSearch: handleSearchChange,
        estadoFiltro,
        setEstadoFiltro: handleEstadoChange,
        selectedClienteId,
        isHistoryModalOpen,
        handleOpenHistory,
        handleCloseHistory,
        selectedClienteCobro,
        isCobroModalOpen,
        handleOpenCobro,
        handleCloseCobro,
        handleCobroExitoso,
        toastMessage,
        setToastMessage,
        reload: fetchCuentasCorrientes,
    };
}
