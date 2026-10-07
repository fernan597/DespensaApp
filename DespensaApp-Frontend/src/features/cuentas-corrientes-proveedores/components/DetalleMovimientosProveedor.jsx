import { useState, useEffect, useCallback } from "react";
import { Modal } from "../../../components/ui/Modal";
import { getDetalleCuentaCorrienteProveedor } from "../../../services/cuentaCorrienteProveedorService";

/**
 * Formatea un número como moneda ARS ($ 1.250,00).
 */
const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(num);
};

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
            <form
                onSubmit={handleApplyFilters}
                className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 flex flex-wrap items-end gap-3 text-xs"
            >
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-on-surface-variant font-medium mb-1">
                        Desde:
                    </label>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                    />
                </div>

                <div className="flex-1 min-w-[140px]">
                    <label className="block text-on-surface-variant font-medium mb-1">
                        Hasta:
                    </label>
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="w-full bg-surface border border-outline-variant/50 rounded-lg px-3 py-1.5 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary text-xs"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-1 bg-primary text-on-primary px-3.5 py-1.5 rounded-lg font-medium hover:bg-primary-container hover:text-on-primary-container transition-all active:scale-95 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                        Filtrar
                    </button>

                    {tieneFiltrosActivos && (
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            disabled={loading}
                            className="flex items-center gap-1 bg-surface-container text-on-surface-variant px-3 py-1.5 rounded-lg hover:bg-surface-container-high transition-all"
                            title="Limpiar rango de fechas"
                        >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                            Limpiar
                        </button>
                    )}
                </div>
            </form>

            {/* ── Alerta de saldo anterior si hay filtro de fecha ── */}
            {periodo?.fecha_desde && (
                <div className="flex items-center justify-between bg-surface-container-high px-4 py-2 rounded-lg text-xs text-on-surface-variant">
                    <span>
                        Saldo acumulado anterior al <strong>{periodo.fecha_desde}</strong>:
                    </span>
                    <span className="font-semibold text-on-surface">
                        {formatCurrency(periodo.saldo_anterior)}
                    </span>
                </div>
            )}

            {/* ── Tabla de Movimientos ── */}
            <div className="border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-surface-container-low text-on-surface-variant sticky top-0 uppercase tracking-wider font-semibold border-b border-outline-variant/20 z-10">
                            <tr>
                                <th className="px-3 py-2.5">Fecha</th>
                                <th className="px-3 py-2.5">Tipo Operación</th>
                                <th className="px-3 py-2.5">Concepto / Ref.</th>
                                <th className="px-3 py-2.5 text-right">Monto</th>
                                <th className="px-3 py-2.5 text-right">Saldo Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/10 text-on-surface">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-on-surface-variant">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="material-symbols-outlined animate-spin text-[28px] text-primary">
                                                progress_activity
                                            </span>
                                            <span>Cargando movimientos...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-error">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className="material-symbols-outlined">error</span>
                                            <span>{error}</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : movimientos.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-10 text-on-surface-variant">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="material-symbols-outlined text-[32px] text-outline-variant">
                                                receipt
                                            </span>
                                            <p className="font-medium">Sin movimientos registrados</p>
                                            <p className="text-[11px]">
                                                {tieneFiltrosActivos
                                                    ? "No se encontraron operaciones en el rango de fechas seleccionado."
                                                    : "Este proveedor aún no posee compras a crédito ni pagos registrados."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                movimientos.map((mov) => {
                                    const esDebito = mov.tipo_movimiento === "DEBITO";
                                    return (
                                        <tr
                                            key={mov.id}
                                            className="hover:bg-surface-container-low/50 transition-colors"
                                        >
                                            <td className="px-3 py-2.5 whitespace-nowrap text-on-surface-variant font-mono">
                                                {mov.fecha || "—"}
                                            </td>
                                            <td className="px-3 py-2.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                                                        esDebito
                                                            ? "bg-error-container/70 text-on-error-container"
                                                            : "bg-secondary-container text-on-secondary-container"
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">
                                                        {esDebito ? "shopping_bag" : "payments"}
                                                    </span>
                                                    {esDebito ? "Compra a Crédito (DÉBITO)" : "Pago Realizado (CRÉDITO)"}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2.5 max-w-xs truncate text-on-surface" title={mov.concepto}>
                                                {mov.concepto}
                                            </td>
                                            <td
                                                className={`px-3 py-2.5 text-right font-semibold whitespace-nowrap ${
                                                    esDebito ? "text-error" : "text-primary"
                                                }`}
                                            >
                                                {esDebito ? "+" : "-"} {formatCurrency(mov.monto)}
                                            </td>
                                            <td className="px-3 py-2.5 text-right font-bold whitespace-nowrap text-on-surface font-mono">
                                                {formatCurrency(mov.saldo_acumulado)}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </Modal>
    );
}
