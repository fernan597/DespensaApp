import { formatCurrency, formatDateTime } from "../../../utils/formatters";

/**
 * Tabla cronológica de extracto de movimientos de cuenta corriente.
 *
 * @param {Object} props
 * @param {Array} props.movimientos
 * @param {Object} [props.periodo]
 * @param {boolean} [props.tieneFiltrosActivos=false]
 * @param {boolean} [props.loading=false]
 */
export function ExtractoMovimientosTable({
    movimientos = [],
    periodo,
    tieneFiltrosActivos = false,
    loading = false,
}) {
    if (loading) {
        return (
            <div className="py-12 text-center text-sm text-on-surface-variant flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                    progress_activity
                </span>
                Cargando extracto de movimientos...
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/30 overflow-hidden shadow-sm">
            {/* Indicador de Saldo Anterior si aplica */}
            {periodo?.saldo_anterior !== undefined && tieneFiltrosActivos && (
                <div className="bg-surface-container px-4 py-2 border-b border-outline-variant/20 flex justify-between items-center text-xs">
                    <span className="text-on-surface-variant font-semibold uppercase tracking-wider">
                        Saldo Anterior al período
                    </span>
                    <span className="font-bold text-on-surface">
                        {formatCurrency(periodo.saldo_anterior)}
                    </span>
                </div>
            )}

            {movimientos.length === 0 ? (
                <div className="p-8 text-center text-sm text-on-surface-variant flex flex-col items-center gap-2">
                    <span className="material-symbols-outlined text-outline text-[40px]">
                        receipt
                    </span>
                    <p>No se encontraron movimientos registrados en este período.</p>
                </div>
            ) : (
                <div className="overflow-x-auto max-h-[380px]">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant uppercase tracking-wider sticky top-0 z-10">
                            <tr>
                                <th className="p-3 font-semibold">Fecha y Hora</th>
                                <th className="p-3 font-semibold">Concepto / Comprobante</th>
                                <th className="p-3 font-semibold text-center">Tipo</th>
                                <th className="p-3 font-semibold text-right">Monto</th>
                                <th className="p-3 font-semibold text-right">Saldo Acumulado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20">
                            {movimientos.map((m) => {
                                const esDebito = m.tipo_movimiento === "DEBITO";
                                return (
                                    <tr
                                        key={m.id}
                                        className="hover:bg-surface-container-low transition-colors"
                                    >
                                        <td className="p-3 text-on-surface font-mono text-[11px] whitespace-nowrap">
                                            {formatDateTime(m.fecha)}
                                        </td>
                                        <td className="p-3 text-on-surface font-medium">
                                            {m.concepto}
                                        </td>
                                        <td className="p-3 text-center whitespace-nowrap">
                                            <span
                                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                    esDebito
                                                        ? "bg-error-container text-on-error-container"
                                                        : "bg-secondary-fixed text-on-secondary-fixed"
                                                }`}
                                            >
                                                {esDebito ? "+ DÉBITO" : "- CRÉDITO"}
                                            </span>
                                        </td>
                                        <td
                                            className={`p-3 text-right font-bold whitespace-nowrap ${
                                                esDebito ? "text-error" : "text-secondary"
                                            }`}
                                        >
                                            {esDebito ? "+ " : "- "}
                                            {formatCurrency(m.monto)}
                                        </td>
                                        <td className="p-3 text-right font-bold text-on-surface whitespace-nowrap font-mono">
                                            {formatCurrency(m.saldo_acumulado)}
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
