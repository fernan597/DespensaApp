import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
    getAlertasStockMinimo,
    STOCK_UPDATED_EVENT,
} from "../../../services/alertaStockService";

/**
 * Hook para consultar y mantener sincronizadas las alertas de stock mínimo (CU17).
 * Se actualiza automáticamente al cambiar de ruta o cuando se dispara STOCK_UPDATED_EVENT.
 */
export function useAlertasStock({ enabled = true } = {}) {
    const [alertas, setAlertas] = useState([]);
    const [totalAlertas, setTotalAlertas] = useState(0);
    const [agotados, setAgotados] = useState(0);
    const [bajoMinimo, setBajoMinimo] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const location = useLocation();

    const fetchAlertas = useCallback(async () => {
        if (!enabled) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getAlertasStockMinimo();
            setAlertas(data.products);
            setTotalAlertas(data.total_alertas);
            setAgotados(data.agotados);
            setBajoMinimo(data.bajo_minimo);
        } catch (err) {
            setError(err.message || "No se pudieron cargar las alertas de stock");
        } finally {
            setLoading(false);
        }
    }, [enabled]);

    // Refrescar al montar y al navegar entre secciones
    useEffect(() => {
        fetchAlertas();
    }, [fetchAlertas, location.pathname]);

    // Refrescar inmediatamente cuando ocurre una venta, compra o cambio en productos
    useEffect(() => {
        if (!enabled) return;
        const handleStockUpdated = () => {
            fetchAlertas();
        };
        window.addEventListener(STOCK_UPDATED_EVENT, handleStockUpdated);
        return () => {
            window.removeEventListener(STOCK_UPDATED_EVENT, handleStockUpdated);
        };
    }, [enabled, fetchAlertas]);

    return {
        alertas,
        totalAlertas,
        agotados,
        bajoMinimo,
        loading,
        error,
        fetchAlertas,
    };
}

