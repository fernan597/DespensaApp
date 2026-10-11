import { useState } from "react";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Panel lateral de pago para confirmar la venta.
 * Soporta ventas de Contado (múltiples medios de pago) y a Crédito (Fiado en cuenta corriente).
 *
 * @param {{
 *   totalVenta: number,
 *   clienteSeleccionado: object|null,
 *   onOpenClienteModal: () => void,
 *   onClearCliente: () => void,
 *   onConfirmar: (payload: { tipo_venta: string, cliente_id: number|null, medio_pago: string }) => Promise<void>,
 *   loading: boolean,
 *   cajaAbierta: boolean,
 *   itemsLength?: number,
 *   disabled?: boolean
 * }} props
 */
export function PanelPago({
    totalVenta,
    clienteSeleccionado = null,
    onOpenClienteModal,
    onClearCliente,
    onConfirmar,
    loading = false,
    cajaAbierta = true,
    itemsLength = 0,
    disabled = false,
}) {
    const [tipoVenta, setTipoVenta] = useState("CONTADO"); // "CONTADO" | "CREDITO"
    const [medioPago, setMedioPago] = useState("EFECTIVO");

    const esCredito = tipoVenta === "CREDITO";
    const isCajaHabilitada = cajaAbierta && !disabled;
    const puedeConfirmar =
        isCajaHabilitada &&
        !loading &&
        totalVenta > 0 &&
        (!esCredito || !!clienteSeleccionado);

    const handleConfirmar = () => {
        if (!puedeConfirmar) return;

        onConfirmar({
            tipo_venta: tipoVenta,
            cliente_id: clienteSeleccionado?.id ?? null,
            medio_pago: esCredito ? "CREDITO" : medioPago,
        });
    };

    const mediosPagoContado = [
        { value: "EFECTIVO",      label: "Efectivo",       icon: "payments" },
        { value: "TRANSFERENCIA", label: "Transferencia",  icon: "account_balance" },
        { value: "DEBITO",        label: "Débito",         icon: "credit_card" },
        { value: "CREDITO",       label: "Tarjeta Crédito",icon: "credit_score" },
    ];

    const saldoCliente = Number(clienteSeleccionado?.saldo_cuenta_corriente ?? 0);
    const nuevoSaldoEstimado = saldoCliente + totalVenta;

    return (
        <div className="space-y-md">
            {/* Selector de Modalidad: Contado vs Crédito */}
            <div className="space-y-xs">
                <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                    Modalidad de Venta
                </label>
                <div className="grid grid-cols-2 gap-xs p-1 bg-surface-container rounded-2xl border border-outline-variant/30">
                    <button
                        type="button"
                        id="tab-venta-contado"
                        onClick={() => setTipoVenta("CONTADO")}
                        disabled={!isCajaHabilitada}
                        className={`flex items-center justify-center gap-xs py-2 px-3 rounded-xl text-label-md font-bold transition-all ${
                            !esCredito
                                ? "bg-primary text-on-primary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">payments</span>
                        Contado
                    </button>
                    <button
                        type="button"
                        id="tab-venta-credito"
                        onClick={() => {
                            setTipoVenta("CREDITO");
                            if (!clienteSeleccionado) {
                                onOpenClienteModal?.();
                            }
                        }}
                        disabled={!isCajaHabilitada}
                        className={`flex items-center justify-center gap-xs py-2 px-3 rounded-xl text-label-md font-bold transition-all ${
                            esCredito
                                ? "bg-secondary text-on-secondary shadow-sm"
                                : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                        }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                        Crédito / Fiado
                    </button>
                </div>
            </div>

            {/* Sección de Cliente */}
            <div className="space-y-xs">
                <div className="flex items-center justify-between">
                    <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                        Cliente {esCredito && <span className="text-error font-bold">*</span>}
                    </label>
                    {clienteSeleccionado && (
                        <button
                            type="button"
                            onClick={onClearCliente}
                            className="text-xs text-on-surface-variant hover:text-error transition-colors"
                        >
                            Quitar cliente
                        </button>
                    )}
                </div>

                {clienteSeleccionado ? (
                    <div className="p-3 bg-surface-container-high border border-outline-variant/50 rounded-2xl flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">
                                {clienteSeleccionado.nombre} {clienteSeleccionado.apellido || ""}
                            </p>
                            <p className="text-xs text-on-surface-variant truncate">
                                {clienteSeleccionado.telefono ? `Tel: ${clienteSeleccionado.telefono}` : "Cliente registrado"}
                            </p>
                            {esCredito && (
                                <p className="text-xs font-semibold text-secondary mt-1">
                                    Deuda actual: {formatCurrency(saldoCliente)}
                                    <span className="text-on-surface-variant font-normal">
                                        {" "}➔ Nuevo: {formatCurrency(nuevoSaldoEstimado)}
                                    </span>
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={onOpenClienteModal}
                            className="shrink-0 px-2.5 py-1 text-xs font-medium bg-surface-container rounded-lg hover:bg-surface-container-highest transition-colors text-primary border border-outline-variant/30"
                        >
                            Cambiar
                        </button>
                    </div>
                ) : (
                    <div>
                        <button
                            type="button"
                            id="btn-seleccionar-cliente"
                            onClick={onOpenClienteModal}
                            disabled={!isCajaHabilitada}
                            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                                esCredito
                                    ? "bg-error-container/20 border-error/50 text-error hover:bg-error-container/40"
                                    : "bg-surface-container-high border-outline-variant text-on-surface hover:bg-surface-container-highest"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                {esCredito ? "person_alert" : "person_add"}
                            </span>
                            {esCredito ? "Seleccionar Cliente (Requerido)" : "Consumidor Final (Clic para asignar)"}
                        </button>
                        {esCredito && (
                            <p className="text-xs text-error mt-1">
                                Para vender a crédito debés seleccionar un cliente registrado.
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Medios de pago (solo para venta de Contado) */}
            {!esCredito ? (
                <div className="space-y-xs">
                    <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                        Medio de pago
                    </label>
                    <div className="grid grid-cols-2 gap-xs">
                        {mediosPagoContado.map(({ value, label, icon }) => (
                            <button
                                key={value}
                                type="button"
                                id={`medio-pago-${value.toLowerCase()}`}
                                onClick={() => setMedioPago(value)}
                                disabled={!isCajaHabilitada}
                                className={`flex items-center gap-xs px-md py-sm rounded-xl border text-label-md font-label-md transition-colors disabled:opacity-50 ${
                                    medioPago === value
                                        ? "bg-primary text-on-primary border-primary"
                                        : "bg-surface-container border-outline-variant text-on-surface hover:bg-surface-container-high"
                                }`}
                            >
                                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                /* Banner informativo para venta a Crédito */
                <div className="p-3 bg-secondary-container/30 border border-secondary/30 rounded-2xl flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                        info
                    </span>
                    <p className="text-xs text-on-surface-variant">
                        Esta venta se registrará como <strong>débito</strong> en la cuenta corriente del cliente.
                        <strong> No ingresará dinero a la caja.</strong>
                    </p>
                </div>
            )}

            {/* Total y botón confirmar */}
            <div className="border-t border-outline-variant pt-md space-y-md">
                <div className="flex items-center justify-between">
                    <span className="text-title-md text-on-surface-variant">Total a cobrar</span>
                    <span className={`text-display-sm font-bold ${esCredito ? "text-secondary" : "text-primary"}`}>
                        {formatCurrency(totalVenta)}
                    </span>
                </div>

                <button
                    id="btn-registrar-venta"
                    onClick={handleConfirmar}
                    disabled={!puedeConfirmar}
                    className={`w-full flex items-center justify-center gap-sm py-md text-on-primary rounded-2xl text-title-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm ${
                        esCredito
                            ? "bg-secondary hover:bg-secondary/90"
                            : "bg-primary hover:bg-primary/90"
                    }`}
                >
                    {loading ? (
                        <>
                            <span className="material-symbols-outlined text-[20px] animate-spin">
                                progress_activity
                            </span>
                            Registrando...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[20px]">
                                {esCredito ? "receipt_long" : "point_of_sale"}
                            </span>
                            {esCredito ? "Confirmar Venta a Crédito" : "Registrar Venta"}
                        </>
                    )}
                </button>

                {!isCajaHabilitada ? (
                    <p className="text-label-sm text-error text-center font-medium">
                        Abrí la caja para poder registrar ventas.
                    </p>
                ) : totalVenta <= 0 ? (
                    <p className="text-label-sm text-on-surface-variant text-center">
                        Agregá productos al carrito para continuar.
                    </p>
                ) : null}
            </div>
        </div>
    );
}
