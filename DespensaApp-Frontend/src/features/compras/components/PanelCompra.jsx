import { InputField } from "../../../components/ui/InputField";

const TIPOS_PAGO = [
    { value: "CONTADO", label: "Contado", icon: "payments" },
    { value: "CREDITO", label: "Crédito", icon: "credit_score" },
];

/**
 * Panel lateral de la compra: proveedor, tipo de pago, comprobante y confirmación.
 *
 * @param {{
 *   proveedores: object[],
 *   proveedorId: number|null,
 *   onProveedorChange: (id: number|null) => void,
 *   tipoPago: "CONTADO"|"CREDITO",
 *   onTipoPagoChange: (tipo: string) => void,
 *   numeroComprobante: string,
 *   onNumeroComprobanteChange: (value: string) => void,
 *   totalCompra: number,
 *   onConfirmar: () => void,
 *   loading: boolean,
 *   disabled: boolean,
 *   errorProveedor?: string,
 *   aviso?: string
 * }} props
 */
export function PanelCompra({
    proveedores = [],
    proveedorId,
    onProveedorChange,
    tipoPago,
    onTipoPagoChange,
    numeroComprobante,
    onNumeroComprobanteChange,
    totalCompra,
    onConfirmar,
    loading,
    disabled,
    errorProveedor = "",
    aviso = "",
}) {
    const proveedorSeleccionado = proveedores.find((p) => p.id === proveedorId);

    return (
        <div className="space-y-md">
            {/* Proveedor */}
            <div className="space-y-xs">
                <label
                    htmlFor="select-proveedor-compra"
                    className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide"
                >
                    Proveedor <span className="text-error">*</span>
                </label>
                <select
                    id="select-proveedor-compra"
                    value={proveedorId ?? ""}
                    onChange={(e) =>
                        onProveedorChange(e.target.value ? Number(e.target.value) : null)
                    }
                    className={`w-full bg-surface-container-high border rounded-xl px-md py-sm text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors ${
                        errorProveedor ? "border-error" : "border-outline-variant"
                    }`}
                >
                    <option value="">Seleccioná un proveedor</option>
                    {proveedores.map((p) => (
                        <option key={p.id} value={p.id}>
                            {p.razon_social}
                        </option>
                    ))}
                </select>
                {errorProveedor && (
                    <span className="text-xs text-error">{errorProveedor}</span>
                )}
            </div>

            {/* Comprobante */}
            <InputField
                id="input-numero-comprobante"
                label="N° de comprobante (opcional)"
                placeholder="Ej: A-0001-00001234"
                value={numeroComprobante}
                onChange={(e) => onNumeroComprobanteChange(e.target.value)}
            />

            {/* Tipo de pago */}
            <div className="space-y-xs">
                <label className="text-label-md font-semibold text-on-surface-variant uppercase tracking-wide">
                    Tipo de pago
                </label>
                <div className="grid grid-cols-2 gap-sm">
                    {TIPOS_PAGO.map((t) => (
                        <button
                            key={t.value}
                            id={`tipo-pago-${t.value.toLowerCase()}`}
                            type="button"
                            onClick={() => onTipoPagoChange(t.value)}
                            className={`flex flex-col items-center gap-xs p-sm rounded-xl border transition-all ${
                                tipoPago === t.value
                                    ? "bg-primary-container text-on-primary-container border-primary font-semibold"
                                    : "bg-surface-container text-on-surface-variant border-outline-variant hover:bg-surface-container-high"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[22px]">{t.icon}</span>
                            <span className="text-label-md">{t.label}</span>
                        </button>
                    ))}
                </div>
                <p className="text-label-sm text-on-surface-variant">
                    {tipoPago === "CONTADO"
                        ? "Se generará un egreso de caja por el total."
                        : `Se sumará el total al saldo adeudado${
                              proveedorSeleccionado
                                  ? ` a ${proveedorSeleccionado.razon_social}`
                                  : " del proveedor"
                          }.`}
                </p>
            </div>

            {aviso && (
                <p className="text-label-sm text-error bg-error-container/30 border border-error/30 rounded-xl p-sm">
                    {aviso}
                </p>
            )}

            {/* Total */}
            <div className="flex items-center justify-between pt-sm border-t border-surface-container-high">
                <span className="text-title-sm font-bold text-on-surface">Total</span>
                <span className="text-headline-sm font-bold text-primary">
                    ${Number(totalCompra).toFixed(2)}
                </span>
            </div>

            <button
                id="btn-registrar-compra"
                type="button"
                onClick={onConfirmar}
                disabled={disabled || loading}
                className="w-full flex items-center justify-center gap-sm bg-primary text-on-primary py-md rounded-full font-label-md hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className="material-symbols-outlined text-[20px]">
                    {loading ? "progress_activity" : "check"}
                </span>
                {loading ? "Registrando..." : "Registrar compra"}
            </button>
        </div>
    );
}
