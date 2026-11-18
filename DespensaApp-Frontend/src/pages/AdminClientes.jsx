import { useState } from "react";
import { useClientes } from "../features/clientes/hooks/useClientes";
import { ClienteFormModal } from "../features/clientes/components/ClienteFormModal";
import { ClientesTable } from "../features/clientes/components/ClientesTable";
import { SearchBar } from "../components/ui/SearchBar";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { Toast } from "../components/feedback/Toast";
import { formatCurrency } from "../utils/formatters";

/**
 * Página de administración de clientes.
 * Disponible solo para rol admin_despensa.
 */
export function AdminClientes() {
    const {
        clientes,
        rawClientes,
        loading,
        search,
        setSearch,
        fetchClientes,
        removeCliente,
        totalSaldoAdeudado,
    } = useClientes();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);

    // Estado para el modal de confirmación de eliminación
    const [clienteToDelete, setClienteToDelete] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Estado para feedback visual con Toast
    const [toast, setToast] = useState(null);

    const handleOpenCreate = () => {
        setEditingCliente(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (cliente) => {
        setEditingCliente(cliente);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCliente(null);
    };

    // Solicitar confirmación de eliminación
    const handleRequestDelete = (cliente) => {
        setClienteToDelete(cliente);
        setIsDeleteModalOpen(true);
    };

    const handleCloseDeleteModal = () => {
        if (isDeleting) return;
        setIsDeleteModalOpen(false);
        setClienteToDelete(null);
    };

    // Ejecutar eliminación tras confirmación en el modal
    const handleConfirmDelete = async () => {
        if (!clienteToDelete) return;

        setIsDeleting(true);
        const result = await removeCliente(clienteToDelete.id);
        setIsDeleting(false);

        const nombreCliente =
            clienteToDelete.nombre_completo ||
            `${clienteToDelete.nombre || ""} ${clienteToDelete.apellido || ""}`.trim() ||
            "Cliente";

        if (result.success) {
            setToast({
                message: `Cliente "${nombreCliente}" eliminado correctamente.`,
                type: "success",
            });
            handleCloseDeleteModal();
        } else {
            setToast({
                message: result.message,
                type: "error",
            });
            handleCloseDeleteModal();
        }
    };

    return (
        <div className="bg-surface text-on-surface min-h-screen p-6 font-body-md">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-on-surface">Gestión de Clientes</h1>
                        <p className="text-sm text-on-surface-variant">
                            Administra el directorio de clientes y su estado en cuenta corriente
                        </p>
                    </div>
                    <button
                        onClick={handleOpenCreate}
                        className="flex items-center justify-center gap-2 bg-primary text-on-primary px-5 py-2.5 rounded-full font-label-md hover:bg-primary-container hover:text-on-primary-container transition-all shadow-sm active:scale-95"
                    >
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        Nuevo Cliente
                    </button>
                </div>

                {/* ── KPIs ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Total clientes */}
                    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm p-5 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-on-secondary-container text-[22px]">
                                group
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-on-surface-variant font-medium uppercase tracking-wide">
                                Clientes
                            </p>
                            <p className="text-2xl font-bold text-on-surface">
                                {loading ? "—" : rawClientes.length}
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
                                Deuda Total (Fiado)
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
                    placeholder="Buscar por nombre, apellido, teléfono o dirección..."
                    autoFocus
                />

                {/* ── Tabla ── */}
                <ClientesTable
                    clientes={clientes}
                    loading={loading}
                    onEdit={handleOpenEdit}
                    onDelete={handleRequestDelete}
                />
            </div>

            {/* ── Modal Crear / Editar ── */}
            <ClienteFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                editingCliente={editingCliente}
                onSuccess={() => {
                    fetchClientes();
                }}
            />

            {/* ── Modal de Confirmación de Eliminación ── */}
            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={handleCloseDeleteModal}
                onConfirm={handleConfirmDelete}
                title="¿Eliminar Cliente?"
                confirmText="Eliminar Cliente"
                cancelText="Cancelar"
                variant="danger"
                icon="delete"
                loading={isDeleting}
                message={
                    <span>
                        ¿Estás seguro de que deseas eliminar a{" "}
                        <strong className="text-on-surface font-semibold">
                            {clienteToDelete?.nombre_completo ||
                                `${clienteToDelete?.nombre || ""} ${clienteToDelete?.apellido || ""}`.trim() ||
                                "este cliente"}
                        </strong>
                        ? Esta acción no se puede deshacer.
                    </span>
                }
                extraContent={
                    clienteToDelete && Number(clienteToDelete.saldo_cuenta_corriente) > 0 ? (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-error-container/50 border border-error/30 text-xs text-on-error-container font-medium">
                            <span className="material-symbols-outlined text-[18px] text-error shrink-0 mt-0.5">
                                warning
                            </span>
                            <span>
                                Este cliente registra un saldo adeudado de{" "}
                                <strong className="font-bold">
                                    {formatCurrency(clienteToDelete.saldo_cuenta_corriente)}
                                </strong>
                                . El sistema rechazará la eliminación hasta que se salde la cuenta corriente.
                            </span>
                        </div>
                    ) : null
                }
            />

            {/* ── Notificación Flotante Toast ── */}
            <Toast
                message={toast?.message}
                type={toast?.type}
                onClose={() => setToast(null)}
            />
        </div>
    );
}
