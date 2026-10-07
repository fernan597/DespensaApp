import { useCuentaCorrienteProveedor } from "../features/cuentas-corrientes-proveedores/hooks/useCuentaCorrienteProveedor";
import { DetalleMovimientosProveedor } from "../features/cuentas-corrientes-proveedores/components/DetalleMovimientosProveedor";

/**
 * Formatea un número como moneda ARS ($ 1.250,00).
 */
const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(num);
};

/**
 * Página principal de Cuentas Corrientes de Proveedores (CU13).
 * Accesible exclusivamente para el rol admin_despensa.
 */
export function CuentaCorrienteProveedor() {
    const {
        proveedores,
        kpis,
        loading,
        search,
        setSearch,
        estadoFiltro,
        setEstadoFiltro,
        selectedProveedorId,
        isHistoryModalOpen,
        handleOpenHistory,
        handleCloseHistory,
        reload,
    } = useCuentaCorrienteProveedor();

    return (
        <div className="bg-surface text-on-surface min-h-screen p-6 font-body-md">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">

                {/* ── Encabezado ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[28px]">
                                account_balance_wallet
                            </span>
                            Cuentas Corrientes de Proveedores
                        </h1>
                        <p className="text-sm text-on-surface-variant">
                            Control de saldos adeudados y auditoría de movimientos con proveedores
                        </p>
                    </div>

                    <button
                        onClick={reload}
                        disabled={loading}
                        className="self-start sm:self-auto flex items-center gap-2 bg-surface-container-high hover:bg-surface-variant text-on-surface px-4 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
                    >
                        <span className={`material-symbols-outlined text-[18px] ${loading ? "animate-spin" : ""}`}>
                            refresh
                        </span>
                        Actualizar
                    </button>
                </div>

                {/* ── Tarjetas KPI Resumen Global ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Deuda Global */}
                    <div className={`rounded-2xl border shadow-sm p-5 flex items-center gap-4 bg-surface-container-lowest ${
                        kpis.total_deuda_global > 0 ? "border-error/30" : "border-outline-variant/30"
                    }`}>
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                            kpis.total_deuda_global > 0 ? "bg-error-container" : "bg-secondary-container"
                        }`}>
                            <span className={`material-symbols-outlined text-[24px] ${
                                kpis.total_deuda_global > 0 ? "text-on-error-container" : "text-on-secondary-container"
                            }`}>
                                payments
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                                Deuda Total Acumulada
                            </p>
                            <p className={`text-xl font-bold ${
                                kpis.total_deuda_global > 0 ? "text-error" : "text-primary"
                            }`}>
                                {loading ? "—" : formatCurrency(kpis.total_deuda_global)}
                            </p>
                        </div>
                    </div>

                    {/* Proveedores con Deuda */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-error-container/60 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-error text-[24px]">
                                warning
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                                Con Saldo Deudor
                            </p>
                            <p className="text-xl font-bold text-on-surface">
                                {loading ? "—" : kpis.cantidad_proveedores_con_deuda}
                            </p>
                        </div>
                    </div>

                    {/* Proveedores al Día */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-primary text-[24px]">
                                check_circle
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                                Cuentas al Día
                            </p>
                            <p className="text-xl font-bold text-primary">
                                {loading ? "—" : kpis.cantidad_proveedores_al_dia}
                            </p>
                        </div>
                    </div>

                    {/* Total de Proveedores */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-on-surface-variant text-[24px]">
                                local_shipping
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                                Proveedores Totales
                            </p>
                            <p className="text-xl font-bold text-on-surface">
                                {loading ? "—" : kpis.total_proveedores}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Barra de Búsqueda y Filtros de Estado ── */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Input de Búsqueda */}
                    <div className="relative w-full md:w-96">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            placeholder="Buscar proveedor por razón social o teléfono..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-surface border border-outline-variant/50 rounded-xl text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-primary text-sm transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined text-[16px]">close</span>
                            </button>
                        )}
                    </div>

                    {/* Filtros de Estado (Pestañas) */}
                    <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setEstadoFiltro("todos")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                estadoFiltro === "todos"
                                    ? "bg-surface-container-lowest text-primary shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            Todos ({kpis.total_proveedores})
                        </button>
                        <button
                            type="button"
                            onClick={() => setEstadoFiltro("con_deuda")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                estadoFiltro === "con_deuda"
                                    ? "bg-surface-container-lowest text-error shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            Con Saldo Deudor ({kpis.cantidad_proveedores_con_deuda})
                        </button>
                        <button
                            type="button"
                            onClick={() => setEstadoFiltro("al_dia")}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                estadoFiltro === "al_dia"
                                    ? "bg-surface-container-lowest text-primary shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            Al Día ({kpis.cantidad_proveedores_al_dia})
                        </button>
                    </div>
                </div>

                {/* ── Tabla de Proveedores y Saldos ── */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-surface-container-low text-on-surface-variant uppercase text-xs tracking-wider font-semibold border-b border-outline-variant/30">
                                <tr>
                                    <th className="px-5 py-3.5">Proveedor</th>
                                    <th className="px-5 py-3.5">Contacto</th>
                                    <th className="px-5 py-3.5 text-center">Estado de Cuenta</th>
                                    <th className="px-5 py-3.5 text-right">Saldo Adeudado</th>
                                    <th className="px-5 py-3.5 text-center">Movimientos</th>
                                    <th className="px-5 py-3.5 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-outline-variant/10">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-on-surface-variant">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined animate-spin text-[32px] text-primary">
                                                    progress_activity
                                                </span>
                                                <span className="text-sm">Cargando estado de cuentas corrientes...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : proveedores.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-on-surface-variant">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-outlined text-[40px] text-outline-variant">
                                                    inbox
                                                </span>
                                                <p className="font-semibold text-base">No se encontraron proveedores</p>
                                                <p className="text-xs">
                                                    {search
                                                        ? `No hay resultados que coincidan con "${search}".`
                                                        : "No hay cuentas de proveedores para el filtro seleccionado."}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    proveedores.map((p) => {
                                        const tieneDeuda = p.saldo_adeudado > 0;
                                        return (
                                            <tr
                                                key={p.id}
                                                className="hover:bg-surface-container-low/40 transition-colors"
                                            >
                                                {/* Nombre */}
                                                <td className="px-5 py-4 font-semibold text-on-surface">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                                            tieneDeuda ? "bg-error-container/70 text-error" : "bg-secondary-container text-primary"
                                                        }`}>
                                                            <span className="material-symbols-outlined text-[18px]">
                                                                local_shipping
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span>{p.razon_social}</span>
                                                            {p.direccion && (
                                                                <p className="text-xs text-on-surface-variant font-normal">
                                                                    {p.direccion}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Contacto */}
                                                <td className="px-5 py-4 text-on-surface-variant text-xs">
                                                    {p.telefono ? (
                                                        <span className="flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[14px]">
                                                                phone
                                                            </span>
                                                            {p.telefono}
                                                        </span>
                                                    ) : (
                                                        <span className="text-outline-variant">—</span>
                                                    )}
                                                </td>

                                                {/* Estado de Cuenta */}
                                                <td className="px-5 py-4 text-center">
                                                    <span
                                                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                                            tieneDeuda
                                                                ? "bg-error-container text-on-error-container"
                                                                : "bg-secondary-container text-on-secondary-container"
                                                        }`}
                                                    >
                                                        <span className="material-symbols-outlined text-[14px]">
                                                            {tieneDeuda ? "pending_actions" : "check_circle"}
                                                        </span>
                                                        {tieneDeuda ? "Saldo Deudor" : "Al Día"}
                                                    </span>
                                                </td>

                                                {/* Saldo adeudado */}
                                                <td
                                                    className={`px-5 py-4 text-right font-bold text-base ${
                                                        tieneDeuda ? "text-error" : "text-primary"
                                                    }`}
                                                >
                                                    {formatCurrency(p.saldo_adeudado)}
                                                </td>

                                                {/* Cantidad de Movimientos */}
                                                <td className="px-5 py-4 text-center text-xs text-on-surface-variant">
                                                    <span className="bg-surface-container px-2.5 py-1 rounded-lg font-mono">
                                                        {p.total_movimientos} mov.
                                                    </span>
                                                </td>

                                                {/* Botón Acción */}
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenHistory(p.id)}
                                                        className="inline-flex items-center gap-1.5 bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                                                        title="Ver historial de movimientos"
                                                    >
                                                        <span className="material-symbols-outlined text-[16px]">
                                                            receipt_long
                                                        </span>
                                                        Historial
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            {/* ── Modal de Historial y Movimientos ── */}
            <DetalleMovimientosProveedor
                isOpen={isHistoryModalOpen}
                onClose={handleCloseHistory}
                proveedorId={selectedProveedorId}
            />
        </div>
    );
}
