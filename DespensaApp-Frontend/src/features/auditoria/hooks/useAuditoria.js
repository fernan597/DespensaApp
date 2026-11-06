import { useState, useEffect, useCallback, useRef } from "react";
import {
    getAuditorias,
    getAuditoriaFiltros,
    getAuditoria,
} from "../../../services/auditoriaService";

const FILTROS_INICIALES = {
    search: "",
    accion: "",
    userId: "",
    fechaDesde: "",
    fechaHasta: "",
};

const PER_PAGE = 20;

/**
 * Hook de gestión de la bitácora de auditoría: filtros, paginación y detalle.
 */
export function useAuditoria() {
    const [logs, setLogs] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        per_page: PER_PAGE,
        total: 0,
        from: 0,
        to: 0,
    });
    const [catalogos, setCatalogos] = useState({ usuarios: [], acciones: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filtros, setFiltros] = useState(FILTROS_INICIALES);
    const [filtrosAplicados, setFiltrosAplicados] = useState(FILTROS_INICIALES);
    const [page, setPage] = useState(1);

    const [selected, setSelected] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loadingDetalle, setLoadingDetalle] = useState(false);

    const debounceRef = useRef(null);
    const firstSearchRender = useRef(true);

    const loadAuditorias = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getAuditorias({
                search: filtrosAplicados.search,
                accion: filtrosAplicados.accion,
                user_id: filtrosAplicados.userId,
                fecha_desde: filtrosAplicados.fechaDesde,
                fecha_hasta: filtrosAplicados.fechaHasta,
                page,
                per_page: PER_PAGE,
            });

            setLogs(Array.isArray(response?.data) ? response.data : []);
            setMeta(
                response?.meta ?? {
                    current_page: 1,
                    last_page: 1,
                    per_page: PER_PAGE,
                    total: 0,
                    from: 0,
                    to: 0,
                }
            );
        } catch (err) {
            console.error("Error al cargar la auditoría:", err);
            setLogs([]);
            setError(
                err?.message ||
                    "No se pudo cargar la bitácora de auditoría. Intente nuevamente."
            );
        } finally {
            setLoading(false);
        }
    }, [filtrosAplicados, page]);

    useEffect(() => {
        loadAuditorias();
    }, [loadAuditorias]);

    useEffect(() => {
        let cancelado = false;

        getAuditoriaFiltros()
            .then((response) => {
                if (cancelado) return;
                setCatalogos({
                    usuarios: response?.data?.usuarios ?? [],
                    acciones: response?.data?.acciones ?? [],
                });
            })
            .catch((err) => {
                console.error("Error al cargar los filtros de auditoría:", err);
            });

        return () => {
            cancelado = true;
        };
    }, []);

    // Búsqueda con debounce: aplica solo el término de texto.
    useEffect(() => {
        if (firstSearchRender.current) {
            firstSearchRender.current = false;
            return;
        }

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(() => {
            setFiltrosAplicados((prev) => ({ ...prev, search: filtros.search }));
            setPage(1);
        }, 350);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [filtros.search]);

    const cambiarFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    };

    const aplicarFiltros = () => {
        setFiltrosAplicados({ ...filtros });
        setPage(1);
    };

    const limpiarFiltros = () => {
        setFiltros(FILTROS_INICIALES);
        setFiltrosAplicados(FILTROS_INICIALES);
        setPage(1);
    };

    const abrirDetalle = async (log) => {
        setSelected(log);
        setIsModalOpen(true);
        setLoadingDetalle(true);

        try {
            const response = await getAuditoria(log.id);
            if (response?.data) setSelected(response.data);
        } catch (err) {
            console.error("Error al cargar el detalle de auditoría:", err);
        } finally {
            setLoadingDetalle(false);
        }
    };

    const cerrarDetalle = () => {
        setIsModalOpen(false);
        setSelected(null);
    };

    const hayFiltrosActivos = Object.values(filtrosAplicados).some(Boolean);

    return {
        logs,
        meta,
        catalogos,
        loading,
        error,
        filtros,
        hayFiltrosActivos,
        selected,
        isModalOpen,
        loadingDetalle,
        cambiarFiltro,
        aplicarFiltros,
        limpiarFiltros,
        cambiarPagina: setPage,
        loadAuditorias,
        abrirDetalle,
        cerrarDetalle,
    };
}
