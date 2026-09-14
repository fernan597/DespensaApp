import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";
import { createProduct, updateProduct } from "../../../services/productService";

const initialForm = {
    name: "",
    codigo_barra: "",
    stock_actual: "",
    stock_minimo: "",
    precio_compra: "",
    precio_venta: "",
    categoria_id: "",
    marca_nombre: "",
};

/**
 * Modal para creación y edición de productos.
 */
export function ProductFormModal({
    isOpen,
    onClose,
    editingProduct,
    categories,
    marcas,
    scannedBarcode,
    onSuccess,
    onOpenNewCategory,
}) {
    const [formData, setFormData] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Cargar datos al abrir o cambiar de producto a editar
    useEffect(() => {
        if (!isOpen) return;

        if (editingProduct) {
            setFormData({
                name: editingProduct.nombre || "",
                codigo_barra: editingProduct.codigo_barra || "",
                stock_actual: editingProduct.stock_actual ?? "",
                stock_minimo: editingProduct.stock_minimo ?? "",
                precio_compra: editingProduct.precio_compra ?? "",
                precio_venta: editingProduct.precio_venta ?? "",
                categoria_id: editingProduct.categoria_id ?? editingProduct.categoria?.id ?? (categories[0]?.id || ""),
                marca_nombre: editingProduct.marca?.nombre || "",
            });
        } else {
            setFormData({
                ...initialForm,
                categoria_id: categories.length > 0 ? categories[0].id : "",
            });
        }
        setErrors({});
    }, [isOpen, editingProduct, categories]);

    // Escuchar disparos del lector mientras el modal está abierto
    useEffect(() => {
        if (isOpen && scannedBarcode) {
            setFormData((prev) => ({ ...prev, codigo_barra: scannedBarcode }));
            setErrors((prev) => {
                const next = { ...prev };
                delete next.codigo_barra;
                return next;
            });
        }
    }, [isOpen, scannedBarcode]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);

        const cleanData = {
            name: formData.name.trim(),
            codigo_barra: formData.codigo_barra.trim(),
            stock_actual: parseInt(formData.stock_actual, 10),
            stock_minimo: parseInt(formData.stock_minimo, 10),
            precio_compra: parseFloat(formData.precio_compra),
            precio_venta: parseFloat(formData.precio_venta),
            categoria_id: parseInt(formData.categoria_id, 10),
            marca_nombre: formData.marca_nombre.trim(),
        };

        try {
            if (editingProduct) {
                await updateProduct(editingProduct.id, cleanData);
            } else {
                await createProduct(cleanData);
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            if (error.status === 422) {
                setErrors(error.data?.errors || {});
            } else {
                alert(error.message || "Error al guardar el producto");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingProduct ? "Editar Producto" : "Nuevo Producto"}
            maxWidth="max-w-md"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Código de barras */}
                <InputField
                    label="Código de Barras"
                    required
                    value={formData.codigo_barra}
                    onChange={(e) => setFormData({ ...formData, codigo_barra: e.target.value })}
                    placeholder="Ej: 779123456789"
                    error={errors.codigo_barra?.[0]}
                    helper={
                        <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">barcode_scanner</span>
                            Listo para escanear
                        </span>
                    }
                />

                {/* Nombre */}
                <InputField
                    label="Nombre del Producto"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Leche Entera 1L"
                    error={errors.name?.[0]}
                />

                {/* Categoría y Marca en grid */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Categoría con Select */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-on-surface">Categoría *</label>
                            <button
                                type="button"
                                onClick={onOpenNewCategory}
                                className="text-[11px] font-semibold text-primary hover:underline"
                                title="Crear nueva categoría"
                            >
                                + Nueva
                            </button>
                        </div>
                        <select
                            required
                            value={formData.categoria_id}
                            onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                            className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-on-surface"
                        >
                            <option value="">Selecciona...</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.nombre}
                                </option>
                            ))}
                        </select>
                        {errors.categoria_id && (
                            <span className="text-xs text-error">{errors.categoria_id[0]}</span>
                        )}
                    </div>

                    {/* Marca con datalist */}
                    <div className="flex flex-col gap-1">
                        <InputField
                            label="Marca"
                            required
                            list="marcas-datalist"
                            value={formData.marca_nombre}
                            onChange={(e) => setFormData({ ...formData, marca_nombre: e.target.value })}
                            placeholder="Ej: Arcor, Serenísima..."
                            error={errors.marca_nombre?.[0]}
                        />
                        <datalist id="marcas-datalist">
                            {marcas.map((m) => (
                                <option key={m.id} value={m.nombre} />
                            ))}
                        </datalist>
                    </div>
                </div>

                {/* Precios (Compra y Venta) en grid */}
                <div className="grid grid-cols-2 gap-3">
                    <InputField
                        label="Precio Compra ($)"
                        type="number"
                        step="0.01"
                        required
                        value={formData.precio_compra}
                        onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                        placeholder="0.00"
                        error={errors.precio_compra?.[0]}
                    />

                    <InputField
                        label="Precio Venta ($)"
                        type="number"
                        step="0.01"
                        required
                        value={formData.precio_venta}
                        onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                        placeholder="0.00"
                        error={errors.precio_venta?.[0]}
                    />
                </div>

                {/* Stock Actual y Mínimo en grid */}
                <div className="grid grid-cols-2 gap-3">
                    <InputField
                        label="Stock Actual"
                        type="number"
                        required
                        value={formData.stock_actual}
                        onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                        placeholder="0"
                        error={errors.stock_actual?.[0]}
                    />

                    <InputField
                        label="Stock Mínimo"
                        type="number"
                        required
                        value={formData.stock_minimo}
                        onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                        placeholder="0"
                        error={errors.stock_minimo?.[0]}
                    />
                </div>

                {/* Botones del Modal */}
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
                            <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                        )}
                        {submitting
                            ? "Guardando..."
                            : editingProduct
                            ? "Actualizar Producto"
                            : "Guardar Producto"}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
