import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getProducts, createProduct, updateProduct, deleteProduct } from "../services/productService";
import { getCategories, createCategory } from "../services/categoryService";
import { getMarcas } from "../services/marcaService";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

export function AdminProducts() {
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [marcas, setMarcas] = useState([]);

    // Estado para controlar el modal de crear/editar producto
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        codigo_barra: "",
        stock_actual: "",
        stock_minimo: "",
        precio_compra: "",
        precio_venta: "",
        categoria_id: "",
        marca_nombre: "",
    });

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Estado para sub-modal de creación rápida de categoría
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [categorySubmitting, setCategorySubmitting] = useState(false);
    const [categoryError, setCategoryError] = useState("");

    const searchInputRef = useRef(null);

    // Conexión del Hook para pistola lectora de códigos de barra (USB HID)
    useBarcodeScanner((scannedCode) => {
        if (isModalOpen) {
            // Si el modal de producto está abierto, autocompletar el código de barras
            setFormData((prev) => ({
                ...prev,
                codigo_barra: scannedCode,
            }));
            // Limpiar errores del código de barras si existían
            setErrors((prev) => {
                const nextErrors = { ...prev };
                delete nextErrors.codigo_barra;
                return nextErrors;
            });
        } else {
            // Si el modal está cerrado, buscar el producto por código
            setSearch(scannedCode);
            if (searchInputRef.current) {
                searchInputRef.current.focus();
                searchInputRef.current.select();
            }
        }
    });

    // Cargar metadatos (categorías y marcas)
    const fetchMetadata = async () => {
        try {
            const [cats, brs] = await Promise.all([
                getCategories().catch(() => []),
                getMarcas().catch(() => []),
            ]);
            setCategories(Array.isArray(cats) ? cats : []);
            setMarcas(Array.isArray(brs) ? brs : []);
        } catch (error) {
            console.error("Error al cargar categorías o marcas:", error);
        }
    };

    // Cargar productos desde Laravel
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const data = await getProducts();
            const productList = Array.isArray(data) ? data : data?.products || [];
            setProducts(productList);
        } catch (error) {
            console.error("Error al cargar productos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetadata();
    }, []);

    // Efecto para buscar con un pequeño debounce o al presionar Enter
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchProducts();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Abrir modal para crear producto
    const handleOpenCreateModal = () => {
        setEditingProduct(null);
        setFormData({
            name: "",
            codigo_barra: "",
            stock_actual: "",
            stock_minimo: "",
            precio_compra: "",
            precio_venta: "",
            categoria_id: categories.length > 0 ? categories[0].id : "",
            marca_nombre: "",
        });
        setErrors({});
        setIsModalOpen(true);
    };

    // Abrir modal para editar producto
    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.nombre || "",
            codigo_barra: product.codigo_barra || "",
            stock_actual: product.stock_actual ?? "",
            stock_minimo: product.stock_minimo ?? "",
            precio_compra: product.precio_compra ?? "",
            precio_venta: product.precio_venta ?? "",
            categoria_id: product.categoria_id ?? product.categoria?.id ?? "",
            marca_nombre: product.marca?.nombre || "",
        });
        setErrors({});
        setIsModalOpen(true);
    };

    // Manejar creación rápida de categoría
    const handleCreateCategorySubmit = async (e) => {
        e.preventDefault();
        const trimmed = newCategoryName.trim();
        if (!trimmed) {
            setCategoryError("El nombre no puede estar vacío");
            return;
        }

        setCategorySubmitting(true);
        setCategoryError("");
        try {
            const created = await createCategory({ nombre: trimmed });
            // Actualizar lista de categorías
            await fetchMetadata();
            // Seleccionar automáticamente la nueva categoría en el formulario de producto
            if (created && created.id) {
                setFormData((prev) => ({ ...prev, categoria_id: created.id }));
            }
            setIsCategoryModalOpen(false);
            setNewCategoryName("");
        } catch (error) {
            setCategoryError(error.data?.message || error.message || "Error al crear la categoría");
        } finally {
            setCategorySubmitting(false);
        }
    };

    // Guardar Producto
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
            setIsModalOpen(false);
            fetchProducts(); // Recargar productos
            fetchMetadata(); // Recargar marcas por si se agregó una nueva
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

    // Eliminar producto
    const handleDelete = async (id) => {
        if (!confirm("¿Estás seguro de eliminar este producto?")) return;

        try {
            await deleteProduct(id);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (error) {
            alert(error.message || "Error al eliminar el producto");
        }
    };

    // Filtro local de búsqueda en frontend si se desea
    const filteredProducts = products.filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            (p.nombre && p.nombre.toLowerCase().includes(q)) ||
            (p.codigo_barra && p.codigo_barra.toLowerCase().includes(q)) ||
            (p.categoria?.nombre && p.categoria.nombre.toLowerCase().includes(q)) ||
            (p.marca?.nombre && p.marca.nombre.toLowerCase().includes(q))
        );
    });

    return (
        <div className="bg-surface text-on-surface min-h-screen p-6 font-body-md">
            <div className="max-w-6xl mx-auto flex flex-col gap-6">

                {/* Header y Acciones */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Gestión de Productos</h1>
                        <p className="text-sm text-on-surface-variant">
                            Administra el inventario, categorías y precios de tu despensa
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setNewCategoryName("");
                                setCategoryError("");
                                setIsCategoryModalOpen(true);
                            }}
                            className="flex items-center justify-center gap-2 bg-surface-container-high text-on-surface px-4 py-2.5 rounded-full font-label-md hover:bg-surface-container-highest transition-all shadow-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">category</span>
                            Nueva Categoría
                        </button>

                        <button
                            onClick={handleOpenCreateModal}
                            className="flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Nuevo Producto
                        </button>
                    </div>
                </div>

                {/* Barra de Búsqueda (Texto / Lector) */}
                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">search</span>
                    <input
                        ref={searchInputRef}
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por nombre, código de barra, categoría o marca..."
                        className="w-full bg-transparent font-body-md text-on-surface placeholder:text-outline focus:outline-none"
                        autoFocus
                    />
                    <span
                        className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/40 shrink-0 select-none"
                        title="Pistola lectora activa en cualquier momento"
                    >
                        <span className="material-symbols-outlined text-[16px] text-primary">barcode_scanner</span>
                        <span>Pistola activa</span>
                    </span>
                    {search && (
                        <button onClick={() => setSearch("")} className="text-on-surface-variant hover:text-on-surface">
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>

                {/* Tabla de Productos */}
                <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-on-surface-variant flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                            Cargando catálogo...
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="p-8 text-center text-on-surface-variant">
                            No se encontraron productos registrados.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase">
                                    <tr>
                                        <th className="p-4 font-semibold">Código</th>
                                        <th className="p-4 font-semibold">Producto</th>
                                        <th className="p-4 font-semibold">Categoría / Marca</th>
                                        <th className="p-4 font-semibold">Precio Compra</th>
                                        <th className="p-4 font-semibold">Precio Venta</th>
                                        <th className="p-4 font-semibold">Stock</th>
                                        <th className="p-4 font-semibold text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-outline-variant/20 text-sm">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-surface-container-low transition-colors">
                                            <td className="p-4 font-mono text-xs text-outline">{product.codigo_barra || "N/A"}</td>
                                            <td className="p-4 font-medium text-on-surface">{product.nombre}</td>
                                            <td className="p-4 text-xs text-on-surface-variant">
                                                <span className="inline-block bg-surface-container px-2 py-0.5 rounded-md font-medium mr-1 text-on-surface">
                                                    {product.categoria?.nombre || "Sin cat."}
                                                </span>
                                                <span className="text-outline">/</span>
                                                <span className="inline-block ml-1 font-semibold text-secondary">
                                                    {product.marca?.nombre || "Sin marca"}
                                                </span>
                                            </td>
                                            <td className="p-4 text-on-surface-variant">
                                                ${Number(product.precio_compra).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4 font-bold text-primary">
                                                ${Number(product.precio_venta).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="p-4">
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${Number(product.stock_actual) <= Number(product.stock_minimo)
                                                        ? "bg-error-container text-on-error-container"
                                                        : "bg-secondary-fixed text-on-secondary-fixed"
                                                        }`}
                                                >
                                                    {product.stock_actual} un.
                                                </span>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <button
                                                    onClick={() => handleOpenEditModal(product)}
                                                    className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                                                    title="Editar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">delete</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal para Crear / Editar Producto */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-surface-container-lowest w-full max-w-md rounded-2xl shadow-xl p-6 flex flex-col gap-4 border border-outline-variant/30 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
                            <h2 className="text-lg font-bold text-on-surface">
                                {editingProduct ? "Editar Producto" : "Nuevo Producto"}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Código de barras */}
                            <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-medium text-on-surface">Código de Barras *</label>
                                    <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[14px] text-primary">barcode_scanner</span>
                                        Listo para escanear
                                    </span>
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={formData.codigo_barra}
                                    onChange={(e) => setFormData({ ...formData, codigo_barra: e.target.value })}
                                    placeholder="Ej: 779123456789"
                                    className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {errors.codigo_barra && <span className="text-xs text-error">{errors.codigo_barra[0]}</span>}
                            </div>

                            {/* Nombre */}
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface">Nombre del Producto *</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Leche Entera 1L"
                                    className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {errors.name && <span className="text-xs text-error">{errors.name[0]}</span>}
                            </div>

                            {/* Categoría y Marca en grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* Categoría con Select y botón de crear */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between">
                                        <label className="text-xs font-medium text-on-surface">Categoría *</label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewCategoryName("");
                                                setCategoryError("");
                                                setIsCategoryModalOpen(true);
                                            }}
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
                                    {errors.categoria_id && <span className="text-xs text-error">{errors.categoria_id[0]}</span>}
                                </div>

                                {/* Marca como TEXTO con datalist para autocompletar */}
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-on-surface">Marca *</label>
                                    <input
                                        type="text"
                                        required
                                        list="marcas-datalist"
                                        value={formData.marca_nombre}
                                        onChange={(e) => setFormData({ ...formData, marca_nombre: e.target.value })}
                                        placeholder="Ej: Arcor, Serenísima..."
                                        className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <datalist id="marcas-datalist">
                                        {marcas.map((m) => (
                                            <option key={m.id} value={m.nombre} />
                                        ))}
                                    </datalist>
                                    {errors.marca_nombre && <span className="text-xs text-error">{errors.marca_nombre[0]}</span>}
                                </div>
                            </div>

                            {/* Precios (Compra y Venta) en grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-on-surface">Precio Compra ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.precio_compra}
                                        onChange={(e) => setFormData({ ...formData, precio_compra: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    {errors.precio_compra && <span className="text-xs text-error">{errors.precio_compra[0]}</span>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-on-surface">Precio Venta ($) *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.precio_venta}
                                        onChange={(e) => setFormData({ ...formData, precio_venta: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    {errors.precio_venta && <span className="text-xs text-error">{errors.precio_venta[0]}</span>}
                                </div>
                            </div>

                            {/* Stock Actual y Mínimo en grid */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-on-surface">Stock Actual *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stock_actual}
                                        onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                                        placeholder="0"
                                        className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    {errors.stock_actual && <span className="text-xs text-error">{errors.stock_actual[0]}</span>}
                                </div>

                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-medium text-on-surface">Stock Mínimo *</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.stock_minimo}
                                        onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                                        placeholder="0"
                                        className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    {errors.stock_minimo && <span className="text-xs text-error">{errors.stock_minimo[0]}</span>}
                                </div>
                            </div>

                            {/* Botones del Modal */}
                            <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-outline-variant/20">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting && <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>}
                                    {submitting
                                        ? "Guardando..."
                                        : editingProduct
                                        ? "Actualizar Producto"
                                        : "Guardar Producto"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Secundario: Crear Categoría Rápida */}
            {isCategoryModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-surface-container-lowest w-full max-w-sm rounded-2xl shadow-2xl p-6 flex flex-col gap-4 border border-outline-variant/30">
                        <div className="flex justify-between items-center border-b border-outline-variant/20 pb-2">
                            <h3 className="text-md font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary text-[20px]">category</span>
                                Nueva Categoría
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsCategoryModalOpen(false)}
                                className="text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategorySubmit} className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface">Nombre de la Categoría *</label>
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Ej: Lácteos, Panadería, Bebidas..."
                                    className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                />
                                {categoryError && <span className="text-xs text-error">{categoryError}</span>}
                            </div>

                            <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-outline-variant/20">
                                <button
                                    type="button"
                                    onClick={() => setIsCategoryModalOpen(false)}
                                    className="px-3 py-1.5 rounded-full text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={categorySubmitting}
                                    className="px-4 py-1.5 bg-primary text-on-primary rounded-full text-xs font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    {categorySubmitting && <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>}
                                    {categorySubmitting ? "Creando..." : "Crear Categoría"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}