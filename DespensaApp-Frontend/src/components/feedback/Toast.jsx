import { useEffect } from "react";

/**
 * Componente Toast para mostrar notificaciones flotantes de éxito, error o aviso.
 *
 * @param {Object} props
 * @param {string|null} props.message - Texto a mostrar
 * @param {"success"|"error"|"warning"|"info"} [props.type="success"] - Tipo de notificación
 * @param {Function} [props.onClose] - Callback para cerrar
 * @param {number} [props.duration=4000] - Tiempo en ms para auto-cerrar (0 para desactivar)
 */
export function Toast({
    message,
    type = "success",
    onClose,
    duration = 4000,
}) {
    useEffect(() => {
        if (!message || !duration || !onClose) return;

        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [message, duration, onClose]);

    if (!message) return null;

    const config = {
        success: {
            icon: "check_circle",
            iconColor: "text-emerald-400",
            borderColor: "border-emerald-500/30",
        },
        error: {
            icon: "error",
            iconColor: "text-rose-400",
            borderColor: "border-rose-500/40",
        },
        warning: {
            icon: "warning",
            iconColor: "text-amber-400",
            borderColor: "border-amber-500/30",
        },
        info: {
            icon: "info",
            iconColor: "text-sky-400",
            borderColor: "border-sky-500/30",
        },
    }[type] || {
        icon: "check_circle",
        iconColor: "text-emerald-400",
        borderColor: "border-emerald-500/30",
    };

    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-inverse-surface text-inverse-on-surface px-5 py-3.5 rounded-2xl shadow-2xl border ${config.borderColor} animate-fade-in transition-all max-w-md`}>
            <span className={`material-symbols-outlined text-[20px] shrink-0 ${config.iconColor}`}>
                {config.icon}
            </span>
            <span className="text-sm font-medium leading-snug flex-1">
                {message}
            </span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-2 text-inverse-on-surface/70 hover:text-inverse-on-surface p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
                    title="Cerrar notificación"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            )}
        </div>
    );
}
