import { formatCurrency } from "../../../utils/formatters";
import { calcularMargen } from "../../../utils/pricing";

/**
 * Tabla de productos con estado de carga, alertas de stock mínimo, márgenes y acciones.
 */
export function ProductTable({ products = [], loading, onEdit, onQuickPrice, onDelete }) {
    return (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            {loading ? (
                <div className="p-8 text-center text-on-surface-variant flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    Cargando catálogo...
                </div>
            ) : (!products || products.length === 0) ? (
                <div className="p-8 text-center text-on-surface-variant">
                    No se encontraron productos registrados.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase">
                            <tr>
                                <th className="p-4 font-semibold">Código</th>
                                <th className="p-4 font-semibold">Producto</th>
                                <th className="p-4 font-semibold">Categoría / Marca</th>
                                <th className="p-4 font-semibold">Precio Compra</th>
                                <th className="p-4 font-semibold">Precio Venta / Margen</th>
                                <th className="p-4 font-semibold">Stock</th>
                                <th className="p-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant/20 text-sm">
                            {products.map((product) => {
                                const isLowStock = Number(product.stock_actual) <= Number(product.stock_minimo);
                                return (
                                    <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                                        <td className="p-4 font-mono text-xs text-outline">
                                            {product.codigo_barra || "N/A"}
                                        </td>
                                        <td className="p-4 font-medium text-on-surface">
                                            {product.nombre}
                                        </td>
                                        <td className="p-4 text-xs text-on-surface-variant">
                                            <span className="inline-block bg-surface-container px-2 py-0.5 rounded-md font-medium mr-1 text-on-surface">
                                                {product.categoria?.nombre || "Sin cat."}
                                            </span>
                                            <span className="text-outline">/</span>
                                            <span className="inline-block ml-1 font-semibold text-secondary">
                                                {product.marca?.nombre || "Sin marca"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-on-surface-variant">
                                            {formatCurrency(product.precio_compra)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-primary">
                                                    {formatCurrency(product.precio_venta)}
                                                </span>
                                                {Number(product.precio_compra) > 0 && (
                                                    <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-primary-container/50 text-on-primary-container">
                                                        {calcularMargen(product.precio_compra, product.precio_venta).toFixed(1)}%
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-medium ${isLowStock
                                                        ? "bg-error-container text-on-error-container"
                                                        : "bg-secondary-fixed text-on-secondary-fixed"
                                                    }`}
                                            >
                                                {product.stock_actual} un.
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-1">
                                            {onQuickPrice && (
                                                <button
                                                    onClick={() => onQuickPrice(product)}
                                                    className="p-1.5 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-surface-container transition-colors"
                                                    title="Actualizar Precio y Margen (CU06)"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">price_change</span>
                                                </button>
                                            )}
                                            <button
                                                onClick={() => onEdit(product)}
                                                className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                                                title="Editar"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">edit</span>
                                            </button>
                                            <button
                                                onClick={() => onDelete(product.id)}
                                                className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                                                title="Eliminar"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
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
