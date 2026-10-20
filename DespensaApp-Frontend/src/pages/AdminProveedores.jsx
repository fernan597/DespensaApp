import { useState } from "react";
import { useProveedores } from "../features/proveedores/hooks/useProveedores";
import { ProveedorFormModal } from "../features/proveedores/components/ProveedorFormModal";
import { ProveedoresTable } from "../features/proveedores/components/ProveedoresTable";
import { SearchBar } from "../components/ui/SearchBar";
import { formatCurrency } from "../utils/formatters";

/**
 * Página de administración de proveedores.
 * Disponible solo para rol admin_despensa.
 */
export function AdminProveedores() {
    const {
        proveedores,
        rawProveedores,
        loading,
        search,
        setSearch,
        fetchProveedores,
        removeProveedor,
        totalSaldoAdeudado,
    } = useProveedores();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProveedor, setEditingProveedor] = useState(null);

    const handleOpenCreate = () => {
        setEditingProveedor(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (proveedor) => {
        setEditingProveedor(proveedor);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingProveedor(null);
    };

    return (
        <div className="bg-surface text-on-surface min-h-screen p-6 font-body-md">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Gestión de Proveedores</h1>
                        <p className="text-sm text-on-surface-variant">
                            Administra los proveedores y su saldo pendiente de pago
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Nuevo Proveedor
                    </button>
                </div>

                {/* ── KPIs ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Total proveedores */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-on-secondary-container text-[22px]">
                                local_shipping
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                                Proveedores
                            </p>
                            <p className="text-2xl font-bold text-on-surface">
                                {loading ? "—" : rawProveedores.length}
                            </p>
                        </div>
                    </div>

                    {/* Deuda total */}
                    <div className={`bg-surface-container-lowest rounded-2xl border shadow-sm p-5 flex items-center gap-4 ${
                        totalSaldoAdeudado > 0
                            ? "border-error/30"
                            : "border-outline-variant/30"
                    }`}>
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                            totalSaldoAdeudado > 0
                                ? "bg-error-container"
                                : "bg-tertiary-container"
                        }`}>
                            <span className={`material-symbols-outlined text-[22px] ${
                                totalSaldoAdeudado > 0
                                    ? "text-on-error-container"
                                    : "text-on-tertiary-container"
                            }`}>
                                payments
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                                Deuda Total
                            </p>
                            <p className={`text-2xl font-bold ${
                                totalSaldoAdeudado > 0 ? "text-error" : "text-on-surface"
                            }`}>
                                {loading ? "—" : formatCurrency(totalSaldoAdeudado)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Barra de búsqueda ── */}
                <SearchBar
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onClear={() => setSearch("")}
                    placeholder="Buscar por razón social, teléfono o dirección..."
                    autoFocus
                />

                {/* ── Tabla ── */}
                <ProveedoresTable
                    proveedores={proveedores}
                    loading={loading}
                    onEdit={handleOpenEdit}
                    onDelete={removeProveedor}
                />
            </div>

            {/* ── Modal Crear / Editar ── */}
            <ProveedorFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editingProveedor={editingProveedor}
                onSuccess={() => {
                    fetchProveedores();
                }}
            />
        </div>
    );
}
