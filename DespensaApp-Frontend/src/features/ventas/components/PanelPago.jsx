import { useState } from "react";

/**
 * Panel lateral de pago para confirmar la venta de contado.
 * Permite seleccionar cliente (opcional) y medio de pago.
 *
 * @param {{
 *   totalVenta: number,
 *   clientes: object[],
 *   onConfirmar: (payload: object) => Promise<void>,
 *   loading: boolean,
 *   disabled: boolean
 * }} props
 */
export function PanelPago({ totalVenta, clientes = [], onConfirmar, loading, disabled }) {
    const [clienteId, setClienteId] = useState(null);
    const [medioPago, setMedioPago] = useState("EFECTIVO");

    const handleConfirmar = () => {
        onConfirmar({
            cliente_id: clienteId,
            medio_pago: medioPago,
        });
    };

    const mediosPago = [
        { value: "EFECTIVO",      label: "Efectivo",      icon: "payments" },
        { value: "TRANSFERENCIA", label: "Transferencia",  icon: "account_balance" },
        { value: "DEBITO",        label: "Débito",         icon: "credit_card" },
        { value: "CREDITO",       label: "Crédito",        icon: "credit_score" },
    ];

    return (
        <div className="space-y-md">
            {/* Cliente (opcional) */}
            <div className="space-y-xs">
                <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                    Cliente
                </label>
                <select
                    id="select-cliente-venta"
                    value={clienteId ?? ""}
                    onChange={(e) => setClienteId(e.target.value ? Number(e.target.value) : null)}
                    disabled={disabled}
                    className="w-full bg-surface-container-high border border-outline-variant rounded-xl px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
                >
                    <option value="">Consumidor Final</option>
                    {clientes.map((c) => (
                        <option key={c.id} value={c.id}>
                            {c.nombre} {c.apellido}
                        </option>
                    ))}
                </select>
            </div>

            {/* Medio de pago */}
            <div className="space-y-xs">
                <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                    Medio de pago
                </label>
                <div className="grid grid-cols-2 gap-xs">
                    {mediosPago.map(({ value, label, icon }) => (
                        <button
                            key={value}
                            type="button"
                            id={`medio-pago-${value.toLowerCase()}`}
                            onClick={() => setMedioPago(value)}
                            disabled={disabled}
                            className={`flex items-center gap-xs px-md py-sm rounded-xl border text-label-md font-label-md transition-colors disabled:opacity-50
                                ${medioPago === value
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

            {/* Total y botón confirmar */}
            <div className="border-t border-outline-variant pt-md space-y-md">
                <div className="flex items-center justify-between">
                    <span className="text-title-md text-on-surface-variant">Total a cobrar</span>
                    <span className="text-display-sm font-bold text-primary">
                        ${totalVenta.toFixed(2)}
                    </span>
                </div>

                <button
                    id="btn-registrar-venta"
                    onClick={handleConfirmar}
                    disabled={disabled || loading || totalVenta === 0}
                    className="w-full flex items-center justify-center gap-sm py-md bg-primary text-on-primary rounded-2xl text-title-sm font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                point_of_sale
                            </span>
                            Registrar Venta
                        </>
                    )}
                </button>

                {disabled && (
                    <p className="text-label-sm text-on-surface-variant text-center">
                        Abrí la caja para poder registrar ventas.
                    </p>
                )}
            </div>
        </div>
    );
}


