import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { registrarPagoProveedor } from "../../../services/pagoProveedorService";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Modal para registrar el pago a un proveedor para saldar parte o la totalidad de la deuda (CU14).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object|null} props.proveedor - Proveedor seleccionado con su saldo adeudado
 * @param {Function} props.onPagoExitoso - Callback invocado tras registrar el pago con éxito
 */
export function RegistrarPagoProveedorModal({ isOpen, onClose, proveedor, onPagoExitoso }) {
    const [monto, setMonto] = useState("");
    const [medioPago, setMedioPago] = useState("EFECTIVO");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Reiniciar estado cada vez que se abre el modal o cambia el proveedor
    useEffect(() => {
        if (isOpen && proveedor) {
            setMonto("");
            setMedioPago("EFECTIVO");
            setError(null);
        }
    }, [isOpen, proveedor]);

    if (!proveedor) return null;

    const saldoAdeudado = Number(proveedor.saldo_adeudado) || 0;
    const montoNumerico = Number(monto) || 0;
    const esMontoInvalido = montoNumerico <= 0 || montoNumerico > saldoAdeudado;
    const nuevoSaldoProyectado = Math.max(0, saldoAdeudado - montoNumerico);
    const saldaTotalidad = montoNumerico > 0 && montoNumerico === saldoAdeudado;

    const handleAbonarTotal = () => {
        setMonto(saldoAdeudado.toString());
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (montoNumerico <= 0) {
            setError("El monto a abonar debe ser mayor a 0.");
            return;
        }

        if (montoNumerico > saldoAdeudado) {
            setError(`El monto ingresado ($ ${montoNumerico}) no puede superar la deuda actual ($ ${saldoAdeudado}).`);
            return;
        }

        try {
            setLoading(true);
            const response = await registrarPagoProveedor({
                proveedor_id: proveedor.id,
                monto: montoNumerico,
                medio_pago: medioPago,
            });

            if (onPagoExitoso) {
                onPagoExitoso(response);
            }
            onClose();
        } catch (err) {
            console.error("Error al registrar pago a proveedor:", err);
            const serverMsg = err.data?.message || err.message || "Ocurrió un error al procesar el pago al proveedor.";
            setError(serverMsg);
        } finally {
            setLoading(false);
        }
    };

    const mediosPagoOptions = [
        { id: "EFECTIVO", label: "Efectivo", icon: "payments", desc: "Descuenta de la caja activa del turno" },
        { id: "TRANSFERENCIA", label: "Transferencia", icon: "account_balance", desc: "Acreditación / transferencia bancaria" },
        { id: "DEBITO", label: "Débito", icon: "credit_card", desc: "Pago por tarjeta de débito" },
        { id: "CREDITO", label: "Crédito", icon: "credit_score", desc: "Pago por tarjeta de crédito" },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[24px]">
                        payments
                    </span>
                    <span>Registrar Pago a Proveedor</span>
                </div>
            }
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 text-xs">
                {/* ── Tarjeta Resumen del Proveedor y Saldo Adeudado ── */}
                <div className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant/30 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm shrink-0">
                            <span className="material-symbols-outlined text-[20px]">
                                local_shipping
                            </span>
                        </div>
                        <div>
                            <p className="font-bold text-sm text-on-surface">
                                {proveedor.razon_social}
                            </p>
                            <p className="text-[11px] text-on-surface-variant">
                                {proveedor.telefono ? `Tel: ${proveedor.telefono}` : "Proveedor registrado"}
                                {proveedor.direccion ? ` • ${proveedor.direccion}` : ""}
                            </p>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[11px] text-on-surface-variant font-medium uppercase tracking-wide">
                            Deuda Pendiente Actual
                        </p>
                        <p className="text-lg font-bold text-error">
                            {formatCurrency(saldoAdeudado)}
                        </p>
                    </div>
                </div>

                {/* ── Entrada de Monto a Pagar ── */}
                <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="font-semibold text-on-surface text-xs">
                            Monto a Pagar <span className="text-error">*</span>
                        </label>
                        <button
                            type="button"
                            onClick={handleAbonarTotal}
                            disabled={loading || saldoAdeudado <= 0}
                            className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors flex items-center gap-1 bg-primary-container/40 px-2 py-0.5 rounded-lg active:scale-95 disabled:opacity-50"
                        >
                            <span className="material-symbols-outlined text-[14px]">done_all</span>
                            Abonar Total ({formatCurrency(saldoAdeudado)})
                        </button>
                    </div>

                    <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-base text-on-surface-variant">
                            $
                        </span>
                        <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={saldoAdeudado}
                            value={monto}
                            onChange={(e) => {
                                setMonto(e.target.value);
                                setError(null);
                            }}
                            placeholder="0.00"
                            disabled={loading}
                            autoFocus
                            className="w-full bg-surface-container-high border border-outline-variant/40 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-outline-variant"
                        />
                    </div>

                    {montoNumerico > saldoAdeudado && (
                        <p className="text-[11px] text-error font-medium mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">warning</span>
                            El monto supera el saldo adeudado del proveedor.
                        </p>
                    )}
                </div>

                {/* ── Selector de Medio de Pago ── */}
                <div>
                    <label className="font-semibold text-on-surface text-xs block mb-2">
                        Medio de Pago <span className="text-error">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {mediosPagoOptions.map((opt) => {
                            const isSelected = medioPago === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setMedioPago(opt.id)}
                                    disabled={loading}
                                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-left transition-all ${
                                        isSelected
                                            ? "border-primary bg-primary-container/30 text-on-surface shadow-xs"
                                            : "border-outline-variant/30 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant"
                                    }`}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[20px] mt-0.5 ${
                                            isSelected ? "text-primary" : "text-on-surface-variant"
                                        }`}
                                    >
                                        {opt.icon}
                                    </span>
                                    <div>
                                        <p className={`font-semibold text-xs ${isSelected ? "text-primary" : "text-on-surface"}`}>
                                            {opt.label}
                                        </p>
                                        <p className="text-[10px] text-on-surface-variant leading-tight">
                                            {opt.desc}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── Nota Informativa si es Efectivo ── */}
                {medioPago === "EFECTIVO" && (
                    <div className="p-2.5 bg-surface-container rounded-xl border border-outline-variant/20 flex items-center gap-2 text-[11px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-primary text-[16px] shrink-0">
                            info
                        </span>
                        <span>
                            El pago en efectivo registrará un egreso automático en la caja activa del turno y requiere que cuente con fondos suficientes.
                        </span>
                    </div>
                )}

                {/* ── Vista Previa de Nuevo Saldo Resultante ── */}
                {montoNumerico > 0 && montoNumerico <= saldoAdeudado && (
                    <div className="bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/20 flex items-center justify-between">
                        <div>
                            <p className="text-[11px] text-on-surface-variant font-medium">
                                Nuevo saldo restante tras el pago:
                            </p>
                            <p className="font-bold text-sm text-on-surface">
                                {formatCurrency(nuevoSaldoProyectado)}
                            </p>
                        </div>
                        {saldaTotalidad && (
                            <span className="bg-secondary-container text-on-secondary-container px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                Deuda Saldada
                            </span>
                        )}
                    </div>
                )}

                {/* ── Alerta de Error del Servidor ── */}
                {error && (
                    <div className="p-3 bg-error-container/40 border border-error/30 rounded-xl text-xs text-error flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* ── Botones de Acción ── */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container hover:bg-surface-container-high text-on-surface transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading || esMontoInvalido}
                        className="px-5 py-2 rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-on-primary flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <span className={`material-symbols-outlined text-[16px] ${loading ? "animate-spin" : ""}`}>
                            {loading ? "progress_activity" : "check"}
                        </span>
                        {loading ? "Registrando..." : "Confirmar Pago"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
