import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";

/**
 * Modal para ingresar el saldo inicial y abrir un turno de caja.
 *
 * @param {{ isOpen: boolean, onClose: () => void, onConfirm: (saldoInicial: number) => Promise<void> }} props
 */
export function AbrirCajaModal({ isOpen, onClose, onConfirm }) {
    const [saldoInicial, setSaldoInicial] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleClose = () => {
        setSaldoInicial("");
        setError("");
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const valor = parseFloat(saldoInicial);

        if (isNaN(valor) || valor < 0) {
            setError("Ingresá un monto válido mayor o igual a 0.");
            return;
        }

        setLoading(true);
        setError("");
        const ok = await onConfirm(valor);
        setLoading(false);

        if (ok) handleClose();
        else setError("No se pudo abrir la caja. Intentá de nuevo.");
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Abrir Caja">
            <form onSubmit={handleSubmit} className="space-y-md">
                <p className="text-body-md text-on-surface-variant">
                    Ingresá el dinero en efectivo disponible al iniciar el turno.
                </p>

                <InputField
                    id="saldo-inicial"
                    label="Saldo inicial ($)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={saldoInicial}
                    onChange={(e) => setSaldoInicial(e.target.value)}
                    required
                    autoFocus
                />

                {error && (
                    <p className="text-label-sm text-error">{error}</p>
                )}

                <div className="flex justify-end gap-sm pt-sm">
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
                        className="px-lg py-sm rounded-full bg-primary text-on-primary text-label-md font-label-md hover:bg-primary/90 transition-colors flex items-center gap-xs disabled:opacity-60"
                    >
                        {loading && (
                            <span className="material-symbols-outlined text-[16px] animate-spin">
                                progress_activity
                            </span>
                        )}
                        {loading ? "Abriendo..." : "Confirmar apertura"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
