/**
 * Componente reutilizable para filtrado por rango de fechas (fecha_desde y fecha_hasta).
 *
 * @param {Object} props
 * @param {string} props.fechaDesde
 * @param {Function} props.setFechaDesde
 * @param {string} props.fechaHasta
 * @param {Function} props.setFechaHasta
 * @param {Function} props.onApply
 * @param {Function} props.onClear
 * @param {boolean} [props.loading=false]
 */
export function DateRangeFilter({
    fechaDesde,
    setFechaDesde,
    fechaHasta,
    setFechaHasta,
    onApply,
    onClear,
    loading = false,
}) {
    const tieneFiltrosActivos = Boolean(fechaDesde || fechaHasta);

    return (
        <form
            onSubmit={onApply}
            className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/20 flex flex-wrap items-end gap-3 text-xs"
        >
            <div className="flex-1 min-w-[140px]">
                <label className="block text-on-surface-variant font-medium mb-1">
                    Desde:
                </label>
                <input
                    type="date"
                    value={fechaDesde}
                    onChange={(e) => setFechaDesde(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary text-xs"
                />
            </div>

            <div className="flex-1 min-w-[140px]">
                <label className="block text-on-surface-variant font-medium mb-1">
                    Hasta:
                </label>
                <input
                    type="date"
                    value={fechaHasta}
                    onChange={(e) => setFechaHasta(e.target.value)}
                    className="w-full bg-surface-container-high border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface focus:outline-none focus:border-primary text-xs"
                />
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="submit"
                    disabled={loading}
                    className="bg-primary hover:bg-primary/90 text-on-primary font-semibold px-4 py-2 rounded-lg flex items-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                >
                    <span className="material-symbols-outlined text-[16px]">
                        filter_alt
                    </span>
                    Filtrar
                </button>

                {tieneFiltrosActivos && (
                    <button
                        type="button"
                        onClick={onClear}
                        disabled={loading}
                        className="bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold px-3 py-2 rounded-lg transition-all active:scale-95"
                    >
                        Limpiar
                    </button>
                )}
            </div>

            {tieneFiltrosActivos && (
                <div className="w-full text-[11px] text-primary flex items-center gap-1 font-medium mt-1">
                    <span className="material-symbols-outlined text-[14px]">info</span>
                    Mostrando movimientos en el período seleccionado. El saldo inicial refleja los movimientos previos.
                </div>
            )}
        </form>
    );
}
