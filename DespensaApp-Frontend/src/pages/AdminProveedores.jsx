import { useState } from "react";
import { useProveedores } from "../features/proveedores/hooks/useProveedores";
import { ProveedorFormModal } from "../features/proveedores/components/ProveedorFormModal";

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
                                {loading
                                    ? "—"
                                    : `$${totalSaldoAdeudado.toLocaleString("es-AR", {
                                          minimumFractionDigits: 2,
                                      })}`}
                            </p>
                        </div>
                    </div>
                </div>

                {/* ── Barra de búsqueda ── */}
                <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-outline-variant/30 flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">search</span>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar por razón social, teléfono o dirección..."
                        className="w-full bg-transparent font-body-md text-on-surface placeholder:text-outline focus:outline-none"
                        autoFocus
                    />
                    {search && (
                        <button
                            onClick={() => setSearch("")}
                            className="text-on-surface-variant hover:text-on-surface"
                        >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                    )}
                </div>

                {/* ── Tabla ── */}
                <ProveedoresList
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

/* ─────────────────────────────────────────────────────────────────── */
/* Sub-componente: tabla de proveedores                                 */
/* ─────────────────────────────────────────────────────────────────── */

function ProveedoresList({ proveedores, loading, onEdit, onDelete }) {
    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-10 text-center text-on-surface-variant flex items-center justify-center gap-2">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Cargando proveedores...
            </div>
        );
    }

    if (proveedores.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-outline block mb-2">
                    local_shipping
                </span>
                No se encontraron proveedores registrados.
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-surface-container border-b border-outline-variant/30 text-on-surface-variant text-xs uppercase">
                        <tr>
                            <th className="p-4 font-semibold">Razón Social</th>
                            <th className="p-4 font-semibold">Teléfono</th>
                            <th className="p-4 font-semibold">Dirección</th>
                            <th className="p-4 font-semibold">Saldo Adeudado</th>
                            <th className="p-4 font-semibold text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/20 text-sm">
                        {proveedores.map((proveedor) => {
                            const saldo = parseFloat(proveedor.saldo_adeudado) || 0;
                            const tieneDeuda = saldo > 0;

                            return (
                                <tr
                                    key={proveedor.id}
                                    className="hover:bg-surface-container-low transition-colors"
                                >
                                    {/* Razón Social */}
                                    <td className="p-4 font-medium text-on-surface">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-on-secondary-container text-[16px]">
                                                    business
                                                </span>
                                            </div>
                                            {proveedor.razon_social}
                                        </div>
                                    </td>

                                    {/* Teléfono */}
                                    <td className="p-4 text-on-surface-variant">
                                        {proveedor.telefono ? (
                                            <span className="flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[15px] text-outline">
                                                    phone
                                                </span>
                                                {proveedor.telefono}
                                            </span>
                                        ) : (
                                            <span className="text-outline italic text-xs">Sin teléfono</span>
                                        )}
                                    </td>

                                    {/* Dirección */}
                                    <td className="p-4 text-on-surface-variant max-w-[200px] truncate">
                                        {proveedor.direccion ? (
                                            <span
                                                className="flex items-center gap-1.5"
                                                title={proveedor.direccion}
                                            >
                                                <span className="material-symbols-outlined text-[15px] text-outline">
                                                    location_on
                                                </span>
                                                <span className="truncate">{proveedor.direccion}</span>
                                            </span>
                                        ) : (
                                            <span className="text-outline italic text-xs">Sin dirección</span>
                                        )}
                                    </td>

                                    {/* Saldo Adeudado */}
                                    <td className="p-4">
                                        <span
                                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                tieneDeuda
                                                    ? "bg-error-container text-on-error-container"
                                                    : "bg-secondary-fixed text-on-secondary-fixed"
                                            }`}
                                        >
                                            {tieneDeuda && (
                                                <span className="material-symbols-outlined text-[13px]">
                                                    warning
                                                </span>
                                            )}
                                            $
                                            {saldo.toLocaleString("es-AR", {
                                                minimumFractionDigits: 2,
                                            })}
                                        </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="p-4 text-right space-x-1">
                                        <button
                                            onClick={() => onEdit(proveedor)}
                                            className="p-1.5 text-on-surface-variant hover:text-primary rounded-lg hover:bg-surface-container transition-colors"
                                            title="Editar proveedor"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button
                                            onClick={() => onDelete(proveedor.id)}
                                            className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                                            title="Eliminar proveedor"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
