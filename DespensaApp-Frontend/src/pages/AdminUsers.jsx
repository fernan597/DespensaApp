import { useState } from "react";
import { useUsers } from "../features/users/hooks/useUsers";
import { UserTable } from "../features/users/components/UserTable";
import { RolePermissions } from "../features/users/components/RolePermissions";
import { UserModal } from "../features/users/components/UserModal";
import { Toast } from "../components/feedback/Toast";

export function AdminUsers() {
    const {
        users,
        filteredUsers,
        isLoadingUsers,
        fetchError,
        toastMessage,
        setToastMessage,
        searchTerm,
        setSearchTerm,
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        loadUsers,
        addUser,
        removeUser,
    } = useUsers();

    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="bg-background font-body-md text-on-background min-h-screen">
            <main className="min-h-screen bg-surface p-6">
                <div className="flex flex-col w-full max-w-6xl mx-auto space-y-6">

                    {/* Cabecera de la sección */}
                    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shadow-sm">
                                <span className="material-symbols-outlined text-on-primary-container text-[24px]">
                                    manage_accounts
                                </span>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-on-background tracking-tight">
                                    Gestión de Usuarios
                                </h1>
                                <p className="text-sm text-on-surface-variant">
                                    Administra el acceso y roles de los miembros de tu despensa.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="bg-primary text-on-primary px-5 py-2.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-md hover:bg-primary/90 transition-all active:scale-95 shrink-0"
                        >
                            <span className="material-symbols-outlined text-[20px]">person_add</span>
                            Agregar Usuario
                        </button>
                    </header>

                    {/* Grid de contenido */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Columna izquierda: Tabla y Filtros */}
                        <div className="lg:col-span-8">
                            <UserTable
                                users={filteredUsers}
                                isLoading={isLoadingUsers}
                                fetchError={fetchError}
                                onRetry={loadUsers}
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                roleFilter={roleFilter}
                                onRoleChange={setRoleFilter}
                                statusFilter={statusFilter}
                                onStatusChange={setStatusFilter}
                                onDelete={removeUser}
                            />
                        </div>

                        {/* Columna derecha: Resumen de Licencias y Permisos */}
                        <div className="lg:col-span-4">
                            <RolePermissions userCount={users.length} />
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal para crear usuario */}
            <UserModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onUserCreated={addUser}
            />

            {/* Notificaciones flotantes */}
            <Toast
                message={toastMessage}
                onClose={() => setToastMessage(null)}
            />
        </div>
    );
}
