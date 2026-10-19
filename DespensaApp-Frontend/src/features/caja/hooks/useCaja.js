import { useState, useEffect, useCallback } from "react";
import { getCajaEstado, abrirCaja, cerrarCaja, registrarMovimientoCaja } from "../../../services/cajaService";

/**
 * Hook central para gestionar el estado de la caja.
 * Consultado al montar para saber si hay caja abierta.
 * Expone handlers para abrir, cerrar y registrar movimientos en el turno.
 */
export function useCaja() {
    const [cajaAbierta, setCajaAbierta] = useState(false);
    const [caja, setCaja] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    /**
     * Consulta el endpoint GET /api/caja/estado y sincroniza el estado local.
     */
    const fetchEstado = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getCajaEstado();
            setCajaAbierta(data.caja_abierta);
            setCaja(data.caja ?? null);
        } catch (err) {
            setError(err.message || "Error al consultar el estado de la caja.");
        } finally {
            setLoading(false);
        }
    }, []);

    // Consulta el estado al montar el componente que use este hook
    useEffect(() => {
        fetchEstado();
    }, [fetchEstado]);

    /**
     * Abre un nuevo turno de caja.
     * @param {number} saldoInicial
     * @returns {boolean} true si se abrió correctamente
     */
    const handleAbrir = async (saldoInicial) => {
        try {
            setError(null);
            await abrirCaja(saldoInicial);
            await fetchEstado(); // Refresca el estado desde la API
            return true;
        } catch (err) {
            setError(err.message || "Error al abrir la caja.");
            return false;
        }
    };

    /**
     * Cierra el turno activo de caja.
     * @param {number} saldoFinal - Dinero contado físicamente
     * @returns {{ resumen: object }|null} El resumen del arqueo o null si falló
     */
    const handleCerrar = async (saldoFinal) => {
        try {
            setError(null);
            const data = await cerrarCaja(saldoFinal);
            await fetchEstado(); // Refresca el estado (caja pasa a null)
            return data.resumen;
        } catch (err) {
            setError(err.message || "Error al cerrar la caja.");
            return null;
        }
    };

    /**
     * Registra un movimiento manual de efectivo en la caja activa.
     * @param {{ tipo: "INGRESO"|"EGRESO", monto: number, concepto: string }} data
     * @returns {Promise<boolean>} true si se registró correctamente
     */
    const handleMovimiento = async (data) => {
        try {
            setError(null);
            await registrarMovimientoCaja(data);
            await fetchEstado(); // Refresca el estado y nuevo saldo esperado
            return true;
        } catch (err) {
            setError(err.message || "Error al registrar el movimiento de caja.");
            throw err;
        }
    };

    return {
        cajaAbierta,
        caja,
        loading,
        error,
        fetchEstado,
        handleAbrir,
        handleCerrar,
        handleMovimiento,
    };
}
