import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";
import { createCliente, updateCliente } from "../../../services/clienteService";

const initialForm = {
    nombre: "",
    apellido: "",
    telefono: "",
    direccion: "",
};

/**
 * Modal para creación y edición de clientes.
 *
 * @param {boolean} isOpen
 * @param {Function} onClose
 * @param {object|null} editingCliente - Cliente a editar, o null para crear
 * @param {Function} onSuccess - Callback tras guardar exitosamente
 */
export function ClienteFormModal({ isOpen, onClose, editingCliente, onSuccess }) {
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Cargar datos al abrir o cambiar cliente
    useEffect(() => {
        if (!isOpen) return;

        if (editingCliente) {
            setFormData({
                nombre: editingCliente.nombre || "",
                apellido: editingCliente.apellido || "",
                telefono: editingCliente.telefono || "",
                direccion: editingCliente.direccion || "",
            });
        } else {
            setFormData(initialForm);
        }
        setErrors({});
    }, [isOpen, editingCliente]);

    const handleChange = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
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
            nombre: formData.nombre.trim(),
            apellido: formData.apellido.trim() || null,
            telefono: formData.telefono.trim() || null,
            direccion: formData.direccion.trim() || null,
        };

        try {
            if (editingCliente) {
                await updateCliente(editingCliente.id, cleanData);
            } else {
                await createCliente(cleanData);
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            if (error.status === 422) {
                setErrors(error.data?.errors || {});
            } else {
                alert(error.message || "Error al guardar el cliente");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingCliente ? "Editar Cliente" : "Nuevo Cliente"}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                {/* Nombre */}
                <InputField
                    label="Nombre"
                    required
                    icon="person"
                    value={formData.nombre}
                    onChange={handleChange("nombre")}
                    placeholder="Ej: Juan"
                    maxLength={100}
                    error={errors.nombre?.[0]}
                    autoFocus
                />

                {/* Apellido */}
                <InputField
                    label="Apellido"
                    icon="badge"
                    value={formData.apellido}
                    onChange={handleChange("apellido")}
                    placeholder="Ej: Pérez"
                    maxLength={100}
                    error={errors.apellido?.[0]}
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
                    placeholder="Ej: Av. San Martín 450"
                    maxLength={255}
                    error={errors.direccion?.[0]}
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
                            : editingCliente
                            ? "Actualizar Cliente"
                            : "Guardar Cliente"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
