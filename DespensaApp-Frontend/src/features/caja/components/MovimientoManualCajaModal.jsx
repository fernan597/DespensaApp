import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";
import { formatCurrency } from "../../../utils/formatters";

/**
 * Modal para asentar movimientos manuales de caja (ingresos o egresos extraordinarios).
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: (data: { tipo: "INGRESO"|"EGRESO", monto: number, concepto: string }) => Promise<boolean>,
 *   saldoDisponible: number
 * }} props
 */
export function MovimientoManualCajaModal({ isOpen, onClose, onConfirm, saldoDisponible = 0 }) {
    const [tipo, setTipo] = useState("EGRESO"); // Por defecto egreso (frecuente en retiros/gastos)
    const [monto, setMonto] = useState("");
    const [concepto, setConcepto] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleClose = () => {
        setMonto("");
        setConcepto("");
        setError("");
        setTipo("EGRESO");
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        const valorMonto = parseFloat(monto);
        if (isNaN(valorMonto) || valorMonto <= 0) {
            setError("Ingresá un monto válido mayor a 0.");
            return;
        }

        if (!concepto.trim() || concepto.trim().length < 3) {
            setError("El concepto descriptivo debe tener al menos 3 caracteres.");
            return;
        }

        // Validación preventiva en cliente para egresos
        if (tipo === "EGRESO" && valorMonto > (saldoDisponible || 0)) {
            setError(
                `El monto a retirar (${formatCurrency(valorMonto)}) supera el saldo disponible en caja (${formatCurrency(saldoDisponible)}).`
            );
            return;
        }

        setLoading(true);
        try {
            await onConfirm({
                tipo,
                monto: valorMonto,
                concepto: concepto.trim(),
            });
            setLoading(false);
            handleClose();
        } catch (err) {
            setLoading(false);
            setError(err.message || "Error al registrar el movimiento de caja. Verificá los datos.");
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Registrar Movimiento de Caja"
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="space-y-md">
                {/* Selector de Tipo de Movimiento */}
                <div>
                    <label className="block text-label-sm font-semibold text-on-surface-variant mb-xs">
                        Tipo de movimiento
                    </label>
                    <div className="grid grid-cols-2 gap-xs p-1 bg-surface-container rounded-2xl border border-outline-variant/30">
                        <button
                            type="button"
                            onClick={() => {
                                setTipo("INGRESO");
                                setError("");
                            }}
                            className={`flex items-center justify-center gap-xs py-2 px-md rounded-xl text-label-md font-semibold transition-all ${
                                tipo === "INGRESO"
                                    ? "bg-green-600 text-white shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            Ingreso Extra
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setTipo("EGRESO");
                                setError("");
                            }}
                            className={`flex items-center justify-center gap-xs py-2 px-md rounded-xl text-label-md font-semibold transition-all ${
                                tipo === "EGRESO"
                                    ? "bg-amber-600 text-white shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[18px]">remove_circle</span>
                            Egreso / Retiro
                        </button>
                    </div>
                </div>

                {/* Saldo disponible en caso de Egreso */}
                {tipo === "EGRESO" && (
                    <div className="flex items-center justify-between p-sm px-md bg-amber-500/10 border border-amber-500/20 rounded-xl text-body-sm">
                        <span className="text-on-surface-variant flex items-center gap-xs">
                            <span className="material-symbols-outlined text-amber-600 text-[18px]">account_balance_wallet</span>
                            Efectivo actual disponible en caja:
                        </span>
                        <span className="font-bold text-amber-700">
                            {formatCurrency(saldoDisponible || 0)}
                        </span>
                    </div>
                )}

                {/* Campo Monto */}
                <InputField
                    id="monto-movimiento"
                    label="Monto ($)"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={monto}
                    onChange={(e) => setMonto(e.target.value)}
                    required
                    autoFocus
                />

                {/* Campo Concepto Descriptivo */}
                <div>
                    <label
                        htmlFor="concepto-movimiento"
                        className="block text-label-sm font-semibold text-on-surface-variant mb-xs"
                    >
                        Concepto / Motivo <span className="text-error">*</span>
                    </label>
                    <input
                        id="concepto-movimiento"
                        type="text"
                        placeholder={
                            tipo === "INGRESO"
                                ? "Ej: Ingreso de sencillo extra para cambio"
                                : "Ej: Retiro del dueño, compra de artículos de librería/limpieza"
                        }
                        value={concepto}
                        onChange={(e) => setConcepto(e.target.value)}
                        required
                        maxLength={255}
                        className="w-full px-md py-sm bg-surface-container-lowest border border-outline-variant/40 rounded-xl text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                    />
                    <p className="text-label-sm text-outline mt-1">
                        Detallá brevemente la causa del movimiento para que quede asentado en el arqueo.
                    </p>
                </div>

                {/* Mensaje de Error */}
                {error && (
                    <div className="p-sm px-md bg-error-container/30 border border-error/30 rounded-xl flex items-center gap-xs text-label-sm text-error">
                        <span className="material-symbols-outlined text-[18px]">error</span>
                        <span>{error}</span>
                    </div>
                )}

                {/* Acciones */}
                <div className="flex justify-end gap-sm pt-sm border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-lg py-sm rounded-full text-label-md font-label-md text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`px-lg py-sm rounded-full text-on-primary text-label-md font-semibold transition-colors flex items-center gap-xs disabled:opacity-60 shadow-sm ${
                            tipo === "INGRESO"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-amber-600 hover:bg-amber-700"
                        }`}
                    >
                        {loading && (
                            <span className="material-symbols-outlined text-[16px] animate-spin">
                                progress_activity
                            </span>
                        )}
                        {loading
                            ? "Registrando..."
                            : tipo === "INGRESO"
                            ? "Confirmar Ingreso"
                            : "Confirmar Egreso"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
