import { useEffect } from "react";

/**
 * Modal de confirmación para acciones críticas o destructivas.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Visibilidad del modal
 * @param {Function} props.onClose - Función para cancelar/cerrar
 * @param {Function} props.onConfirm - Función para confirmar la acción
 * @param {string} [props.title="¿Confirmar acción?"] - Título del modal
 * @param {React.ReactNode} props.message - Mensaje o descripción explicativa
 * @param {string} [props.confirmText="Confirmar"] - Texto del botón de confirmación
 * @param {string} [props.cancelText="Cancelar"] - Texto del botón de cancelación
 * @param {"danger"|"warning"|"primary"} [props.variant="danger"] - Variante visual
 * @param {string} [props.icon="warning"] - Ícono Material Symbols
 * @param {boolean} [props.loading=false] - Indica si la acción está en procesamiento
 * @param {React.ReactNode} [props.extraContent] - Contenido adicional o advertencias
 */
export function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "¿Confirmar acción?",
    message,
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    variant = "danger",
    icon = "warning",
    loading = false,
    extraContent = null,
}) {
    // Cerrar al presionar Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && !loading) {
                onClose?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose, loading]);

    if (!isOpen) return null;

    // Configuración según la variante
    const variantConfig = {
        danger: {
            iconBg: "bg-error-container text-error",
            btnConfirm: "bg-error hover:bg-error/90 text-on-error shadow-error/20",
        },
        warning: {
            iconBg: "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
            btnConfirm: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
        },
        primary: {
            iconBg: "bg-primary-container text-primary",
            btnConfirm: "bg-primary hover:bg-primary/90 text-on-primary shadow-primary/20",
        },
    }[variant] || {
        iconBg: "bg-error-container text-error",
        btnConfirm: "bg-error hover:bg-error/90 text-on-error shadow-error/20",
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={!loading ? onClose : undefined}
        >
            <div
                className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-5 border border-outline-variant/30"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Encabezado con ícono temático */}
                <div className="flex items-start gap-4">
                    <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${variantConfig.iconBg}`}
                    >
                        <span className="material-symbols-outlined text-[26px]">
                            {icon}
                        </span>
                    </div>
                    <div className="flex-1">
                        <h2 className="text-lg font-bold text-on-surface leading-snug">
                            {title}
                        </h2>
                        <div className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
                            {message}
                        </div>
                    </div>
                </div>

                {/* Contenido extra opcional (ej: avisos de deudas) */}
                {extraContent && (
                    <div className="mt-1">
                        {extraContent}
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl text-xs font-semibold text-on-surface bg-surface-container hover:bg-surface-variant transition-all disabled:opacity-50 active:scale-95"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={`px-5 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-md active:scale-95 flex items-center gap-2 disabled:opacity-50 ${variantConfig.btnConfirm}`}
                    >
                        {loading && (
                            <span className="material-symbols-outlined text-[16px] animate-spin">
                                progress_activity
                            </span>
                        )}
                        <span>{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
