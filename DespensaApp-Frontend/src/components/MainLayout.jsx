import { useState, useEffect, useCallback } from "react";
import { NavLink, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";
import { StockAlertWidget } from "../features/products/components/StockAlertWidget";
import { getCajaEstado } from "../services/cajaService";
import { formatCurrency } from "../utils/formatters";

/**
 * Mapa de metadatos de rutas para construir breadcrumbs contextuales en el Topbar.
 */
const ROUTE_META = {
    "/": {
        category: "Dirección General",
        title: "Tablero Ejecutivo y Métricas",
        icon: "monitoring",
    },
    "/punto-de-venta": {
        category: "Operación Diaria",
        title: "Punto de Venta (POS)",
        icon: "point_of_sale",
    },
    "/cuentas-corrientes-clientes": {
        category: "Operación Diaria",
        title: "Cuentas Corrientes de Clientes",
        icon: "contact_page",
    },
    "/admin/productos": {
        category: "Abastecimiento e Inventario",
        title: "Catálogo de Productos y Stock",
        icon: "inventory_2",
    },
    "/admin/compras": {
        category: "Abastecimiento e Inventario",
        title: "Recepción y Registro de Compras",
        icon: "shopping_bag",
    },
    "/admin/proveedores": {
        category: "Abastecimiento e Inventario",
        title: "Directorio de Proveedores",
        icon: "local_shipping",
    },
    "/admin/cuentas-corrientes-proveedores": {
        category: "Finanzas y Tesorería",
        title: "Cuentas Corrientes de Proveedores",
        icon: "account_balance_wallet",
    },
    "/admin/usuarios": {
        category: "Seguridad y Sistema",
        title: "Administración de Usuarios y Roles",
        icon: "group",
    },
    "/admin/auditoria": {
        category: "Seguridad y Sistema",
        title: "Logs de Auditoría",
        icon: "policy",
    },
};

const ROLE_LABELS = {
    admin_despensa: "Administrador General",
    empleado: "Operador de Caja",
    admin: "Admin de Sistema",
};

/**
 * Ítem de navegación del sidebar con estética corporativa e indicador lateral activo.
 */
function SidebarNavLink({ to, icon, label, badge = null, end = false, onClick }) {
    return (
        <NavLink
            to={to}
            end={end}
            onClick={onClick}
            className={({ isActive }) =>
                `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                    isActive
                        ? "bg-secondary-container/80 text-primary font-semibold shadow-[inset_3px_0_0_0_#154212]"
                        : "text-on-surface-variant hover:bg-surface-container-high/80 hover:text-on-surface font-medium"
                }`
            }
        >
            <div className="flex items-center gap-3 min-w-0">
                <span className="material-symbols-outlined text-[20px] shrink-0 transition-transform group-hover:scale-105">
                    {icon}
                </span>
                <span className="truncate">{label}</span>
            </div>
            {badge && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-primary/10 text-primary shrink-0">
                    {badge}
                </span>
            )}
        </NavLink>
    );
}

/**
 * Encabezado de sección dentro del Sidebar.
 */
function SidebarSectionHeader({ label }) {
    return (
        <p className="px-3.5 pt-4 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-outline select-none">
            {label}
        </p>
    );
}

export function MainLayout() {
    const { user, logout } = useAuth();
    const { isAdmin, isAdminDespensa, canUsePOS, role } = useRole();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [cajaStatus, setCajaStatus] = useState({
        loaded: false,
        abierta: false,
        saldoEsperado: 0,
    });

    const fetchCajaQuickStatus = useCallback(async () => {
        if (!canUsePOS) return;
        try {
            const res = await getCajaEstado();
            setCajaStatus({
                loaded: true,
                abierta: Boolean(res?.caja_abierta),
                saldoEsperado:
                    res?.caja?.saldo_esperado ?? res?.caja?.saldo_inicial ?? 0,
            });
        } catch {
            // Silencioso en el topbar para no interrumpir la navegación
        }
    }, [canUsePOS]);

    useEffect(() => {
        fetchCajaQuickStatus();
    }, [fetchCajaQuickStatus, location.pathname]);

    const currentRouteMeta = ROUTE_META[location.pathname] || {
        category: "Panel Empresarial",
        title: "DespensaApp",
        icon: "dashboard",
    };

    const currentDateFormatted = new Intl.DateTimeFormat("es-AR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).format(new Date());

    const roleLabel = ROLE_LABELS[role] || role || "Usuario";

    const closeMobileSidebar = () => setSidebarOpen(false);

    return (
        <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
            {/* Backdrop para dispositivos móviles / tablets */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden"
                    onClick={closeMobileSidebar}
                />
            )}

            {/* ── SIDEBAR CORPORATIVO LATERAL ── */}
            <aside
                className={`fixed left-0 top-0 h-full w-64 bg-surface-container-low border-r border-outline-variant/40 z-50 flex flex-col transition-transform duration-200 ease-in-out ${
                    sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                }`}
            >
                {/* Identidad Corporativa */}
                <div className="h-16 px-5 flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-lowest/60">
                    <Link
                        to="/"
                        onClick={closeMobileSidebar}
                        className="flex items-center gap-2.5 group"
                    >
                        <div className="w-9 h-9 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs group-hover:bg-primary-container transition-colors">
                            <span className="material-symbols-outlined text-[20px]">
                                storefront
                            </span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-primary tracking-tight leading-none">
                                DespensaApp
                            </h1>
                            <p className="text-[11px] font-medium text-on-surface-variant mt-0.5">
                                Gestión Comercial ERP
                            </p>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={closeMobileSidebar}
                        className="lg:hidden p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container-high"
                        aria-label="Cerrar menú"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Navegación Categorizada */}
                <nav className="flex-1 px-3 py-3 overflow-y-auto flex flex-col gap-0.5">
                    <SidebarSectionHeader label="Dirección General" />
                    <SidebarNavLink
                        to="/"
                        icon="monitoring"
                        label="Dashboard y Métricas"
                        end
                        onClick={closeMobileSidebar}
                    />

                    {canUsePOS && (
                        <>
                            <SidebarSectionHeader label="Operación Diaria" />
                            <SidebarNavLink
                                to="/punto-de-venta"
                                icon="point_of_sale"
                                label="Punto de Venta"
                                badge="POS"
                                onClick={closeMobileSidebar}
                            />
                            <SidebarNavLink
                                to="/cuentas-corrientes-clientes"
                                icon="contact_page"
                                label="CC Clientes (Fiado)"
                                onClick={closeMobileSidebar}
                            />
                        </>
                    )}

                    {isAdminDespensa && (
                        <>
                            <SidebarSectionHeader label="Abastecimiento y Stock" />
                            <SidebarNavLink
                                to="/admin/productos"
                                icon="inventory_2"
                                label="Productos y Precios"
                                onClick={closeMobileSidebar}
                            />
                            <SidebarNavLink
                                to="/admin/compras"
                                icon="shopping_bag"
                                label="Registrar Compra"
                                onClick={closeMobileSidebar}
                            />
                            <SidebarNavLink
                                to="/admin/proveedores"
                                icon="local_shipping"
                                label="Proveedores"
                                onClick={closeMobileSidebar}
                            />

                            <SidebarSectionHeader label="Finanzas y Tesorería" />
                            <SidebarNavLink
                                to="/admin/cuentas-corrientes-proveedores"
                                icon="account_balance_wallet"
                                label="CC Proveedores"
                                onClick={closeMobileSidebar}
                            />
                        </>
                    )}

                    {(isAdmin || isAdminDespensa) && (
                        <>
                            <SidebarSectionHeader label="Administración de Sistema" />
                            {isAdmin && (
                                <SidebarNavLink
                                    to="/admin/usuarios"
                                    icon="manage_accounts"
                                    label="Usuarios y Accesos"
                                    onClick={closeMobileSidebar}
                                />
                            )}
                            <SidebarNavLink
                                to="/admin/auditoria"
                                icon="policy"
                                label="Logs de Auditoría"
                                onClick={closeMobileSidebar}
                            />
                        </>
                    )}
                </nav>

                {/* Pie de Sidebar: Resumen de Sesión y Salida */}
                <div className="p-3 border-t border-outline-variant/30 bg-surface-container/60 space-y-2">
                    <div className="px-3 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-on-surface truncate">
                                {user?.name || "Usuario"}
                            </p>
                            <p className="text-[11px] text-primary font-medium truncate">
                                {roleLabel}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-error-container/80 hover:text-on-error-container transition-all duration-150 w-full border border-transparent hover:border-error/20"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* ── CONTENEDOR PRINCIPAL ── */}
            <div className="lg:pl-64 flex-1 flex flex-col min-h-screen">
                {/* Header Superior Ejecutivo */}
                <header className="sticky top-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between border-b border-outline-variant/40">
                    {/* Izquierda: Botón menú móvil + Breadcrumbs dinámicos */}
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden p-2 rounded-xl text-on-surface hover:bg-surface-container-high transition-colors"
                            aria-label="Abrir menú de navegación"
                        >
                            <span className="material-symbols-outlined text-[22px]">
                                menu
                            </span>
                        </button>

                        <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
                            <span className="hidden sm:inline-flex items-center gap-1.5 text-on-surface-variant font-medium">
                                <span className="material-symbols-outlined text-[18px] text-primary">
                                    {currentRouteMeta.icon}
                                </span>
                                {currentRouteMeta.category}
                            </span>
                            <span className="hidden sm:inline text-outline-variant">/</span>
                            <span className="font-bold text-on-surface truncate">
                                {currentRouteMeta.title}
                            </span>
                        </div>
                    </div>

                    {/* Derecha: Estado de Caja + Alertas de Stock + Fecha + Usuario */}
                    <div className="flex items-center gap-2.5 sm:gap-3">
                        {/* Fecha operativa */}
                        <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-xs text-on-surface-variant font-medium capitalize">
                            <span className="material-symbols-outlined text-[16px] text-primary">
                                calendar_today
                            </span>
                            <span>{currentDateFormatted}</span>
                        </div>

                        {/* Estado rápido de Caja en vivo */}
                        {canUsePOS && cajaStatus.loaded && (
                            <Link
                                to="/punto-de-venta"
                                title={
                                    cajaStatus.abierta
                                        ? `Turno de caja abierto · Saldo esperado: ${formatCurrency(cajaStatus.saldoEsperado)}`
                                        : "La caja se encuentra cerrada. Click para ir al Punto de Venta"
                                }
                                className={`hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                                    cajaStatus.abierta
                                        ? "bg-secondary-container/60 border-secondary/30 text-primary hover:bg-secondary-container"
                                        : "bg-error-container/50 border-error/30 text-on-error-container hover:bg-error-container/80"
                                }`}
                            >
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        cajaStatus.abierta
                                            ? "bg-primary animate-pulse"
                                            : "bg-error"
                                    }`}
                                />
                                <span>
                                    {cajaStatus.abierta ? "Caja Abierta" : "Caja Cerrada"}
                                </span>
                                {cajaStatus.abierta && (
                                    <span className="hidden md:inline font-mono tabular-nums text-[11px] bg-surface-container-lowest/80 px-1.5 py-0.5 rounded-md text-on-surface">
                                        {formatCurrency(cajaStatus.saldoEsperado)}
                                    </span>
                                )}
                            </Link>
                        )}

                        {/* [CU17] Widget de Alertas de Stock Mínimo */}
                        <StockAlertWidget />

                        {/* Usuario y Rol */}
                        <div className="hidden md:flex items-center gap-2.5 pl-3 border-l border-outline-variant/40">
                            <div className="text-right">
                                <p className="text-xs font-bold text-on-surface leading-tight">
                                    {user?.name || "Administrador"}
                                </p>
                                <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-primary bg-secondary-container/70 px-1.5 py-0.2 rounded">
                                    {roleLabel}
                                </span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Contenido dinámico de cada módulo */}
                <main className="flex-1 bg-surface">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
