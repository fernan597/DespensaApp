import { Link } from "react-router-dom";
import { formatCurrency, formatDateTime } from "../../../utils/formatters";

/**
 * Tabla administrativa compacta con las últimas operaciones de venta registradas.
 */
export function RecentSalesTable({ ventas = [], loading = false }) {
    return (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs overflow-hidden flex flex-col justify-between">
            {/* Cabecera */}
            <div className="p-5 border-b border-outline-variant/25 flex items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                            receipt_long
                        </span>
                        <h3 className="text-base font-bold text-on-surface">
                            Últimas Ventas Registradas
                        </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        Registro cronológico de los últimos comprobantes emitidos en caja
                    </p>
                </div>

                <Link
                    to="/punto-de-venta"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-secondary-container/70 text-primary hover:bg-secondary-container text-xs font-semibold transition-colors shrink-0"
                >
                    <span className="material-symbols-outlined text-[16px]">
                        point_of_sale
                    </span>
                    <span>Ir al POS</span>
                </Link>
            </div>

            {/* Contenido de Tabla */}
            {loading ? (
                <div className="p-10 text-center text-xs text-on-surface-variant flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary text-[20px]">
                        progress_activity
                    </span>
                    Cargando operaciones recientes...
                </div>
            ) : ventas.length === 0 ? (
                <div className="p-10 text-center text-on-surface-variant space-y-1.5">
                    <span className="material-symbols-outlined text-outline text-[34px]">
                        receipt
                    </span>
                    <p className="text-sm font-semibold text-on-surface">
                        Aún no se registraron ventas
                    </p>
                    <p className="text-xs">
                        Las ventas realizadas desde el Punto de Venta aparecerán aquí en tiempo real.
                    </p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs sm:text-sm">
                        <thead className="bg-surface-container-low text-on-surface-variant text-[11px] uppercase tracking-wider font-bold border-b border-outline-variant/30">
                            <tr>
                                <th className="py-3 px-4">Comprobante</th>
                                <th className="py-3 px-4">Fecha y Hora</th>
                                <th className="py-3 px-4">Modalidad / Medio</th>
                                <th className="py-3 px-4 text-right">Importe Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {ventas.map((v) => {
                                const esCredito =
                                    v.tipo_venta === "CUENTA_CORRIENTE" ||
                                    v.medio_pago === "CREDITO";

                                return (
                                    <tr
                                        key={v.id}
                                        className="hover:bg-surface-container-low/60 transition-colors"
                                    >
                                        <td className="py-3 px-4 font-mono font-bold text-on-surface tabular-nums">
                                            #{String(v.id).padStart(4, "0")}
                                        </td>
                                        <td className="py-3 px-4 text-xs text-on-surface-variant whitespace-nowrap tabular-nums">
                                            {formatDateTime(v.created_at)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                    esCredito
                                                        ? "bg-amber-100 text-amber-900"
                                                        : "bg-secondary-container/80 text-primary"
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-[13px]">
                                                    {esCredito
                                                        ? "assignment_ind"
                                                        : "payments"}
                                                </span>
                                                {esCredito
                                                    ? "Cta. Corriente (Fiado)"
                                                    : v.medio_pago || "Contado"}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4 text-right font-mono font-bold text-on-surface tabular-nums whitespace-nowrap">
                                            {formatCurrency(v.total)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

