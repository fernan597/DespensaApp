import { formatCurrency } from "../../../utils/formatters";

/**
 * Tabla de listado de proveedores para el módulo de administración.
 *
 * @param {Object} props
 * @param {Array} props.proveedores
 * @param {boolean} props.loading
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */
export function ProveedoresTable({ proveedores = [], loading = false, onEdit, onDelete }) {
    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-10 text-center text-on-surface-variant flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Cargando proveedores...
            </div>
        );
    }

    if (proveedores.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-outline block mb-2">
                    local_shipping
                </span>
                No se encontraron proveedores registrados.
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase">
                        <tr>
                            <th className="p-4 font-semibold">Razón Social</th>
                            <th className="p-4 font-semibold">Teléfono</th>
                            <th className="p-4 font-semibold">Dirección</th>
                            <th className="p-4 font-semibold">Saldo Adeudado</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-sm">
                        {proveedores.map((proveedor) => {
                            const saldo = Number(proveedor.saldo_adeudado) || 0;
                            const tieneDeuda = saldo > 0;

                            return (
                                <tr
                                    key={proveedor.id}
                                    className="hover:bg-surface-container-low transition-colors"
                                >
                                    {/* Razón Social */}
                                    <td className="p-4 font-medium text-on-surface">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-on-secondary-container text-[16px]">
                                                    business
                                                </span>
                                            </div>
                                            {proveedor.razon_social}
                                        </div>
                                    </td>

                                    {/* Teléfono */}
                                    <td className="p-4 text-on-surface-variant">
                                        {proveedor.telefono ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[15px] text-outline">
                                                    phone
                                                </span>
                                                {proveedor.telefono}
                                            </span>
                                        ) : (
                                            <span className="text-outline italic text-xs">Sin teléfono</span>
                                        )}
                                    </td>

                                    {/* Dirección */}
                                    <td className="p-4 text-on-surface-variant max-w-[200px] truncate">
                                        {proveedor.direccion ? (
                                            <span
                                                className="flex items-center gap-1.5"
                                                title={proveedor.direccion}
                                            >
                                                <span className="material-symbols-outlined text-[15px] text-outline">
                                                    location_on
                                                </span>
                                                <span className="truncate">{proveedor.direccion}</span>
                                            </span>
                                        ) : (
                                            <span className="text-outline italic text-xs">Sin dirección</span>
                                        )}
                                    </td>

                                    {/* Saldo Adeudado */}
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                tieneDeuda
                                                    ? "bg-error-container text-on-error-container"
                                                    : "bg-secondary-fixed text-on-secondary-fixed"
                                            }`}
                                        >
                                            {tieneDeuda && (
                                                <span className="material-symbols-outlined text-[13px]">
                                                    warning
                                                </span>
                                            )}
                                            {formatCurrency(proveedor.saldo_adeudado)}
                                        </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="p-4 text-right space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(proveedor)}
                                            className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                                            title="Editar proveedor"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(proveedor.id)}
                                            className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                                            title="Eliminar proveedor"
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
        </div>
    );
}
