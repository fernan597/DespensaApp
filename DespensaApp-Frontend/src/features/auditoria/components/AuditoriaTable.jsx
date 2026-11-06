import { formatDateTime } from "../../../utils/formatters";

const CATEGORIA_ESTILOS = {
    AUTENTICACION: "bg-secondary-container text-on-secondary-container",
    USUARIOS: "bg-primary-container text-on-primary-container",
    CAJA: "bg-surface-container-high text-on-surface",
    VENTAS: "bg-primary/10 text-primary",
    COMPRAS: "bg-secondary-fixed text-on-secondary-fixed",
    CATALOGO: "bg-surface-variant text-on-surface-variant",
    PROVEEDORES: "bg-error-container/70 text-on-error-container",
};

const CATEGORIA_ICONOS = {
    AUTENTICACION: "lock",
    USUARIOS: "group",
    CAJA: "payments",
    VENTAS: "sell",
    COMPRAS: "shopping_cart",
    CATALOGO: "inventory_2",
    PROVEEDORES: "local_shipping",
};

function BadgeAccion({ accion }) {
    const estilo =
        CATEGORIA_ESTILOS[accion.categoria] ??
        "bg-surface-container-high text-on-surface";
    const icono = CATEGORIA_ICONOS[accion.categoria] ?? "history";

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${estilo}`}
        >
            <span className="material-symbols-outlined text-[15px]">{icono}</span>
            {accion.accion_label}
        </span>
    );
}

function Paginacion({ meta, loading, onPageChange }) {
    const { current_page: currentPage = 1, last_page: lastPage = 1 } = meta ?? {};
    const total = meta?.total ?? 0;
    const from = meta?.from ?? 0;
    const to = meta?.to ?? 0;

    return (
        <div className="px-4 py-3 bg-surface-container-lowest flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <p>
                Mostrando {from}-{to} de {total} registro{total === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={loading || currentPage <= 1}
                    className="p-1.5 rounded-lg hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Página anterior"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        chevron_left
                    </span>
                </button>

                <span className="font-semibold text-on-surface">
                    Página {currentPage} de {lastPage}
                </span>

                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={loading || currentPage >= lastPage}
                    className="p-1.5 rounded-lg hover:bg-surface-container disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Página siguiente"
                >
                    <span className="material-symbols-outlined text-[20px]">
                        chevron_right
                    </span>
                </button>
            </div>
        </div>
    );
}

/**
 * Tabla de registros de auditoría con estados de carga, error y vacío.
 */
export function AuditoriaTable({
    logs,
    meta,
    loading,
    error,
    onRetry,
    onVerDetalle,
    onPageChange,
}) {
    return (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                            <th className="py-3 px-4 font-semibold whitespace-nowrap">
                                Fecha y hora
                            </th>
                            <th className="py-3 px-4 font-semibold">Usuario</th>
                            <th className="py-3 px-4 font-semibold">Acción</th>
                            <th className="py-3 px-4 font-semibold hidden md:table-cell">
                                Detalle
                            </th>
                            <th className="py-3 px-4 font-semibold text-right">
                                Ver
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-on-surface divide-y divide-outline-variant/20">
                        {loading ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
                                            progress_activity
                                        </span>
                                        <p className="font-medium">Cargando bitácora...</p>
                                    </div>
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-error">
                                        <span className="material-symbols-outlined text-[32px]">
                                            error
                                        </span>
                                        <p className="font-medium">{error}</p>
                                        <button
                                            type="button"
                                            onClick={onRetry}
                                            className="mt-2 px-4 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                                        >
                                            Reintentar
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ) : logs.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                                    <span className="material-symbols-outlined text-outline text-[40px] mb-2 block">
                                        history_off
                                    </span>
                                    No se encontraron registros con los filtros seleccionados.
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-surface-container-low/50 transition-colors"
                                >
                                    <td className="py-3 px-4 whitespace-nowrap text-xs text-on-surface-variant font-medium tabular-nums">
                                        {formatDateTime(log.created_at)}
                                    </td>
                                    <td className="py-3 px-4">
                                        {log.usuario ? (
                                            <div className="min-w-0">
                                                <p className="font-medium text-on-surface truncate">
                                                    {log.usuario.name}
                                                </p>
                                                <p className="text-xs text-on-surface-variant truncate">
                                                    {log.usuario.email}
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-outline">
                                                Usuario del sistema
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <BadgeAccion accion={log} />
                                    </td>
                                    <td className="py-3 px-4 hidden md:table-cell max-w-md">
                                        <p className="text-sm text-on-surface-variant line-clamp-2">
                                            {log.detalle || "—"}
                                        </p>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <button
                                            type="button"
                                            onClick={() => onVerDetalle(log)}
                                            className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                                            title="Ver detalle"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                visibility
                                            </span>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <Paginacion
                meta={meta}
                loading={loading}
                onPageChange={onPageChange}
            />
        </div>
    );
}
