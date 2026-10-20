/**
 * Componente reutilizable de barra de búsqueda con soporte para variantes,
 * botón de limpieza instantánea y slots adicionales.
 *
 * @param {Object} props
 * @param {string} props.value - Valor del input
 * @param {Function} props.onChange - Callback al escribir
 * @param {Function} [props.onClear] - Callback al hacer click en la cruz
 * @param {string} [props.placeholder="Buscar..."]
 * @param {"card"|"input"} [props.variant="card"] - "card": contenedor tipo tarjeta; "input": input compacto con icono flotante
 * @param {React.Ref} [props.inputRef] - Ref opcional para el elemento input
 * @param {boolean} [props.autoFocus=false]
 * @param {string} [props.className=""] - Clases adicionales para el contenedor
 * @param {React.ReactNode} [props.children] - Contenido extra a la derecha (ej. badges o chips)
 * @param {string} [props.id]
 */
export function SearchBar({
    value,
    onChange,
    onClear,
    placeholder = "Buscar...",
    variant = "card",
    inputRef,
    autoFocus = false,
    className = "",
    children,
    id,
}) {
    const handleClear = () => {
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange({ target: { value: "" } });
        }
    };

    if (variant === "input") {
        return (
            <div className={`relative w-full md:w-96 ${className}`}>
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none select-none">
                    search
                </span>
                <input
                    ref={inputRef}
                    id={id}
                    type="text"
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full pl-10 pr-9 py-2 bg-surface border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                        aria-label="Limpiar búsqueda"
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={`bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-3 ${className}`}>
            <span className="material-symbols-outlined text-on-surface-variant select-none">search</span>
            <input
                ref={inputRef}
                id={id}
                type="text"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className="w-full bg-transparent font-body-md text-on-surface placeholder:text-outline focus:outline-none"
            />
            {children}
            {value && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
                    aria-label="Limpiar búsqueda"
                >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
            )}
        </div>
    );
}
