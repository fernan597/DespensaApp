import { useState, useRef } from "react";
import { useProducts } from "../features/products/hooks/useProducts";
import { ProductTable } from "../features/products/components/ProductTable";
import { ProductFormModal } from "../features/products/components/ProductFormModal";
import { QuickCategoryModal } from "../features/products/components/QuickCategoryModal";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

export function AdminProducts() {
    const {
        products,
        loading,
        search,
        setSearch,
        categories,
        marcas,
        fetchProducts,
        fetchMetadata,
        removeProduct,
    } = useProducts();

    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [scannedBarcode, setScannedBarcode] = useState("");

    const searchInputRef = useRef(null);

    // Conexión del Hook para pistola lectora de códigos de barra (USB HID)
    useBarcodeScanner((scannedCode) => {
        if (isProductModalOpen) {
            setScannedBarcode(scannedCode);
        } else {
            setSearch(scannedCode);
            if (searchInputRef.current) {
                searchInputRef.current.focus();
                searchInputRef.current.select();
            }
        }
    });

    const handleOpenCreateModal = () => {
        setEditingProduct(null);
        setScannedBarcode("");
        setIsProductModalOpen(true);
    };

    const handleOpenEditModal = (product) => {
        setEditingProduct(product);
        setScannedBarcode("");
        setIsProductModalOpen(true);
    };

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
                            onClick={() => setIsCategoryModalOpen(true)}
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
                <ProductTable
                    products={products}
                    loading={loading}
                    onEdit={handleOpenEditModal}
                    onDelete={removeProduct}
                />
            </div>

            {/* Modal para Crear / Editar Producto */}
            <ProductFormModal
                isOpen={isProductModalOpen}
                onClose={() => setIsProductModalOpen(false)}
                editingProduct={editingProduct}
                categories={categories}
                marcas={marcas}
                scannedBarcode={scannedBarcode}
                onSuccess={() => {
                    fetchProducts();
                    fetchMetadata();
                }}
                onOpenNewCategory={() => setIsCategoryModalOpen(true)}
            />

            {/* Modal Secundario: Crear Categoría Rápida */}
            <QuickCategoryModal
                isOpen={isCategoryModalOpen}
                onClose={() => setIsCategoryModalOpen(false)}
                onCategoryCreated={() => {
                    fetchMetadata();
                }}
            />
        </div>
    );
}