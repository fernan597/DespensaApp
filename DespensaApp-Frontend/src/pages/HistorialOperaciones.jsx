import { useRole } from "../hooks/useRole";
import { useAuditoria } from "../features/auditoria/hooks/useAuditoria";
import { AuditoriaFilters } from "../features/auditoria/components/AuditoriaFilters";
import { AuditoriaTable } from "../features/auditoria/components/AuditoriaTable";
import { DetalleAuditoriaModal } from "../features/auditoria/components/DetalleAuditoriaModal";

/**
 * CU03 — Consulta de logs de auditoría.
 *
 * Accesible para el Administrador del Sistema y el Administrador del Negocio.
 * El Empleado/Cajero no tiene acceso a esta vista.
 */
export function HistorialOperaciones() {
    const { isAdmin } = useRole();

    const {
        logs,
        meta,
        catalogos,
        loading,
        error,
        filtros,
        hayFiltrosActivos,
        selected,
        isModalOpen,
        loadingDetalle,
        cambiarFiltro,
        aplicarFiltros,
        limpiarFiltros,
        cambiarPagina,
        loadAuditorias,
        abrirDetalle,
        cerrarDetalle,
    } = useAuditoria();

    const descripcion = isAdmin
        ? "Monitoreo técnico de seguridad, seguimiento de credenciales y administración general del sistema."
        : "Control operativo del comercio: precios, caja, cuentas corrientes y demás acciones sensibles.";

    return (
        <div className="bg-surface text-on-surface min-h-screen p-6 font-body-md">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">

                {/* Cabecera */}
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shadow-sm shrink-0">
                            <span className="material-symbols-outlined text-on-primary-container text-[24px]">
                                policy
                            </span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-on-background tracking-tight">
                                Logs de Auditoría
                            </h1>
                            <p className="text-sm text-on-surface-variant max-w-2xl">
                                {descripcion}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={loadAuditorias}
                        disabled={loading}
                        className="self-start sm:self-auto flex items-center gap-2 bg-surface-container-high hover:bg-surface-variant text-on-surface px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm disabled:opacity-50"
                    >
                        <span
                            className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}
                        >
                            refresh
                        </span>
                        Actualizar
                    </button>
                </header>

                {/* Contexto de la bitácora */}
                <div className="flex items-start gap-2 rounded-xl bg-secondary-container/40 border border-secondary/20 px-4 py-3 text-xs text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px] text-primary shrink-0">
                        verified_user
                    </span>
                    <p>
                        Registro inmutable de las acciones sensibles realizadas por todos los
                        usuarios. Se muestran fecha y hora, usuario, rol, tipo de acción y el
                        detalle de la operación.
                    </p>
                </div>

                {/* Filtros */}
                <AuditoriaFilters
                    filtros={filtros}
                    catalogos={catalogos}
                    loading={loading}
                    hayFiltrosActivos={hayFiltrosActivos}
                    onChange={cambiarFiltro}
                    onApply={aplicarFiltros}
                    onClear={limpiarFiltros}
                />

                {/* Tabla */}
                <AuditoriaTable
                    logs={logs}
                    meta={meta}
                    loading={loading}
                    error={error}
                    onRetry={loadAuditorias}
                    onVerDetalle={abrirDetalle}
                    onPageChange={cambiarPagina}
                />
            </div>

            <DetalleAuditoriaModal
                isOpen={isModalOpen}
                onClose={cerrarDetalle}
                auditoria={selected}
                loading={loadingDetalle}
            />
        </div>
    );
}
