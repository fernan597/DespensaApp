import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";
import { useAlertasStock } from "../features/products/hooks/useAlertasStock";
import { useDashboardMetrics } from "../features/dashboard/hooks/useDashboardMetrics";
import { DashboardKPIGrid } from "../features/dashboard/components/DashboardKPIGrid";
import { SalesTrendCard } from "../features/dashboard/components/SalesTrendCard";
import { TopProductsChartPanel } from "../features/dashboard/components/TopProductsChartPanel";
import { InventoryHealthCard } from "../features/dashboard/components/InventoryHealthCard";
import { RecentSalesTable } from "../features/dashboard/components/RecentSalesTable";

const ROLE_DISPLAY = {
    admin_despensa: "Administrador General de Despensa",
    empleado: "Operador de Punto de Venta",
    admin: "Administrador de Sistema y Seguridad",
};

export function Dashboard() {
    const { user } = useAuth();
    const { isAdmin, isAdminDespensa, isEmpleado, canViewStockAlerts } = useRole();

    const {
        alertas,
        totalAlertas,
        agotados,
        error: alertasError,
        fetchAlertas,
    } = useAlertasStock({
        enabled: canViewStockAlerts,
    });

    const {
        loading,
        loadingReportes,
        lastUpdated,
        fechaDesde,
        fechaHasta,
        activePreset,
        handleApplyDateRange,
        handleSelectPreset,
        reloadMetrics,
        metrics,
    } = useDashboardMetrics();

    const handleRefreshAll = () => {
        reloadMetrics();
        if (canViewStockAlerts) {
            fetchAlertas();
        }
    };

    const formattedTime = lastUpdated
        ? lastUpdated.toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "--:--";

    return (
        <div className="min-h-screen bg-surface text-on-surface p-4 sm:p-6 lg:p-8 font-body-md">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* ── CABECERA EJECUTIVA Y ACCIONES RÁPIDAS ── */}
                <section className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-primary text-on-primary flex items-center justify-center font-headline-md text-headline-md shadow-xs shrink-0">
                            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
                                    Panel de Control Empresarial
                                </h1>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-primary">
                                    {ROLE_DISPLAY[user?.role] || user?.role || "Usuario"}
                                </span>
                            </div>
                            <p className="text-xs sm:text-sm text-on-surface-variant mt-0.5">
                                Bienvenido/a, <strong className="text-on-surface">{user?.name || user?.email}</strong> · Resumen financiero, reportes estadísticos e inventario en tiempo real (act. {formattedTime})
                            </p>
                        </div>
                    </div>

                    {/* Barra de Acciones Rápidas Corporativas */}
                    <div className="flex items-center flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={handleRefreshAll}
                            disabled={loading || loadingReportes}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-semibold border border-outline-variant/30 transition-all active:scale-95"
                            title="Actualizar indicadores del tablero"
                        >
                            <span
                                className={`material-symbols-outlined text-[18px] text-primary ${
                                    loading || loadingReportes ? "animate-spin" : ""
                                }`}
                            >
                                refresh
                            </span>
                            <span>Actualizar</span>
                        </button>

                        {(isAdminDespensa || isEmpleado) && (
                            <Link
                                to="/punto-de-venta"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container text-xs font-semibold transition-all shadow-xs active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    point_of_sale
                                </span>
                                <span>Nueva Venta (POS)</span>
                            </Link>
                        )}

                        {isAdminDespensa && (
                            <>
                                <Link
                                    to="/admin/compras"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary-container text-on-secondary-container hover:opacity-90 text-xs font-semibold transition-all shadow-2xs active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        shopping_bag
                                    </span>
                                    <span>Registrar Compra</span>
                                </Link>

                                <Link
                                    to="/admin/productos"
                                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface-container-high text-on-surface hover:bg-surface-container-highest text-xs font-semibold border border-outline-variant/30 transition-all active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-[18px]">
                                        price_change
                                    </span>
                                    <span>Catálogo y Precios</span>
                                </Link>
                            </>
                        )}

                        {isAdmin && (
                            <Link
                                to="/admin/usuarios"
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary hover:bg-primary/90 text-xs font-semibold transition-all shadow-xs"
                            >
                                <span className="material-symbols-outlined text-[18px]">
                                    manage_accounts
                                </span>
                                <span>Gestionar Usuarios</span>
                            </Link>
                        )}
                    </div>
                </section>

                {/* ── VISTA PARA ADMIN DE DESPENSA Y EMPLEADO ── */}
                {(isAdminDespensa || isEmpleado) && (
                    <>
                        {/* Fila 1: 4 KPIs Principales */}
                        <DashboardKPIGrid
                            metrics={metrics}
                            loading={loading}
                            isAdminDespensa={isAdminDespensa}
                            totalAlertas={totalAlertas}
                            agotados={agotados}
                        />

                        {/* Fila 2 [CU18]: Reporte de Ventas Chart.js + Filtro de Fechas (7/12) y Productos Más Vendidos Chart.js (5/12) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            <div className="lg:col-span-7 flex flex-col">
                                <SalesTrendCard
                                    reporteVentas={metrics.ventas.reporteVentas}
                                    fechaDesde={fechaDesde}
                                    fechaHasta={fechaHasta}
                                    activePreset={activePreset}
                                    onApplyDateRange={handleApplyDateRange}
                                    onSelectPreset={handleSelectPreset}
                                    loading={loading || loadingReportes}
                                />
                            </div>
                            <div className="lg:col-span-5 flex flex-col">
                                <TopProductsChartPanel
                                    reporteMasVendidos={
                                        metrics.ventas.reporteMasVendidos
                                    }
                                    loading={loading || loadingReportes}
                                />
                            </div>
                        </div>

                        {/* Fila 3: Últimas Ventas (7/12) + Salud y Valorización de Inventario (5/12) */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            <div className="lg:col-span-7 flex flex-col">
                                <RecentSalesTable
                                    ventas={metrics.ventas.recientes}
                                    loading={loading}
                                />
                            </div>
                            <div className="lg:col-span-5 flex flex-col">
                                <InventoryHealthCard
                                    inventario={metrics.inventario}
                                    loading={loading}
                                    isAdminDespensa={isAdminDespensa}
                                />
                            </div>
                        </div>

                        {/* Fila 4 [CU17]: Panel de Alertas Prioritarias de Reposición de Stock */}
                        {canViewStockAlerts && (alertasError || totalAlertas > 0) && (
                            <div className="bg-surface-container-lowest rounded-2xl border border-error/30 shadow-xs overflow-hidden">
                                <div className="p-5 bg-error-container/15 border-b border-error/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-[22px]">
                                                {alertasError ? "cloud_off" : "warning"}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-on-surface">
                                                Alertas Prioritarias de Reposición ({totalAlertas})
                                            </h3>
                                            <p className="text-xs text-on-surface-variant">
                                                {alertasError
                                                    ? alertasError
                                                    : `${agotados} producto(s) agotado(s) y ${totalAlertas - agotados} en umbral de stock mínimo`}
                                            </p>
                                        </div>
                                    </div>

                                    {alertasError ? (
                                        <button
                                            type="button"
                                            onClick={fetchAlertas}
                                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error text-on-error text-xs font-semibold hover:bg-error/90 transition-colors shrink-0"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">
                                                refresh
                                            </span>
                                            <span>Reintentar</span>
                                        </button>
                                    ) : (
                                        isAdminDespensa && (
                                            <Link
                                                to="/admin/compras"
                                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-error text-on-error hover:bg-error/90 text-xs font-semibold transition-colors shrink-0 shadow-2xs"
                                            >
                                                <span className="material-symbols-outlined text-[16px]">
                                                    shopping_bag
                                                </span>
                                                <span>Reponer Mercadería</span>
                                            </Link>
                                        )
                                    )}
                                </div>

                                {!alertasError && totalAlertas > 0 && (
                                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {alertas.slice(0, 6).map((prod) => {
                                            const isZero =
                                                Number(prod.stock_actual) <= 0;
                                            return (
                                                <div
                                                    key={prod.id}
                                                    className="px-3.5 py-2.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between gap-2"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-xs sm:text-sm font-semibold text-on-surface truncate">
                                                            {prod.nombre}
                                                        </p>
                                                        <p className="text-[11px] text-on-surface-variant truncate">
                                                            Mínimo:{" "}
                                                            <strong className="tabular-nums">
                                                                {prod.stock_minimo} un.
                                                            </strong>
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`px-2.5 py-0.5 rounded-full text-xs font-bold tabular-nums shrink-0 ${
                                                            isZero
                                                                ? "bg-error-container text-on-error-container"
                                                                : "bg-amber-100 text-amber-900"
                                                        }`}
                                                    >
                                                        {isZero
                                                            ? "Agotado"
                                                            : `${prod.stock_actual} un.`}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {/* ── VISTA EJECUTIVA PARA ADMINISTRADOR DE SISTEMA (ROL ADMIN) ── */}
                {isAdmin && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                    Total Usuarios Registrados
                                </p>
                                <p className="text-2xl font-bold text-primary font-mono tabular-nums mt-1">
                                    {loading ? "—" : metrics.usuarios.total}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-3 pt-2 border-t border-outline-variant/25">
                                    Cuentas habilitadas en la plataforma
                                </p>
                            </div>

                            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
                                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                    Administradores Despensa
                                </p>
                                <p className="text-2xl font-bold text-on-surface font-mono tabular-nums mt-1">
                                    {loading
                                        ? "—"
                                        : metrics.usuarios.porRol.admin_despensa}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-3 pt-2 border-t border-outline-variant/25">
                                    Gestión integral de comercio y finanzas
                                </p>
                            </div>

                            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary" />
                                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                    Operadores de Caja (POS)
                                </p>
                                <p className="text-2xl font-bold text-on-surface font-mono tabular-nums mt-1">
                                    {loading ? "—" : metrics.usuarios.porRol.empleado}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-3 pt-2 border-t border-outline-variant/25">
                                    Atención de ventas y cobros a clientes
                                </p>
                            </div>

                            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 relative overflow-hidden">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-tertiary" />
                                <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                    Admins de Sistema
                                </p>
                                <p className="text-2xl font-bold text-on-surface font-mono tabular-nums mt-1">
                                    {loading ? "—" : metrics.usuarios.porRol.admin}
                                </p>
                                <p className="text-xs text-on-surface-variant mt-3 pt-2 border-t border-outline-variant/25">
                                    Control de accesos y seguridad
                                </p>
                            </div>
                        </div>

                        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-secondary-container text-primary flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[26px]">
                                        admin_panel_settings
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-on-surface">
                                        Directorio y Permisos de Usuarios
                                    </h3>
                                    <p className="text-xs sm:text-sm text-on-surface-variant">
                                        Administre altas, bajas y asignación de roles para el personal del negocio.
                                    </p>
                                </div>
                            </div>
                            <Link
                                to="/admin/usuarios"
                                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-xs"
                            >
                                <span>Abrir Panel de Usuarios</span>
                                <span className="material-symbols-outlined text-[18px]">
                                    arrow_forward
                                </span>
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
