import { useState } from "react";
import { useCuentaCorrienteProveedor } from "../features/cuentas-corrientes-proveedores/hooks/useCuentaCorrienteProveedor";
import { DetalleMovimientosProveedor } from "../features/cuentas-corrientes-proveedores/components/DetalleMovimientosProveedor";
import { RegistrarPagoProveedorModal } from "../features/cuentas-corrientes-proveedores/components/RegistrarPagoProveedorModal";
import { SearchBar } from "../components/ui/SearchBar";
import { CuentaCorrienteKPIs } from "../features/cuentas-corrientes-common/components/CuentaCorrienteKPIs";
import { formatCurrency } from "../utils/formatters";

/**
 * Página principal de Cuentas Corrientes de Proveedores.
 * Accesible exclusivamente para el rol admin_despensa.
 */
export function CuentaCorrienteProveedor() {
    const [proveedorParaPago, setProveedorParaPago] = useState(null);
    const [isPagoModalOpen, setIsPagoModalOpen] = useState(false);

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

    const handleOpenPago = (proveedor) => {
        setProveedorParaPago(proveedor);
        setIsPagoModalOpen(true);
    };

    const handleClosePago = () => {
        setIsPagoModalOpen(false);
        setProveedorParaPago(null);
    };

    const handlePagoExitoso = () => {
        reload();
    };

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
                <CuentaCorrienteKPIs
                    kpis={{
                        total_deuda_global: kpis.total_deuda_global,
                        cantidad_con_deuda: kpis.cantidad_proveedores_con_deuda,
                        cantidad_al_dia: kpis.cantidad_proveedores_al_dia,
                        total: kpis.total_proveedores,
                    }}
                    loading={loading}
                    deudaLabel="Deuda Total Acumulada"
                    conDeudaLabel="Con Saldo Deudor"
                    alDiaLabel="Cuentas al Día"
                    totalLabel="Proveedores Totales"
                    totalIcon="local_shipping"
                />

                {/* ── Barra de Búsqueda y Filtros de Estado ── */}
                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                    {/* Input de Búsqueda */}
                    <SearchBar
                        variant="input"
                        placeholder="Buscar proveedor por razón social o teléfono..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onClear={() => setSearch("")}
                    />

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
                                        const tieneDeuda = Number(p.saldo_adeudado) > 0;
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

                                                {/* Botones Acción */}
                                                <td className="px-5 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {tieneDeuda && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenPago(p)}
                                                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95"
                                                                title="Registrar pago a este proveedor"
                                                            >
                                                                <span className="material-symbols-outlined text-[16px]">
                                                                    payments
                                                                </span>
                                                                Pagar
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenHistory(p.id)}
                                                            className="inline-flex items-center gap-1.5 bg-surface-container-high hover:bg-surface-variant text-on-surface px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 border border-outline-variant/30"
                                                            title="Ver historial de movimientos"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">
                                                                receipt_long
                                                            </span>
                                                            Historial
                                                        </button>
                                                    </div>
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
                onOpenPago={handleOpenPago}
            />

            {/* ── Modal para Registrar Pago a Proveedor (CU14) ── */}
            <RegistrarPagoProveedorModal
                isOpen={isPagoModalOpen}
                onClose={handleClosePago}
                proveedor={proveedorParaPago}
                onPagoExitoso={handlePagoExitoso}
            />
        </div>
    );
}
