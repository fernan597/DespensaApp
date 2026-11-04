import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAlertasStock } from "../hooks/useAlertasStock";
import { useRole } from "../../../hooks/useRole";

/**
 * [CU17] Badge de notificación y widget desplegable de alertas prioritarias
 * de stock mínimo para la barra superior del Dashboard (MainLayout).
 */
export function StockAlertWidget() {
    const { isAdminDespensa, canViewStockAlerts } = useRole();
    const canViewAlerts = canViewStockAlerts;

    const {
        alertas,
        totalAlertas,
        agotados,
        bajoMinimo,
        loading,
        error,
        fetchAlertas,
    } = useAlertasStock({ enabled: canViewAlerts });

    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Cerrar popover al hacer clic fuera
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    if (!canViewAlerts) return null;

    const hasAlerts = totalAlertas > 0;
    const hasOutOfStock = agotados > 0;
    const hasError = Boolean(error);

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botón / Badge en la barra superior */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-full border transition-all duration-200 ${
                    hasError
                        ? "bg-error-container/70 border-error/30 text-on-error-container hover:bg-error-container"
                        : hasOutOfStock
                        ? "bg-error-container/70 border-error/30 text-on-error-container hover:bg-error-container"
                        : hasAlerts
                        ? "bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-100"
                        : "bg-surface-container-low border-outline-variant/40 text-on-surface-variant hover:bg-surface-container"
                }`}
                title={
                    hasError
                        ? "No se pudieron cargar las alertas de stock"
                        : hasAlerts
                        ? `${totalAlertas} producto(s) en stock mínimo o agotado`
                        : "Todos los productos tienen stock suficiente"
                }
            >
                <span
                    className={`material-symbols-outlined text-[20px] ${
                        hasError
                            ? "text-error"
                            : hasOutOfStock
                            ? "text-error"
                            : hasAlerts
                            ? "text-amber-700"
                            : "text-primary"
                    }`}
                >
                    {hasError
                        ? "error"
                        : hasAlerts
                        ? "notifications_active"
                        : "inventory_2"}
                </span>

                <span className="hidden md:inline text-xs font-semibold">
                    {hasError
                        ? "Alertas no disponibles"
                        : hasAlerts
                        ? "Alertas de Stock"
                        : "Stock al día"}
                </span>

                {/* Contador / Badge numérico */}
                <span
                    className={`inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full text-xs font-bold ${
                        hasError
                            ? "bg-error text-on-error"
                            : hasOutOfStock
                            ? "bg-error text-on-error"
                            : hasAlerts
                            ? "bg-amber-600 text-white"
                            : "bg-primary/15 text-primary"
                    }`}
                >
                    {loading ? "…" : hasError ? "!" : totalAlertas}
                </span>
            </button>

            {/* Widget desplegable de alertas prioritarias */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/40 z-50 overflow-hidden">
                    {/* Cabecera del widget */}
                    <div className="p-4 bg-surface-container-low border-b border-outline-variant/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span
                                className={`material-symbols-outlined text-[22px] ${
                                    hasError || hasAlerts ? "text-error" : "text-primary"
                                }`}
                            >
                                {hasError ? "error" : hasAlerts ? "warning" : "check_circle"}
                            </span>
                            <div>
                                <h3 className="text-sm font-bold text-on-surface">
                                    Alertas de Stock Mínimo
                                </h3>
                                <p className="text-xs text-on-surface-variant">
                                    {hasError
                                        ? "No se pudieron cargar las alertas"
                                        : hasAlerts
                                        ? `${totalAlertas} producto(s) requieren reposición`
                                        : "Sin alertas pendientes"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={fetchAlertas}
                            disabled={loading}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            title="Actualizar alertas"
                        >
                            <span
                                className={`material-symbols-outlined text-[18px] ${
                                    loading ? "animate-spin" : ""
                                }`}
                            >
                                refresh
                            </span>
                        </button>
                    </div>

                    {/* KPIs rápidos si hay alertas */}
                    {!hasError && hasAlerts && (
                        <div className="grid grid-cols-2 gap-2 px-4 py-2.5 bg-surface-container/50 border-b border-outline-variant/20 text-xs">
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-error-container/50 text-on-error-container">
                                <span className="font-medium">Agotados (0 un.)</span>
                                <span className="font-bold text-sm">{agotados}</span>
                            </div>
                            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-100/80 text-amber-900">
                                <span className="font-medium">En mínimo</span>
                                <span className="font-bold text-sm">{bajoMinimo}</span>
                            </div>
                        </div>
                    )}

                    {/* Lista de productos en alerta */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-outline-variant/20">
                        {hasError ? (
                            <div className="p-6 text-center text-on-surface-variant space-y-2">
                                <span className="material-symbols-outlined text-error text-[32px]">
                                    cloud_off
                                </span>
                                <p className="text-sm font-medium text-on-surface">
                                    No se pudieron cargar las alertas
                                </p>
                                <p className="text-xs">{error}</p>
                                <button
                                    type="button"
                                    onClick={fetchAlertas}
                                    disabled={loading}
                                    className="px-4 py-2 rounded-full text-xs font-semibold bg-error-container text-on-error-container hover:bg-error/20 transition-colors disabled:opacity-50"
                                >
                                    Reintentar
                                </button>
                            </div>
                        ) : !hasAlerts ? (
                            <div className="p-6 text-center text-on-surface-variant space-y-1">
                                <span className="material-symbols-outlined text-primary text-[32px]">
                                    verified
                                </span>
                                <p className="text-sm font-medium text-on-surface">
                                    ¡Inventario en niveles óptimos!
                                </p>
                                <p className="text-xs">
                                    Ningún producto se encuentra por debajo de su stock mínimo.
                                </p>
                            </div>
                        ) : (
                            alertas.map((prod) => {
                                const isZero = Number(prod.stock_actual) <= 0;
                                return (
                                    <div
                                        key={prod.id}
                                        className="px-4 py-3 hover:bg-surface-container-low transition-colors flex items-center justify-between gap-3"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-on-surface truncate">
                                                {prod.nombre}
                                            </p>
                                            <p className="text-xs text-on-surface-variant truncate">
                                                {prod.marca?.nombre || "Sin marca"} •{" "}
                                                {prod.categoria?.nombre || "Sin categoría"}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                                    isZero
                                                        ? "bg-error-container text-on-error-container"
                                                        : "bg-amber-100 text-amber-900"
                                                }`}
                                            >
                                                {isZero
                                                    ? "Agotado (0 un.)"
                                                    : `${prod.stock_actual} un.`}
                                            </span>
                                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                                                Mínimo: {prod.stock_minimo} un.
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Acciones rápidas en el pie del widget (solo admin_despensa) */}
                    {isAdminDespensa && (
                        <div className="p-3 bg-surface-container-low border-t border-outline-variant/30 flex items-center justify-between gap-2">
                            <Link
                                to="/admin/productos"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 text-center py-2 px-3 rounded-xl text-xs font-semibold text-on-surface bg-surface-container hover:bg-surface-container-high transition-colors"
                            >
                                Ver Productos
                            </Link>
                            <Link
                                to="/admin/compras"
                                onClick={() => setIsOpen(false)}
                                className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-3 rounded-xl text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 transition-colors"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    shopping_bag
                                </span>
                                Registrar Compra
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

