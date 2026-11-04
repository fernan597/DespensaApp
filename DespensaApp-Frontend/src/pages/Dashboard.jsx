import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";
import { useAlertasStock } from "../features/products/hooks/useAlertasStock";

export function Dashboard() {
    const { user } = useAuth();
    const { isAdmin, isAdminDespensa, isEmpleado, canViewStockAlerts } = useRole();
    const { alertas, totalAlertas, agotados, error, fetchAlertas } = useAlertasStock({
        enabled: canViewStockAlerts,
    });


    return (
        <div className="min-h-screen bg-background text-on-background p-md sm:p-xl font-body-md">
            <div className="max-w-3xl mx-auto space-y-lg">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-md pb-md border-b border-surface-variant/60">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary text-[32px]">potted_plant</span>
                        <div>
                            <h1 className="font-headline-md text-headline-md text-primary tracking-tight">
                                DespensaApp
                            </h1>
                            <p className="text-label-sm text-on-surface-variant">Panel General</p>
                        </div>
                    </div>

                </header>

                <div className="bg-surface-container-lowest p-lg rounded-2xl shadow-sm border border-surface-container-high space-y-sm">
                    <div className="flex items-center gap-md">
                        <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-headline-md shadow-sm">
                            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-title-lg text-title-lg text-on-surface">
                                ¡Bienvenido/a, {user?.name || user?.email || "Usuario"}!
                            </h2>
                            <p className="text-on-surface-variant text-body-md">
                                Rol actual: <span className="font-semibold text-primary capitalize">{user?.role || "Sin rol asignado"}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* [CU17] Error al consultar alertas de stock */}
                {canViewStockAlerts && error && (
                    <div className="bg-error-container/25 border border-error/30 p-lg rounded-2xl space-y-md shadow-sm">
                        <div className="flex items-center gap-md">
                            <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-[26px]">cloud_off</span>
                            </div>
                            <div>
                                <h3 className="font-headline-md text-title-lg text-error font-bold">
                                    No se pudieron cargar las alertas de stock
                                </h3>
                                <p className="text-on-surface-variant text-label-md">
                                    {error}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={fetchAlertas}
                            className="inline-flex items-center justify-center gap-xs px-lg py-md bg-error text-on-error rounded-full font-label-md text-label-md hover:bg-error/90 transition-colors shrink-0 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            <span>Reintentar</span>
                        </button>
                    </div>
                )}

                {/* [CU17] Resumen de Alertas Prioritarias de Stock en el Dashboard */}
                {canViewStockAlerts && !error && totalAlertas > 0 && (
                    <div className="bg-error-container/25 border border-error/30 p-lg rounded-2xl space-y-md shadow-sm">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-md">
                            <div className="flex items-center gap-md">
                                <div className="w-12 h-12 rounded-full bg-error-container text-on-error-container flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-[26px]">warning</span>
                                </div>
                                <div>
                                    <h3 className="font-headline-md text-title-lg text-error font-bold">
                                        Alertas de Stock Mínimo ({totalAlertas})
                                    </h3>
                                    <p className="text-on-surface-variant text-label-md">
                                        {agotados > 0
                                            ? `Hay ${agotados} producto(s) agotado(s) y ${totalAlertas - agotados} en nivel mínimo.`
                                            : `Hay ${totalAlertas} producto(s) que alcanzaron su stock mínimo.`}
                                    </p>
                                </div>
                            </div>

                            {isAdminDespensa && (
                                <Link
                                    to="/admin/compras"
                                    className="inline-flex items-center justify-center gap-xs px-lg py-md bg-error text-on-error rounded-full font-label-md text-label-md hover:bg-error/90 transition-colors shrink-0 shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                                    <span>Reponer Mercadería</span>
                                </Link>
                            )}
                        </div>

                        {/* Top 4 productos más críticos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-xs">
                            {alertas.slice(0, 4).map((prod) => {
                                const isZero = Number(prod.stock_actual) <= 0;
                                return (
                                    <div
                                        key={prod.id}
                                        className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30"
                                    >
                                        <div className="min-w-0 pr-2">
                                            <p className="text-sm font-semibold text-on-surface truncate">
                                                {prod.nombre}
                                            </p>
                                            <p className="text-xs text-on-surface-variant truncate">
                                                Mínimo requerido: {prod.stock_minimo} un.
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold shrink-0 ${
                                                isZero
                                                    ? "bg-error-container text-on-error-container"
                                                    : "bg-amber-100 text-amber-900"
                                            }`}
                                        >
                                            {isZero ? "Agotado" : `${prod.stock_actual} un.`}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Gestión de Usuarios - solo Admin */}
                {isAdmin && (
                    <div className="bg-primary-container/20 border border-primary/20 p-lg rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-md shadow-sm">
                        <div className="flex items-center gap-md">
                            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
                            </div>
                            <div>
                                <h3 className="font-headline-md text-title-lg text-primary font-bold">
                                    Gestión de Usuarios
                                </h3>
                                <p className="text-on-surface-variant text-label-md">
                                    Accede al panel de control para administrar roles y miembros del sistema.
                                </p>
                            </div>
                        </div>
                        <Link to="/admin/usuarios" className="inline-flex items-center justify-center gap-xs px-lg py-md bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary/90 transition-colors shrink-0 shadow-sm">
                            <span>Ir al Panel de Usuarios</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                    </div>
                )}

                {/* Gestión de Productos - solo Owner */}
                {isAdminDespensa && (
                    <>
                        <div className="bg-secondary-container/20 border border-secondary/20 p-lg rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-md shadow-sm">
                            <div className="flex items-center gap-md">
                                <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[26px]">inventory_2</span>
                                </div>
                                <div>
                                    <h3 className="font-headline-md text-title-lg text-secondary font-bold">
                                        Gestión de Productos
                                    </h3>
                                    <p className="text-on-surface-variant text-label-md">
                                        Administra el catálogo de productos y el inventario del negocio.
                                    </p>
                                </div>
                            </div>
                            <Link to="/admin/productos" className="inline-flex items-center justify-center gap-xs px-lg py-md bg-secondary text-on-secondary rounded-full font-label-md text-label-md hover:bg-secondary/90 transition-colors shrink-0 shadow-sm">
                                <span>Ir al Panel de Productos</span>
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </Link>
                        </div>
                        <div className="bg-secondary-container/20 border border-secondary/20 p-lg rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-md shadow-sm">
                            <div className="flex items-center gap-md">
                                <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[26px]">inventory_2</span>
                                </div>
                                <div>
                                    <h3 className="font-headline-md text-title-lg text-secondary font-bold">
                                        Gestión de Proveedores
                                    </h3>
                                    <p className="text-on-surface-variant text-label-md">
                                        Administra el catálogo de proveedores del negocio.
                                    </p>
                                </div>
                            </div>
                            <Link to="/admin/proveedores" className="inline-flex items-center justify-center gap-xs px-lg py-md bg-secondary text-on-secondary rounded-full font-label-md text-label-md hover:bg-secondary/90 transition-colors shrink-0 shadow-sm">
                                <span>Ir al Panel de Proveedores</span>
                                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                            </Link>
                        </div>
                    </>
                )}

                {/* Punto de Venta - empleado y admin_despensa */}
                {(isAdminDespensa || isEmpleado) && (
                    <div className="bg-tertiary-container/20 border border-tertiary/20 p-lg rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-md shadow-sm">
                        <div className="flex items-center gap-md">
                            <div className="w-12 h-12 rounded-full bg-tertiary-container text-on-tertiary-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-[26px]">point_of_sale</span>
                            </div>
                            <div>
                                <h3 className="font-headline-md text-title-lg text-tertiary font-bold">
                                    Punto de Venta
                                </h3>
                                <p className="text-on-surface-variant text-label-md">
                                    Registrá ventas de contado, manejá la caja y el cobro.
                                </p>
                            </div>
                        </div>
                        <Link to="/punto-de-venta" className="inline-flex items-center justify-center gap-xs px-lg py-md bg-tertiary text-on-tertiary rounded-full font-label-md text-label-md hover:bg-tertiary/90 transition-colors shrink-0 shadow-sm">
                            <span>Ir al Punto de Venta</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                    </div>
                )}

                {/* Placeholder si no tiene ninguna sección especial */}
                {!isAdmin && !isAdminDespensa && !isEmpleado && (
                    <div className="bg-surface-container-lowest p-lg rounded-2xl border border-surface-container-high text-on-surface-variant text-center space-y-xs">
                        <span className="material-symbols-outlined text-outline text-[32px]">storefront</span>
                        <p className="font-label-md">Sección de ventas e inventario en desarrollo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
