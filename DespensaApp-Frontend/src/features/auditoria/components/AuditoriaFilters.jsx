/**
 * Barra de filtros de la bitácora de auditoría.
 */
export function AuditoriaFilters({
    filtros,
    catalogos,
    loading,
    hayFiltrosActivos,
    onChange,
    onApply,
    onClear,
}) {
    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onApply();
            }}
            className="bg-surface-container-lowest rounded-xl shadow-sm p-4 border border-outline-variant/30 flex flex-col gap-3"
        >
            <div className="flex flex-col xl:flex-row gap-3">
                {/* Búsqueda por texto */}
                <div className="relative flex-1 min-w-[220px]">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                        search
                    </span>
                    <input
                        type="text"
                        value={filtros.search}
                        onChange={(event) => onChange("search", event.target.value)}
                        placeholder="Buscar por usuario, correo o detalle..."
                        className="w-full h-11 pl-10 pr-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm text-on-surface outline-none transition-shadow placeholder:text-outline"
                    />
                </div>

                {/* Tipo de acción */}
                <div className="relative w-full xl:w-56">
                    <select
                        value={filtros.accion}
                        onChange={(event) => onChange("accion", event.target.value)}
                        className="appearance-none w-full h-11 px-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm text-on-surface outline-none cursor-pointer pr-10"
                    >
                        <option value="">Acción: Todas</option>
                        {catalogos.acciones.map((accion) => (
                            <option key={accion.value} value={accion.value}>
                                {accion.label}
                            </option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                        expand_more
                    </span>
                </div>

                {/* Usuario */}
                <div className="relative w-full xl:w-56">
                    <select
                        value={filtros.userId}
                        onChange={(event) => onChange("userId", event.target.value)}
                        className="appearance-none w-full h-11 px-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm text-on-surface outline-none cursor-pointer pr-10"
                    >
                        <option value="">Usuario: Todos</option>
                        {catalogos.usuarios.map((usuario) => (
                            <option key={usuario.id} value={usuario.id}>
                                {usuario.name} ({usuario.email})
                            </option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                        expand_more
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        Desde
                    </label>
                    <input
                        type="date"
                        value={filtros.fechaDesde}
                        onChange={(event) => onChange("fechaDesde", event.target.value)}
                        className="w-full h-10 bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex-1 min-w-[140px]">
                    <label className="block text-[11px] font-semibold text-on-surface-variant mb-1">
                        Hasta
                    </label>
                    <input
                        type="date"
                        value={filtros.fechaHasta}
                        onChange={(event) => onChange("fechaHasta", event.target.value)}
                        className="w-full h-10 bg-surface-container border border-outline-variant/40 rounded-lg px-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </div>

                <div className="flex items-center gap-2 sm:ml-auto">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-on-primary font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 text-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            filter_alt
                        </span>
                        Filtrar
                    </button>

                    {hayFiltrosActivos && (
                        <button
                            type="button"
                            onClick={onClear}
                            disabled={loading}
                            className="bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold px-4 py-2.5 rounded-lg text-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                            Limpiar
                        </button>
                    )}
                </div>
            </div>
        </form>
    );
}
