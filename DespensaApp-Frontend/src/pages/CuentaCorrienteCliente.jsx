import { useCuentaCorrienteCliente } from "../features/cuentas-corrientes-clientes/hooks/useCuentaCorrienteCliente";
import { DetalleMovimientosClienteModal } from "../features/cuentas-corrientes-clientes/components/DetalleMovimientosClienteModal";
import { RegistrarCobroModal } from "../features/cuentas-corrientes-clientes/components/RegistrarCobroModal";
import { CuentaCorrienteKPIs } from "../features/cuentas-corrientes-common/components/CuentaCorrienteKPIs";
import { SearchBar } from "../components/ui/SearchBar";
import { Toast } from "../components/feedback/Toast";
import { formatCurrency } from "../utils/formatters";

/**
 * Página principal de Cuentas Corrientes de Clientes (CU11 y CU12).
 * Accesible para admin_despensa y empleado.
 */
export function CuentaCorrienteCliente() {
    const {
        clientes,
        kpis,
        pagination,
        page,
        setPage,
        loading,
        search,
        setSearch,
        estadoFiltro,
        setEstadoFiltro,
        selectedClienteId,
        isHistoryModalOpen,
        handleOpenHistory,
        handleCloseHistory,
        selectedClienteCobro,
        isCobroModalOpen,
        handleOpenCobro,
        handleCloseCobro,
        handleCobroExitoso,
        toastMessage,
        setToastMessage,
        reload,
    } = useCuentaCorrienteCliente();

    return (
        <div className="bg-surface text-on-surface min-h-screen p-6 font-body-md">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">

                {/* ── Encabezado ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary text-[28px]">
                                contact_page
                            </span>
                            Cuentas Corrientes de Clientes
                        </h1>
                        <p className="text-sm text-on-surface-variant">
                            Control financiero de compras fiadas a crédito y cobros de clientes
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
                <CuentaCorrienteKPIs
                    kpis={{
                        total_deuda_global: kpis.total_deuda_global,
                        cantidad_con_deuda: kpis.cantidad_clientes_con_deuda,
                        cantidad_al_dia: kpis.cantidad_clientes_al_dia,
                        total: kpis.total_clientes,
                    }}
                    loading={loading}
                    deudaLabel="Total Fiado Pendiente"
                    conDeudaLabel="Clientes Deudores"
                    alDiaLabel="Cuentas al Día"
                    totalLabel="Clientes Registrados"
                    totalIcon="group"
                />

                {/* ── Barra de Búsqueda y Filtros de Estado ── */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Input de Búsqueda */}
                    <SearchBar
                        variant="input"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                        placeholder="Buscar cliente por nombre o teléfono..."
                    />

                    {/* Filtros de Estado */}
                    <div className="flex items-center gap-1.5 bg-surface-container p-1 rounded-xl border border-outline-variant/30 w-full md:w-auto self-stretch md:self-auto justify-center">
                        <button
                            onClick={() => setEstadoFiltro("todos")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${estadoFiltro === "todos"
                                    ? "bg-surface-container-lowest text-primary shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                                }`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setEstadoFiltro("con_deuda")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${estadoFiltro === "con_deuda"
                                    ? "bg-surface-container-lowest text-error shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-error" />
                            Con Deuda
                        </button>
                        <button
                            onClick={() => setEstadoFiltro("al_dia")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${estadoFiltro === "al_dia"
                                    ? "bg-surface-container-lowest text-secondary shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                                }`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                            Al Día
                        </button>
                    </div>
                </div>

                {/* ── Tabla de Clientes y Saldos ── */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-sm text-on-surface-variant flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-[24px] text-primary">
                                progress_activity
                            </span>
                            Cargando cuentas corrientes...
                        </div>
                    ) : clientes.length === 0 ? (
                        <div className="p-12 text-center text-on-surface-variant flex flex-col items-center gap-2">
                            <span className="material-symbols-outlined text-outline text-[48px]">
                                group_off
                            </span>
                            <p className="font-semibold text-base">No se encontraron clientes.</p>
                            <p className="text-xs">
                                {search
                                    ? `No hay coincidencias para "${search}".`
                                    : "No hay clientes registrados en esta categoría."}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4 font-semibold">Cliente</th>
                                        <th className="p-4 font-semibold">Teléfono / Dirección</th>
                                        <th className="p-4 font-semibold text-center">Estado</th>
                                        <th className="p-4 font-semibold text-right">Saldo Adeudado</th>
                                        <th className="p-4 font-semibold text-center">Movimientos</th>
                                        <th className="p-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20">
                                    {clientes.map((c) => {
                                        const tieneDeuda = c.saldo_cuenta_corriente > 0;

                                        return (
                                            <tr
                                                key={c.id}
                                                className="hover:bg-surface-container-low transition-colors"
                                            >
                                                {/* Cliente */}
                                                <td className="p-4 font-bold text-on-surface">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary-container/40 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                                            {c.nombre.charAt(0)}
                                                        </div>
                                                        <span className="truncate">
                                                            {c.nombre_completo}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Teléfono / Dirección */}
                                                <td className="p-4 text-xs text-on-surface-variant">
                                                    <p className="font-medium text-on-surface">
                                                        {c.telefono || "Sin teléfono"}
                                                    </p>
                                                    <p className="text-[11px] truncate max-w-xs text-outline">
                                                        {c.direccion || "Sin dirección"}
                                                    </p>
                                                </td>

                                                {/* Estado */}
                                                <td className="p-4 text-center">
                                                    <span
                                                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${tieneDeuda
                                                                ? "bg-error-container text-on-error-container"
                                                                : "bg-secondary-fixed text-on-secondary-fixed"
                                                            }`}
                                                    >
                                                        {tieneDeuda ? "DEUDOR" : "AL DÍA"}
                                                    </span>
                                                </td>

                                                {/* Saldo adeudado */}
                                                <td className="p-4 text-right whitespace-nowrap">
                                                    <span
                                                        className={`font-bold font-mono text-base ${tieneDeuda ? "text-error" : "text-primary"
                                                            }`}
                                                    >
                                                        {formatCurrency(c.saldo_cuenta_corriente)}
                                                    </span>
                                                </td>

                                                {/* Total movimientos */}
                                                <td className="p-4 text-center text-xs text-on-surface-variant whitespace-nowrap">
                                                    <span className="bg-surface-container px-2 py-1 rounded-md font-medium text-on-surface">
                                                        {c.total_movimientos} op.
                                                    </span>
                                                    {c.ultimo_movimiento_at && (
                                                        <p className="text-[10px] text-outline mt-1">
                                                            {new Date(c.ultimo_movimiento_at).toLocaleDateString("es-AR")}
                                                        </p>
                                                    )}
                                                </td>

                                                {/* Acciones */}
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {tieneDeuda && (
                                                            <button
                                                                onClick={() => handleOpenCobro(c)}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-on-primary transition-all active:scale-95 shadow-sm"
                                                                title="Registrar cobro / entrega"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">
                                                                    price_check
                                                                </span>
                                                                <span>Cobrar</span>
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleOpenHistory(c.id)}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-variant transition-all text-on-surface border border-outline-variant/30 active:scale-95 shadow-sm"
                                                            title="Ver historial de movimientos"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                history
                                                            </span>
                                                            <span>Ver Extracto</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* ── Modal de Extracto de Movimientos ── */}
                <DetalleMovimientosClienteModal
                    isOpen={isHistoryModalOpen}
                    onClose={handleCloseHistory}
                    clienteId={selectedClienteId}
                    onOpenCobro={(cli) => {
                        handleCloseHistory();
                        handleOpenCobro(cli);
                    }}
                />

                {/* ── Modal para Registrar Cobro / Entrega (CU12) ── */}
                <RegistrarCobroModal
                    isOpen={isCobroModalOpen}
                    onClose={handleCloseCobro}
                    cliente={selectedClienteCobro}
                    onCobroExitoso={handleCobroExitoso}
                />

                {/* ── Toast de Notificación Flotante ── */}
                <Toast
                    message={toastMessage}
                    onClose={() => setToastMessage(null)}
                />
            </div>
        </div>
    );
}
