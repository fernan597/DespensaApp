/**
 * Componente Toast para mostrar notificaciones flotantes de éxito o aviso.
 */
export function Toast({ message, onClose }) {
    if (!message) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-inverse-surface text-inverse-on-surface px-5 py-3.5 rounded-2xl shadow-xl border border-outline-variant/20 animate-fade-in transition-all">
            <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>
            <span className="text-sm font-medium">{message}</span>
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="ml-2 text-inverse-on-surface/70 hover:text-inverse-on-surface"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            )}
        </div>
    );
}
