import { useState } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";
import { createCategory } from "../../../services/categoryService";

/**
 * Sub-modal para crear rápidamente una categoría sin salir del flujo actual.
 */
export function QuickCategoryModal({ isOpen, onClose, onCategoryCreated }) {
    const [name, setName] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        const trimmed = name.trim();
        if (!trimmed) {
            setError("El nombre no puede estar vacío");
            return;
        }

        setSubmitting(true);
        setError("");
        try {
            const created = await createCategory({ nombre: trimmed });
            setName("");
            onCategoryCreated?.(created);
            onClose();
        } catch (err) {
            setError(err.data?.message || err.message || "Error al crear la categoría");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => {
                setName("");
                setError("");
                onClose();
            }}
            title={
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">category</span>
                    Nueva Categoría
                </span>
            }
            maxWidth="max-w-sm"
            zIndex={60}
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <InputField
                    label="Nombre de la Categoría"
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Lácteos, Panadería, Bebidas..."
                    error={error}
                />

                <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-full text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {submitting && (
                            <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                        )}
                        {submitting ? "Creando..." : "Crear Categoría"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
