import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";
import { createProveedor, updateProveedor } from "../../../services/proveedorService";

const initialForm = {
    razon_social: "",
    telefono: "",
    direccion: "",
    saldo_adeudado: "0",
};

/**
 * Modal para creación y edición de proveedores.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {object|null} editingProveedor - Proveedor a editar, o null para crear
 * @param {Function} onSuccess - Callback tras guardar exitosamente
 */
export function ProveedorFormModal({ isOpen, onClose, editingProveedor, onSuccess }) {
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Cargar datos al abrir o cambiar proveedor
    useEffect(() => {
        if (!isOpen) return;

        if (editingProveedor) {
            setFormData({
                razon_social: editingProveedor.razon_social || "",
                telefono: editingProveedor.telefono || "",
                direccion: editingProveedor.direccion || "",
                saldo_adeudado: editingProveedor.saldo_adeudado ?? "0",
            });
        } else {
            setFormData(initialForm);
        }
        setErrors({});
    }, [isOpen, editingProveedor]);

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        // Limpiar el error del campo al escribir
        if (errors[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);

        const cleanData = {
            razon_social: formData.razon_social.trim(),
            telefono: formData.telefono.trim() || null,
            direccion: formData.direccion.trim() || null,
            saldo_adeudado: formData.saldo_adeudado !== "" ? parseFloat(formData.saldo_adeudado) : 0,
        };

        try {
            if (editingProveedor) {
                await updateProveedor(editingProveedor.id, cleanData);
            } else {
                await createProveedor(cleanData);
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            if (error.status === 422) {
                setErrors(error.data?.errors || {});
            } else {
                alert(error.message || "Error al guardar el proveedor");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Razón Social */}
                <InputField
                    label="Razón Social"
                    required
                    icon="business"
                    value={formData.razon_social}
                    onChange={handleChange("razon_social")}
                    placeholder="Ej: Distribuidora García S.A."
                    maxLength={150}
                    error={errors.razon_social?.[0]}
                    autoFocus
                />

                {/* Teléfono */}
                <InputField
                    label="Teléfono"
                    icon="phone"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange("telefono")}
                    placeholder="Ej: +54 9 11 1234-5678"
                    maxLength={50}
                    error={errors.telefono?.[0]}
                />

                {/* Dirección */}
                <InputField
                    label="Dirección"
                    icon="location_on"
                    value={formData.direccion}
                    onChange={handleChange("direccion")}
                    placeholder="Ej: Av. Corrientes 1234, CABA"
                    maxLength={255}
                    error={errors.direccion?.[0]}
                />

                {/* Saldo Adeudado */}
                <InputField
                    label="Saldo Adeudado ($)"
                    icon="payments"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.saldo_adeudado}
                    onChange={handleChange("saldo_adeudado")}
                    placeholder="0.00"
                    error={errors.saldo_adeudado?.[0]}
                    helper={
                        !editingProveedor ? (
                            <span className="text-[11px] text-on-surface-variant">
                                Deuda inicial (opcional)
                            </span>
                        ) : null
                    }
                />

                {/* Botones */}
                <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-5 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && (
                            <span className="material-symbols-outlined text-[16px] animate-spin">
                                progress_activity
                            </span>
                        )}
                        {submitting
                            ? "Guardando..."
                            : editingProveedor
                            ? "Actualizar Proveedor"
                            : "Guardar Proveedor"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
