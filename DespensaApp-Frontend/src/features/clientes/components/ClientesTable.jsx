import { formatCurrency } from "../../../utils/formatters";

/**
 * Tabla de listado de clientes para el módulo de administración.
 *
 * @param {Object} props
 * @param {Array} props.clientes
 * @param {boolean} props.loading
 * @param {Function} props.onEdit
 * @param {Function} props.onDelete
 */
export function ClientesTable({ clientes = [], loading = false, onEdit, onDelete }) {
    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-10 text-center text-on-surface-variant flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Cargando clientes...
            </div>
        );
    }

    if (clientes.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-outline block mb-2">
                    group
                </span>
                No se encontraron clientes registrados.
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase">
                        <tr>
                            <th className="p-4 font-semibold">Cliente</th>
                            <th className="p-4 font-semibold">Teléfono</th>
                            <th className="p-4 font-semibold">Dirección</th>
                            <th className="p-4 font-semibold">Saldo Adeudado</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-sm">
                        {clientes.map((cliente) => {
                            const saldo = Number(cliente.saldo_cuenta_corriente) || 0;
                            const tieneDeuda = saldo > 0;
                            const nombreCompleto =
                                cliente.nombre_completo ||
                                `${cliente.nombre || ""} ${cliente.apellido || ""}`.trim();

                            return (
                                <tr
                                    key={cliente.id}
                                    className="hover:bg-surface-container-low transition-colors"
                                >
                                    {/* Nombre y Apellido */}
                                    <td className="p-4 font-medium text-on-surface">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-on-secondary-container text-[16px]">
                                                    person
                                                </span>
                                            </div>
                                            {nombreCompleto}
                                        </div>
                                    </td>

                                    {/* Teléfono */}
                                    <td className="p-4 text-on-surface-variant">
                                        {cliente.telefono ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[15px] text-outline">
                                                    phone
                                                </span>
                                                {cliente.telefono}
                                            </span>
                                        ) : (
                                            <span className="text-outline italic text-xs">Sin teléfono</span>
                                        )}
                                    </td>

                                    {/* Dirección */}
                                    <td className="p-4 text-on-surface-variant max-w-[200px] truncate">
                                        {cliente.direccion ? (
                                            <span
                                                className="flex items-center gap-1.5"
                                                title={cliente.direccion}
                                            >
                                                <span className="material-symbols-outlined text-[15px] text-outline">
                                                    location_on
                                                </span>
                                                <span className="truncate">{cliente.direccion}</span>
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
                                            {formatCurrency(cliente.saldo_cuenta_corriente)}
                                        </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="p-4 text-right space-x-1">
                                        <button
                                            type="button"
                                            onClick={() => onEdit(cliente)}
                                            className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                                            title="Editar cliente"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDelete(cliente)}
                                            className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                                            title="Eliminar cliente"
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
