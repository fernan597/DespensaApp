import { useEffect } from "react";

/**
 * Componente Modal genérico y accesible
 *
 * @param {boolean} isOpen - Estado de visibilidad del modal
 * @param {Function} onClose - Callback al cerrar
 * @param {string|React.ReactNode} title - Título del encabezado
 * @param {React.ReactNode} children - Contenido interior
 * @param {string} [maxWidth="max-w-md"] - Clase Tailwind para el ancho máximo (ej. max-w-lg, max-w-sm)
 * @param {number} [zIndex=50] - Índice z para permitir modales superpuestos
 */
export function Modal({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = "max-w-md",
    zIndex = 50,
}) {
    // Cerrar modal al presionar Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4`}
            style={{ zIndex }}
            onClick={onClose}
        >
            <div
                className={`bg-surface-container-lowest w-full ${maxWidth} rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-outline-variant/30 max-h-[90vh] overflow-y-auto`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Encabezado del modal */}
                <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                    <h2 className="text-lg font-bold text-on-surface">
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-on-surface transition-colors p-1 rounded-lg hover:bg-surface-container"
                        title="Cerrar (Esc)"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Contenido */}
                {children}
            </div>
        </div>
    );
}
