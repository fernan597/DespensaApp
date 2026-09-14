import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";
import { createUser } from "../../../services/userService";

const initialFormData = {
    name: "",
    email: "",
    role: "dueño",
    password: "",
    password_confirmation: "",
};

/**
 * Modal para registro de nuevos usuarios en el sistema.
 */
export function UserModal({ isOpen, onClose, onUserCreated }) {
    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});
    const [formGeneralError, setFormGeneralError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setFormData(initialFormData);
            setFormErrors({});
            setFormGeneralError("");
            setShowPassword(false);
            setShowConfirmPassword(false);
        }
    }, [isOpen]);

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = "El nombre completo es obligatorio";
        } else if (formData.name.trim().length < 2) {
            errors.name = "El nombre debe tener al menos 2 caracteres";
        }

        if (!formData.email.trim()) {
            errors.email = "El correo electrónico es obligatorio";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = "Ingresa un correo electrónico válido";
        }

        if (!formData.password) {
            errors.password = "La contraseña es obligatoria";
        } else if (formData.password.length < 8) {
            errors.password = "La contraseña debe tener al menos 8 caracteres";
        }

        if (!formData.password_confirmation) {
            errors.password_confirmation = "Debes confirmar la contraseña";
        } else if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = "Las contraseñas no coinciden";
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormGeneralError("");
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormErrors({});
        setIsSubmitting(true);

        const cleanData = {
            name: formData.name.trim(),
            email: formData.email.trim(),
            role: formData.role,
            password: formData.password,
            password_confirmation: formData.password_confirmation,
        };

        try {
            const created = await createUser(cleanData);
            const newUser = {
                id: created.id || Date.now(),
                name: created.name,
                email: created.email,
                role: created.role,
                status: created.status || "active",
                created_at: created.created_at,
            };
            onUserCreated?.(newUser);
            onClose();
        } catch (error) {
            if (error.status === 422 && error.data?.errors) {
                const apiErrors = {};
                for (const [k, val] of Object.entries(error.data.errors)) {
                    apiErrors[k] = Array.isArray(val) ? val[0] : val;
                }
                setFormErrors(apiErrors);
            } else {
                setFormGeneralError(error.message || "Error al crear el usuario.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <span className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[22px]">person_add</span>
                    Agregar Nuevo Usuario
                </span>
            }
            maxWidth="max-w-lg"
        >
            {formGeneralError && (
                <div className="p-3 bg-error-container/20 border border-error/30 text-error text-xs rounded-xl flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    {formGeneralError}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Nombre */}
                <InputField
                    label="Nombre Completo"
                    required
                    icon="person"
                    value={formData.name}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, name: e.target.value }));
                        if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="Ej: Juan Pérez"
                    error={formErrors.name}
                />

                {/* Correo */}
                <InputField
                    label="Correo Electrónico"
                    type="email"
                    required
                    icon="mail"
                    value={formData.email}
                    onChange={(e) => {
                        setFormData((prev) => ({ ...prev, email: e.target.value }));
                        if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="juan.perez@despensa.com"
                    error={formErrors.email}
                />

                {/* Rol */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-xs font-medium text-on-surface">
                        Rol en el Negocio <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
                            badge
                        </span>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                            className="w-full h-10 pl-10 pr-8 bg-surface-container rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary appearance-none cursor-pointer"
                        >
                            <option value="dueño">Vendedor (Dueño) — Gestión de productos y stock</option>
                            <option value="empleado">Cajero (Empleado) — Punto de venta y cobro</option>
                            <option value="admin">Administrador — Control total del sistema</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 text-outline pointer-events-none text-[20px]">
                            expand_more
                        </span>
                    </div>
                </div>

                {/* Contraseña */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-xs font-medium text-on-surface">
                        Contraseña Temporal <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
                            lock
                        </span>
                        <input
                            required
                            type={showPassword ? "text" : "password"}
                            value={formData.password}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, password: e.target.value }));
                                if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: "" }));
                            }}
                            className={`w-full h-10 pl-10 pr-10 bg-surface-container rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary ${
                                formErrors.password ? "ring-2 ring-error bg-error-container/10" : ""
                            }`}
                            placeholder="Mínimo 8 caracteres"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="material-symbols-outlined absolute right-3 text-outline hover:text-on-surface text-[20px]"
                            title={showPassword ? "Ocultar" : "Mostrar"}
                        >
                            {showPassword ? "visibility_off" : "visibility"}
                        </button>
                    </div>
                    {formErrors.password && (
                        <span className="text-xs text-error flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            {formErrors.password}
                        </span>
                    )}
                </div>

                {/* Confirmar Contraseña */}
                <div className="flex flex-col gap-1 w-full">
                    <label className="text-xs font-medium text-on-surface">
                        Confirmar Contraseña <span className="text-error">*</span>
                    </label>
                    <div className="relative flex items-center">
                        <span className="material-symbols-outlined absolute left-3 text-on-surface-variant text-[20px] pointer-events-none">
                            lock_reset
                        </span>
                        <input
                            required
                            type={showConfirmPassword ? "text" : "password"}
                            value={formData.password_confirmation}
                            onChange={(e) => {
                                setFormData((prev) => ({ ...prev, password_confirmation: e.target.value }));
                                if (formErrors.password_confirmation) {
                                    setFormErrors((prev) => ({ ...prev, password_confirmation: "" }));
                                }
                            }}
                            className={`w-full h-10 pl-10 pr-10 bg-surface-container rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary ${
                                formErrors.password_confirmation ? "ring-2 ring-error bg-error-container/10" : ""
                            }`}
                            placeholder="Repite la contraseña"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="material-symbols-outlined absolute right-3 text-outline hover:text-on-surface text-[20px]"
                            title={showConfirmPassword ? "Ocultar" : "Mostrar"}
                        >
                            {showConfirmPassword ? "visibility_off" : "visibility"}
                        </button>
                    </div>
                    {formErrors.password_confirmation && (
                        <span className="text-xs text-error flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[14px]">error</span>
                            {formErrors.password_confirmation}
                        </span>
                    )}
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/20 mt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2 rounded-full bg-primary text-on-primary text-sm font-medium hover:bg-primary/90 transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting && (
                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        )}
                        {isSubmitting ? "Guardando..." : "Guardar Usuario"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
