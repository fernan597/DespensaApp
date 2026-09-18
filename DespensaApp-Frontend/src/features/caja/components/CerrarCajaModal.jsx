import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";

/**
 * Modal de arqueo para cerrar el turno de caja.
 * Muestra el saldo esperado calculado por el backend y pide el saldo físico contado.
 * Después de cerrar, presenta el resumen con la diferencia de arqueo.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onConfirm: (saldoFinal: number) => Promise<object|null>,
 *   saldoEsperado: number
 * }} props
 */
export function CerrarCajaModal({ isOpen, onClose, onConfirm, saldoEsperado }) {
    const [saldoFinal, setSaldoFinal] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [resumen, setResumen] = useState(null); // Resultado del arqueo

    const handleClose = () => {
        setSaldoFinal("");
        setError("");
        setResumen(null);
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const valor = parseFloat(saldoFinal);

        if (isNaN(valor) || valor < 0) {
            setError("Ingresá un monto válido mayor o igual a 0.");
            return;
        }

        setLoading(true);
        setError("");
        const resultado = await onConfirm(valor);
        setLoading(false);

        if (resultado) {
            setResumen(resultado); // Muestra el resumen en lugar del formulario
        } else {
            setError("No se pudo cerrar la caja. Intentá de nuevo.");
        }
    };

    // Determina el color y texto de la diferencia de arqueo
    const getDiferenciaInfo = (diferencia) => {
        if (diferencia === 0) return { label: "Caja cuadrada", color: "text-green-600" };
        if (diferencia > 0) return { label: `Sobrante: $${diferencia.toFixed(2)}`, color: "text-blue-600" };
        return { label: `Faltante: $${Math.abs(diferencia).toFixed(2)}`, color: "text-error" };
    };

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Cerrar Caja">
            {/* Vista de Resumen post-cierre */}
            {resumen ? (
                <div className="space-y-md">
                    <p className="text-label-sm font-semibold text-on-surface-variant uppercase tracking-wider">
                        Resumen de Arqueo
                    </p>
                    <div className="bg-surface-container rounded-xl p-md space-y-sm text-body-md">
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">Saldo inicial</span>
                            <span className="font-semibold">${resumen.saldo_inicial?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">Total ingresos</span>
                            <span className="font-semibold text-green-600">+${resumen.total_ingresos?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">Total egresos</span>
                            <span className="font-semibold text-error">-${resumen.total_egresos?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-outline-variant pt-sm">
                            <span className="text-on-surface-variant">Saldo esperado</span>
                            <span className="font-bold">${resumen.saldo_esperado?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-on-surface-variant">Saldo declarado</span>
                            <span className="font-bold">${resumen.saldo_final_declarado?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between border-t border-outline-variant pt-sm">
                            <span className="font-semibold">Resultado</span>
                            <span className={`font-bold ${getDiferenciaInfo(resumen.diferencia).color}`}>
                                {getDiferenciaInfo(resumen.diferencia).label}
                            </span>
                        </div>
                    </div>
                    <div className="flex justify-end pt-sm">
                        <button
                            onClick={handleClose}
                            className="px-lg py-sm rounded-full bg-primary text-on-primary text-label-md font-label-md hover:bg-primary/90 transition-colors"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            ) : (
                /* Vista de Formulario de cierre */
                <form onSubmit={handleSubmit} className="space-y-md">
                    <p className="text-body-md text-on-surface-variant">
                        Contá el efectivo en caja e ingresá el total físico.
                    </p>

                    {/* Saldo esperado (solo lectura, referencia para el cajero) */}
                    <div className="bg-primary-container/30 border border-primary/20 rounded-xl p-md flex items-center justify-between">
                        <span className="text-body-md text-on-surface-variant">Saldo esperado (sistema)</span>
                        <span className="text-title-lg font-bold text-primary">
                            ${(saldoEsperado ?? 0).toFixed(2)}
                        </span>
                    </div>

                    <InputField
                        id="saldo-final"
                        label="Saldo contado físicamente ($)"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={saldoFinal}
                        onChange={(e) => setSaldoFinal(e.target.value)}
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
                            className="px-lg py-sm rounded-full bg-error text-on-error text-label-md font-label-md hover:bg-error/90 transition-colors flex items-center gap-xs disabled:opacity-60"
                        >
                            {loading && (
                                <span className="material-symbols-outlined text-[16px] animate-spin">
                                    progress_activity
                                </span>
                            )}
                            {loading ? "Cerrando..." : "Confirmar cierre"}
                        </button>
                    </div>
                </form>
            )}
        </Modal>
    );
}
