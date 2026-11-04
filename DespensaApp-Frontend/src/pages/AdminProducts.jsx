import { useState, useRef } from "react";
import { useProducts } from "../features/products/hooks/useProducts";
import { ProductTable } from "../features/products/components/ProductTable";
import { ProductFormModal } from "../features/products/components/ProductFormModal";
import { QuickCategoryModal } from "../features/products/components/QuickCategoryModal";
import { QuickPriceModal } from "../features/products/components/QuickPriceModal";
import { SearchBar } from "../components/ui/SearchBar";
import { Toast } from "../components/feedback/Toast";
import { useBarcodeScanner } from "../hooks/useBarcodeScanner";

export function AdminProducts() {
    const {
        products,
        rawProducts,
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
    const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
    const [pricingProduct, setPricingProduct] = useState(null);
    const [scannedBarcode, setScannedBarcode] = useState("");
    const [toastMessage, setToastMessage] = useState(null);

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

    const handleOpenQuickPrice = (product = null) => {
        setPricingProduct(product);
        setIsPriceModalOpen(true);
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

                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            type="button"
                            onClick={() => handleOpenQuickPrice(null)}
                            className="flex items-center justify-center gap-2 bg-secondary-container text-on-secondary-container px-4 py-2.5 rounded-full font-label-md hover:opacity-90 transition-all shadow-sm active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">price_change</span>
                            Actualizar Precios / Márgenes
                        </button>

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
                <SearchBar
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    placeholder="Buscar por nombre, código de barra, categoría o marca..."
                    inputRef={searchInputRef}
                    autoFocus
                >
                    <span
                        className="hidden sm:flex items-center gap-1.5 text-xs text-on-surface-variant bg-surface-container px-2.5 py-1 rounded-full border border-outline-variant/40 shrink-0 select-none"
                        title="Pistola lectora activa en cualquier momento"
                    >
                        <span className="material-symbols-outlined text-[16px] text-primary">barcode_scanner</span>
                        <span>Pistola activa</span>
                    </span>
                </SearchBar>

                {/* Tabla de Productos */}
                <ProductTable
                    products={products}
                    loading={loading}
                    onEdit={handleOpenEditModal}
                    onQuickPrice={handleOpenQuickPrice}
                    onDelete={removeProduct}
                />
            </div>

            {/* Modal CU06: Actualizar Precios y Márgenes (Individual o Masivo) */}
            <QuickPriceModal
                isOpen={isPriceModalOpen}
                onClose={() => setIsPriceModalOpen(false)}
                selectedProduct={pricingProduct}
                products={rawProducts}
                categories={categories}
                marcas={marcas}
                onSuccess={(response) => {
                    fetchProducts();
                    setToastMessage(
                        response?.message || "Precios actualizados correctamente."
                    );
                }}
            />

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

            <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        </div>
    );
}
