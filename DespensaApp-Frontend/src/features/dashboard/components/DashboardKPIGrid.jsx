import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Grilla superior de 4 KPIs financieros y operativos con estética contable/ERP.
 */
export function DashboardKPIGrid({
    metrics,
    loading = false,
    isAdminDespensa = false,
    totalAlertas = 0,
    agotados = 0,
}) {
    const { ventas, caja, ccClientes, ccProveedores, inventario } = metrics;

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {/* ── KPI 1: VENTAS DEL DÍA ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                            Facturación del Día
                        </p>
                        <p className="text-2xl font-bold text-primary font-mono tabular-nums mt-1">
                            {loading ? "—" : formatCurrency(ventas.hoyTotal)}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-secondary-container/80 text-primary flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">
                            payments
                        </span>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/25 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container font-semibold text-on-surface tabular-nums">
                            {loading ? "0" : ventas.hoyCount} op. hoy
                        </span>
                        <span className="truncate" title="Acumulado mensual">
                            Mes: <strong className="text-on-surface tabular-nums">{loading ? "—" : formatCurrency(ventas.mesTotal)}</strong>
                        </span>
                    </div>
                    <Link
                        to="/punto-de-venta"
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5 shrink-0"
                    >
                        <span>POS</span>
                        <span className="material-symbols-outlined text-[15px]">
                            chevron_right
                        </span>
                    </Link>
                </div>
            </div>

            {/* ── KPI 2: ESTADO Y LIQUIDEZ DE CAJA ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden">
                <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                        caja.abierta ? "bg-secondary" : "bg-error"
                    }`}
                />

                <div className="flex items-start justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                Caja Actual (Efectivo)
                            </p>
                            {!loading && (
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                                        caja.abierta
                                            ? "bg-secondary-container text-primary"
                                            : "bg-error-container text-on-error-container"
                                    }`}
                                >
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full ${
                                            caja.abierta ? "bg-primary" : "bg-error"
                                        }`}
                                    />
                                    {caja.abierta ? "Abierta" : "Cerrada"}
                                </span>
                            )}
                        </div>
                        <p className="text-2xl font-bold text-on-surface font-mono tabular-nums mt-1">
                            {loading
                                ? "—"
                                : caja.abierta
                                ? formatCurrency(caja.saldoEsperado)
                                : formatCurrency(0)}
                        </p>
                    </div>
                    <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                            caja.abierta
                                ? "bg-secondary-container/70 text-primary"
                                : "bg-error-container/70 text-on-error-container"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[22px]">
                            {caja.abierta ? "point_of_sale" : "lock"}
                        </span>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/25 flex items-center justify-between text-xs">
                    {caja.abierta ? (
                        <div className="flex items-center gap-3 text-on-surface-variant tabular-nums">
                            <span>
                                Ing:{" "}
                                <strong className="text-primary">
                                    +{formatCurrency(caja.ingresosTurno)}
                                </strong>
                            </span>
                            <span>
                                Egr:{" "}
                                <strong className="text-error">
                                    -{formatCurrency(caja.egresosTurno)}
                                </strong>
                            </span>
                        </div>
                    ) : (
                        <span className="text-on-surface-variant">
                            Sin turno activo · Abrí caja para operar
                        </span>
                    )}
                    <Link
                        to="/punto-de-venta"
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5 shrink-0"
                    >
                        <span>{caja.abierta ? "Arqueo" : "Abrir"}</span>
                        <span className="material-symbols-outlined text-[15px]">
                            chevron_right
                        </span>
                    </Link>
                </div>
            </div>

            {/* ── KPI 3: CUENTAS POR COBRAR (CLIENTES FIADO) ── */}
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden">
                <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                        ccClientes.totalDeuda > 0 ? "bg-amber-600" : "bg-primary"
                    }`}
                />

                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                            Cuentas por Cobrar (Clientes)
                        </p>
                        <p
                            className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                                ccClientes.totalDeuda > 0
                                    ? "text-on-surface"
                                    : "text-primary"
                            }`}
                        >
                            {loading ? "—" : formatCurrency(ccClientes.totalDeuda)}
                        </p>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">
                            contact_page
                        </span>
                    </div>
                </div>

                <div className="mt-4 pt-3 border-t border-outline-variant/25 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-on-surface-variant">
                        <span
                            className={`px-2 py-0.5 rounded-md font-semibold tabular-nums ${
                                ccClientes.conDeuda > 0
                                    ? "bg-amber-100 text-amber-900"
                                    : "bg-secondary-container text-primary"
                            }`}
                        >
                            {loading ? "—" : `${ccClientes.conDeuda} con deuda`}
                        </span>
                        <span className="tabular-nums">
                            de {loading ? "—" : ccClientes.total} clientes
                        </span>
                    </div>
                    <Link
                        to="/cuentas-corrientes-clientes"
                        className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5 shrink-0"
                    >
                        <span>Cobrar</span>
                        <span className="material-symbols-outlined text-[15px]">
                            chevron_right
                        </span>
                    </Link>
                </div>
            </div>

            {/* ── KPI 4: CUENTAS POR PAGAR (PROVEEDORES) O STOCK PARA EMPLEADO ── */}
            {isAdminDespensa ? (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden">
                    <div
                        className={`absolute top-0 left-0 right-0 h-1 ${
                            ccProveedores.totalDeuda > 0 ? "bg-error" : "bg-primary"
                        }`}
                    />

                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                Cuentas por Pagar (Proveedores)
                            </p>
                            <p
                                className={`text-2xl font-bold font-mono tabular-nums mt-1 ${
                                    ccProveedores.totalDeuda > 0
                                        ? "text-error"
                                        : "text-primary"
                                }`}
                            >
                                {loading
                                    ? "—"
                                    : formatCurrency(ccProveedores.totalDeuda)}
                            </p>
                        </div>
                        <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                                ccProveedores.totalDeuda > 0
                                    ? "bg-error-container/70 text-on-error-container"
                                    : "bg-secondary-container/70 text-primary"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                account_balance_wallet
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/25 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-on-surface-variant">
                            <span
                                className={`px-2 py-0.5 rounded-md font-semibold tabular-nums ${
                                    ccProveedores.conDeuda > 0
                                        ? "bg-error-container text-on-error-container"
                                        : "bg-secondary-container text-primary"
                                }`}
                            >
                                {loading
                                    ? "—"
                                    : `${ccProveedores.conDeuda} pendientes`}
                            </span>
                            <span className="tabular-nums">
                                de {loading ? "—" : ccProveedores.total} prov.
                            </span>
                        </div>
                        <Link
                            to="/admin/cuentas-corrientes-proveedores"
                            className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5 shrink-0"
                        >
                            <span>Pagar</span>
                            <span className="material-symbols-outlined text-[15px]">
                                chevron_right
                            </span>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between relative overflow-hidden">
                    <div
                        className={`absolute top-0 left-0 right-0 h-1 ${
                            totalAlertas > 0 ? "bg-error" : "bg-primary"
                        }`}
                    />

                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                Estado de Catálogo y Stock
                            </p>
                            <p className="text-2xl font-bold text-on-surface font-mono tabular-nums mt-1">
                                {loading ? "—" : `${inventario.totalProductos} art.`}
                            </p>
                        </div>
                        <div className="w-11 h-11 rounded-xl bg-secondary-container/70 text-primary flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[22px]">
                                inventory_2
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-outline-variant/25 flex items-center justify-between text-xs">
                        <span
                            className={`px-2 py-0.5 rounded-md font-semibold ${
                                totalAlertas > 0
                                    ? "bg-error-container text-on-error-container"
                                    : "bg-secondary-container text-primary"
                            }`}
                        >
                            {totalAlertas > 0
                                ? `${totalAlertas} alertas (${agotados} agotados)`
                                : "Stock en niveles óptimos"}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

