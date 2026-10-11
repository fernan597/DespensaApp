import { useState, useEffect, useCallback } from "react";
import { Modal } from "../../../components/ui/Modal";
import { getDetalleCuentaCorrienteProveedor } from "../../../services/cuentaCorrienteProveedorService";
import { formatCurrency } from "../../../utils/formatters";
import { DateRangeFilter } from "../../cuentas-corrientes-common/components/DateRangeFilter";
import { ExtractoMovimientosTable } from "../../cuentas-corrientes-common/components/ExtractoMovimientosTable";

/**
 * Modal para visualizar el historial cronológico de movimientos de cuenta corriente de un proveedor.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {number|null} proveedorId - ID del proveedor seleccionado
 */
export function DetalleMovimientosProveedor({ isOpen, onClose, proveedorId }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filtros de fecha
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const fetchHistorial = useCallback(async (filters = {}) => {
        if (!proveedorId) return;
        try {
            setLoading(true);
            setError(null);
            const res = await getDetalleCuentaCorrienteProveedor(proveedorId, filters);
            setData(res);
        } catch (err) {
            console.error("Error al cargar historial de movimientos:", err);
            setError("No se pudo cargar el historial de movimientos.");
        } finally {
            setLoading(false);
        }
    }, [proveedorId]);

    // Cargar historial al abrir el modal o cambiar de proveedor
    useEffect(() => {
        if (isOpen && proveedorId) {
            setFechaDesde("");
            setFechaHasta("");
            fetchHistorial();
        } else {
            setData(null);
            setError(null);
        }
    }, [isOpen, proveedorId, fetchHistorial]);

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

    const proveedor = data?.proveedor;
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
                    <span>Historial de Cuenta Corriente</span>
                </div>
            }
            maxWidth="max-w-4xl"
        >
            <div className="flex flex-col gap-4">
                {/* ── Encabezado informativo del Proveedor ── */}
                {proveedor && (
                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-on-surface">
                                    {proveedor.razon_social}
                                </h3>
                                <span
                                    className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                                        proveedor.saldo_adeudado > 0
                                            ? "bg-error-container text-on-error-container"
                                            : "bg-secondary-container text-on-secondary-container"
                                    }`}
                                >
                                    {proveedor.saldo_adeudado > 0 ? "Saldo Deudor" : "Al Día"}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant mt-1">
                                {proveedor.telefono && (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">phone</span>
                                        {proveedor.telefono}
                                    </span>
                                )}
                                {proveedor.direccion && (
                                    <span className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px]">location_on</span>
                                        {proveedor.direccion}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Saldo adeudado actual */}
                        <div className="bg-surface-container-lowest px-4 py-2 rounded-xl border border-outline-variant/30 text-right shrink-0">
                            <p className="text-xs text-on-surface-variant font-medium uppercase">
                                Saldo Pendiente Actual
                            </p>
                            <p
                                className={`text-xl font-bold ${
                                    proveedor.saldo_adeudado > 0 ? "text-error" : "text-primary"
                                }`}
                            >
                                {formatCurrency(proveedor.saldo_adeudado)}
                            </p>
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

                {/* ── Footer del Modal ── */}
                <div className="flex justify-end pt-2 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md transition-all text-xs"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
