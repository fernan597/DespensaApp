/**
 * Componente InputField reutilizable con soporte para etiquetas, iconos, errores y badges auxiliares.
 */
export function InputField({
    label,
    error,
    helper,
    icon,
    className = "",
    required = false,
    ...props
}) {
    return (
        <div className="flex flex-col gap-1 w-full">
            {(label || helper) && (
                <div className="flex items-center justify-between">
                    {label && (
                        <label className="text-xs font-medium text-on-surface">
                            {label} {required && <span className="text-error">*</span>}
                        </label>
                    )}
                    {helper}
                </div>
            )}
            <div className="relative flex items-center">
                {icon && (
                    <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
                        {icon}
                    </span>
                )}
                <input
                    required={required}
                    className={`w-full h-10 bg-surface-container rounded-lg px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-outline transition-all ${
                        icon ? "pl-10" : ""
                    } ${
                        error ? "ring-2 ring-error bg-error-container/10" : ""
                    } ${className}`}
                    {...props}
                />
            </div>
            {error && (
                <span className="text-xs text-error flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px]">error</span>
                    {error}
                </span>
            )}
        </div>
    );
}
