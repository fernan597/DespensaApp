import { Modal } from "../../../components/ui/Modal";
import { formatDateTime } from "../../../utils/formatters";

const ROLE_LABELS = {
    admin_despensa: "Administrador del Negocio",
    empleado: "Empleado / Cajero",
    admin: "Administrador del Sistema",
};

const CATEGORIA_LABELS = {
    AUTENTICACION: "Autenticación",
    USUARIOS: "Usuarios y roles",
    CAJA: "Caja y tesorería",
    VENTAS: "Ventas y cobros",
    COMPRAS: "Compras y pagos",
    CATALOGO: "Catálogo e inventario",
    PROVEEDORES: "Proveedores",
};

function Dato({ label, children }) {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-outline">
                {label}
            </span>
            <div className="text-sm text-on-surface">{children}</div>
        </div>
    );
}

/**
 * Modal con el detalle completo de un registro de auditoría.
 */
export function DetalleAuditoriaModal({
    isOpen,
    onClose,
    auditoria,
    loading,
}) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Detalle de auditoría"
            maxWidth="max-w-2xl"
        >
            {loading ? (
                <div className="py-10 flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
                        progress_activity
                    </span>
                    <p className="text-sm font-medium">Cargando detalle...</p>
                </div>
            ) : !auditoria ? (
                <p className="text-sm text-on-surface-variant">
                    No se encontró el registro solicitado.
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Dato label="Fecha y hora">
                            {formatDateTime(auditoria.created_at)}
                        </Dato>

                        <Dato label="Registro">
                            <span className="font-mono text-xs bg-surface-container px-2 py-0.5 rounded">
                                #{auditoria.id}
                            </span>
                        </Dato>

                        <Dato label="Usuario">
                            {auditoria.usuario ? (
                                <div>
                                    <p className="font-semibold">{auditoria.usuario.name}</p>
                                    <p className="text-xs text-on-surface-variant">
                                        {auditoria.usuario.email}
                                    </p>
                                </div>
                            ) : (
                                <span className="text-on-surface-variant">
                                    Usuario del sistema
                                </span>
                            )}
                        </Dato>

                        <Dato label="Rol">
                            {auditoria.usuario
                                ? ROLE_LABELS[auditoria.usuario.role] ?? auditoria.usuario.role
                                : "—"}
                        </Dato>

                        <Dato label="Tipo de acción">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                <span className="material-symbols-outlined text-[15px]">
                                    history
                                </span>
                                {auditoria.accion_label}
                            </span>
                        </Dato>

                        <Dato label="Categoría">
                            {CATEGORIA_LABELS[auditoria.categoria] ?? auditoria.categoria}
                        </Dato>
                    </div>

                    <Dato label="Detalle de la operación">
                        <div className="mt-1 rounded-xl bg-surface-container-low border border-outline-variant/30 p-3 text-sm text-on-surface whitespace-pre-wrap break-words">
                            {auditoria.detalle || "Sin detalle registrado."}
                        </div>
                    </Dato>

                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-sm font-semibold bg-surface-container-high hover:bg-surface-variant text-on-surface transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
