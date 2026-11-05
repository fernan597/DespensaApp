import { Link } from "react-router-dom";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Panel ejecutivo de Salud de Inventario y Valorización Patrimonial.
 * Los costos y márgenes proyectados se muestran exclusivamente a admin_despensa.
 */
export function InventoryHealthCard({
    inventario,
    loading = false,
    isAdminDespensa = false,
}) {
    const totalProds = inventario?.totalProductos || 0;
    const optimos = inventario?.productosOptimos || 0;
    const bajoStock = inventario?.productosBajoStock || 0;
    const agotados = inventario?.productosAgotados || 0;

    const pctOptimos =
        totalProds > 0 ? Math.round((optimos / totalProds) * 100) : 0;
    const pctBajo =
        totalProds > 0 ? Math.round((bajoStock / totalProds) * 100) : 0;
    const pctAgotados =
        totalProds > 0 ? Math.max(0, 100 - pctOptimos - pctBajo) : 0;

    return (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between gap-5">
            {/* Cabecera */}
            <div className="flex items-center justify-between gap-2 border-b border-outline-variant/25 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                            inventory
                        </span>
                        <h3 className="text-base font-bold text-on-surface">
                            {isAdminDespensa
                                ? "Patrimonio y Salud de Inventario"
                                : "Disponibilidad de Inventario"}
                        </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        {isAdminDespensa
                            ? "Valorización contable del stock actual y niveles de reposición"
                            : "Estado general de existencias y artículos activos en depósito"}
                    </p>
                </div>

                {isAdminDespensa && (
                    <Link
                        to="/admin/productos"
                        className="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface border border-outline-variant/30 transition-colors shrink-0"
                    >
                        Catálogo
                    </Link>
                )}
            </div>

            {/* Valorización Financiera (Solo admin_despensa) */}
            {isAdminDespensa ? (
                <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                                Capital en Mercadería (Costo)
                            </p>
                            <p className="text-lg font-bold text-on-surface font-mono tabular-nums mt-1">
                                {loading
                                    ? "—"
                                    : formatCurrency(inventario.valorCostoTotal)}
                            </p>
                            <p className="text-[11px] text-on-surface-variant mt-0.5">
                                Sobre {inventario.totalUnidades} un. físicas en stock
                            </p>
                        </div>

                        <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-secondary/25">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                Valor de Venta Estimado
                            </p>
                            <p className="text-lg font-bold text-primary font-mono tabular-nums mt-1">
                                {loading
                                    ? "—"
                                    : formatCurrency(inventario.valorVentaTotal)}
                            </p>
                            <p className="text-[11px] text-on-secondary-container font-medium mt-0.5">
                                Margen potencial:{" "}
                                <strong className="font-mono tabular-nums">
                                    +{formatCurrency(inventario.gananciaPotencial)}
                                </strong>
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                            Referencias en Catálogo
                        </p>
                        <p className="text-xl font-bold text-on-surface font-mono tabular-nums mt-1">
                            {loading ? "—" : inventario.totalProductos}
                        </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-secondary-container/40 border border-secondary/25">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                            Unidades Totales
                        </p>
                        <p className="text-xl font-bold text-primary font-mono tabular-nums mt-1">
                            {loading ? "—" : inventario.totalUnidades}
                        </p>
                    </div>
                </div>
            )}

            {/* Semáforo de Salud de Stock */}
            <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                    <span className="font-bold uppercase tracking-wider text-[11px] text-on-surface-variant">
                        Semáforo de Cobertura ({totalProds} productos)
                    </span>
                    <span className="font-semibold text-primary tabular-nums">
                        {pctOptimos}% saludable
                    </span>
                </div>

                {/* Barra segmentada */}
                <div className="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden flex">
                    {pctOptimos > 0 && (
                        <div
                            style={{ width: `${pctOptimos}%` }}
                            className="bg-primary h-full transition-all duration-300"
                            title={`Stock óptimo: ${optimos} productos`}
                        />
                    )}
                    {pctBajo > 0 && (
                        <div
                            style={{ width: `${pctBajo}%` }}
                            className="bg-amber-500 h-full transition-all duration-300"
                            title={`En stock mínimo: ${bajoStock} productos`}
                        />
                    )}
                    {pctAgotados > 0 && (
                        <div
                            style={{ width: `${pctAgotados}%` }}
                            className="bg-error h-full transition-all duration-300"
                            title={`Agotados: ${agotados} productos`}
                        />
                    )}
                </div>

                {/* Leyenda con contadores */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25 flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                            <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                            <span className="truncate font-medium">Óptimo</span>
                        </div>
                        <span className="text-base font-bold text-on-surface font-mono tabular-nums mt-1">
                            {loading ? "—" : optimos}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs text-amber-900">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                            <span className="truncate font-medium">En Mínimo</span>
                        </div>
                        <span className="text-base font-bold text-amber-900 font-mono tabular-nums mt-1">
                            {loading ? "—" : bajoStock}
                        </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-error-container/30 border border-error/25 flex flex-col">
                        <div className="flex items-center gap-1.5 text-xs text-on-error-container">
                            <span className="w-2 h-2 rounded-full bg-error shrink-0" />
                            <span className="truncate font-medium">Agotados</span>
                        </div>
                        <span className="text-base font-bold text-error font-mono tabular-nums mt-1">
                            {loading ? "—" : agotados}
                        </span>
                    </div>
                </div>
            </div>

            {/* Pie de acciones de inventario */}
            {isAdminDespensa && (
                <div className="pt-3 border-t border-outline-variant/25 flex items-center justify-between gap-2">
                    <Link
                        to="/admin/compras"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary text-on-primary text-xs font-semibold hover:bg-primary/90 transition-colors shadow-2xs"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            add_shopping_cart
                        </span>
                        <span>Ingresar Compra</span>
                    </Link>
                    <Link
                        to="/admin/proveedores"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-highest transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            local_shipping
                        </span>
                        <span>Ver Proveedores</span>
                    </Link>
                </div>
            )}
        </div>
    );
}

