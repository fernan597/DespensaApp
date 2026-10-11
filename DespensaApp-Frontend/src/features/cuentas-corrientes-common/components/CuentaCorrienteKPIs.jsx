import { formatCurrency } from "../../../utils/formatters";

/**
 * Tarjetas de métricas consolidadas (KPIs) para cuentas corrientes (Proveedores y Clientes).
 *
 * @param {Object} props
 * @param {Object} props.kpis
 * @param {number} props.kpis.total_deuda_global
 * @param {number} props.kpis.cantidad_con_deuda
 * @param {number} props.kpis.cantidad_al_dia
 * @param {number} props.kpis.total
 * @param {boolean} [props.loading=false]
 * @param {string} [props.deudaLabel="Deuda Total Acumulada"]
 * @param {string} [props.conDeudaLabel="Con Saldo Deudor"]
 * @param {string} [props.alDiaLabel="Cuentas al Día"]
 * @param {string} [props.totalLabel="Total Registrados"]
 * @param {string} [props.totalIcon="group"]
 */
export function CuentaCorrienteKPIs({
    kpis = {},
    loading = false,
    deudaLabel = "Deuda Total Acumulada",
    conDeudaLabel = "Con Saldo Deudor",
    alDiaLabel = "Cuentas al Día",
    totalLabel = "Total Registrados",
    totalIcon = "group",
}) {
    const totalDeuda = Number(kpis.total_deuda_global) || 0;
    const conDeuda = kpis.cantidad_con_deuda ?? 0;
    const alDia = kpis.cantidad_al_dia ?? 0;
    const total = kpis.total ?? 0;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Deuda Global */}
            <div
                className={`rounded-2xl border shadow-sm p-5 flex items-center gap-4 bg-surface-container-lowest ${
                    totalDeuda > 0 ? "border-error/30" : "border-outline-variant/30"
                }`}
            >
                <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        totalDeuda > 0 ? "bg-error-container" : "bg-secondary-container"
                    }`}
                >
                    <span
                        className={`material-symbols-outlined text-[24px] ${
                            totalDeuda > 0 ? "text-on-error-container" : "text-on-secondary-container"
                        }`}
                    >
                        payments
                    </span>
                </div>
                <div>
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                        {deudaLabel}
                    </p>
                    <p
                        className={`text-xl font-bold ${
                            totalDeuda > 0 ? "text-error" : "text-primary"
                        }`}
                    >
                        {loading ? "—" : formatCurrency(totalDeuda)}
                    </p>
                </div>
            </div>

            {/* Entidades con Deuda */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-error-container/60 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-error text-[24px]">
                        warning
                    </span>
                </div>
                <div>
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                        {conDeudaLabel}
                    </p>
                    <p className="text-xl font-bold text-on-surface">
                        {loading ? "—" : conDeuda}
                    </p>
                </div>
            </div>

            {/* Entidades al Día */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                        check_circle
                    </span>
                </div>
                <div>
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                        {alDiaLabel}
                    </p>
                    <p className="text-xl font-bold text-primary">
                        {loading ? "—" : alDia}
                    </p>
                </div>
            </div>

            {/* Total Entidades */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-on-surface-variant text-[24px]">
                        {totalIcon}
                    </span>
                </div>
                <div>
                    <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                        {totalLabel}
                    </p>
                    <p className="text-xl font-bold text-on-surface">
                        {loading ? "—" : total}
                    </p>
                </div>
            </div>
        </div>
    );
}
