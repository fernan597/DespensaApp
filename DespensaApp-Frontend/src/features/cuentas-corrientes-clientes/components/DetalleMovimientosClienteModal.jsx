import { useState, useEffect, useCallback } from "react";
import { Modal } from "../../../components/ui/Modal";
import { getDetalleCuentaCorrienteCliente } from "../../../services/cuentaCorrienteClienteService";
import { formatCurrency } from "../../../utils/formatters";
import { DateRangeFilter } from "../../cuentas-corrientes-common/components/DateRangeFilter";
import { ExtractoMovimientosTable } from "../../cuentas-corrientes-common/components/ExtractoMovimientosTable";

/**
 * Modal para visualizar el extracto cronológico secuencial de la cuenta corriente de un cliente.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   clienteId: number|null
 * }} props
 */
export function DetalleMovimientosClienteModal({ isOpen, onClose, clienteId, onOpenCobro }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtros de fecha
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const fetchHistorial = useCallback(async (filters = {}) => {
        if (!clienteId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getDetalleCuentaCorrienteCliente(clienteId, filters);
            setData(res);
        } catch (err) {
            console.error("Error al cargar historial de movimientos:", err);
            setError("No se pudo cargar el historial de movimientos.");
        } finally {
            setLoading(false);
        }
    }, [clienteId]);

    // Cargar historial al abrir el modal o cambiar de cliente
    useEffect(() => {
        if (isOpen && clienteId) {
            setFechaDesde("");
            setFechaHasta("");
            fetchHistorial();
        } else {
            setData(null);
            setError(null);
        }
    }, [isOpen, clienteId, fetchHistorial]);

    const handleApplyFilters = (e) => {
        e.preventDefault();
        fetchHistorial({
            fecha_desde: fechaDesde || undefined,
            fecha_hasta: fechaHasta || undefined,
        });
    };

    const handleClearFilters = () => {
        setFechaDesde("");
        setFechaHasta("");
        fetchHistorial({});
    };

    const cliente = data?.cliente;
    const movimientos = data?.movimientos || [];
    const periodo = data?.periodo;
    const tieneFiltrosActivos = Boolean(fechaDesde || fechaHasta);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                        receipt_long
                    </span>
                    <span>Extracto de Cuenta Corriente</span>
                </div>
            }
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col gap-4">
                {/* ── Encabezado informativo del Cliente ── */}
                {cliente && (
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-on-surface">
                                    {cliente.nombre_completo}
                                </h3>
                                <span
                                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                        cliente.saldo_cuenta_corriente > 0
                                            ? "bg-error-container text-on-error-container"
                                            : "bg-secondary-container text-on-secondary-container"
                                    }`}
                                >
                                    {cliente.saldo_cuenta_corriente > 0 ? "Saldo Deudor" : "Al Día"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-1">
                                {cliente.telefono && (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">phone</span>
                                        {cliente.telefono}
                                    </span>
                                )}
                                {cliente.direccion && (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        {cliente.direccion}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Saldo adeudado actual y Acción de Cobro */}
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/30 text-right">
                                <p className="text-xs text-on-surface-variant font-medium uppercase">
                                    Saldo Pendiente Actual
                                </p>
                                <p
                                    className={`text-xl font-bold ${
                                        cliente.saldo_cuenta_corriente > 0 ? "text-error" : "text-primary"
                                    }`}
                                >
                                    {formatCurrency(cliente.saldo_cuenta_corriente)}
                                </p>
                            </div>
                            {cliente.saldo_cuenta_corriente > 0 && onOpenCobro && (
                                <button
                                    type="button"
                                    onClick={() => onOpenCobro(cliente)}
                                    className="px-3.5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-on-primary font-semibold text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                >
                                    <span className="material-symbols-outlined text-[16px]">price_check</span>
                                    <span>Cobrar</span>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Barra de Filtros por Rango de Fechas ── */}
                <DateRangeFilter
                    fechaDesde={fechaDesde}
                    setFechaDesde={setFechaDesde}
                    fechaHasta={fechaHasta}
                    setFechaHasta={setFechaHasta}
                    onApply={handleApplyFilters}
                    onClear={handleClearFilters}
                    loading={loading}
                />

                {/* ── Mensaje de Error ── */}
                {error && (
                    <div className="p-3 bg-error-container/30 border border-error/30 rounded-xl text-xs text-error">
                        {error}
                    </div>
                )}

                {/* ── Tabla de Movimientos ── */}
                <ExtractoMovimientosTable
                    movimientos={movimientos}
                    periodo={periodo}
                    tieneFiltrosActivos={tieneFiltrosActivos}
                    loading={loading}
                />

                {/* ── Pie del modal ── */}
                <div className="flex justify-end pt-2 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container-high text-on-surface hover:bg-surface-container-highest transition-colors"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
