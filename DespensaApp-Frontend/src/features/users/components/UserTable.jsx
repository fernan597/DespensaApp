const getAvatarColor = (role) => {
    if (role === "dueño" || role === "vendedor") {
        return "bg-secondary-container text-on-secondary-container";
    }
    if (role === "empleado" || role === "cajero") {
        return "bg-surface-variant text-on-surface-variant";
    }
    return "bg-primary text-on-primary";
};

const getRoleBadge = (role) => {
    switch (role) {
        case "admin":
        case "administrador":
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container mr-1.5"></span>
                    Administrador
                </span>
            );
        case "dueño":
        case "vendedor":
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-on-secondary-fixed mr-1.5"></span>
                    Vendedor (Dueño)
                </span>
            );
        case "empleado":
        case "cajero":
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-variant text-on-surface-variant text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-outline mr-1.5"></span>
                    Cajero (Empleado)
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-surface-container-high text-on-surface text-xs font-semibold capitalize">
                    {role}
                </span>
            );
    }
};

/**
 * Tabla de usuarios con filtros de búsqueda, selector de roles y estados.
 */
export function UserTable({
    users,
    isLoading,
    fetchError,
    onRetry,
    searchTerm,
    onSearchChange,
    roleFilter,
    onRoleChange,
    statusFilter,
    onStatusChange,
    onDelete,
}) {
    return (
        <div className="flex flex-col gap-4">
            {/* Barra de búsqueda y selectores */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm p-3 sm:p-4 flex flex-col sm:flex-row gap-3 items-center z-10 border border-outline-variant/30">
                <div className="relative flex-1 w-full">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                        search
                    </span>
                    <input
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="w-full h-11 pl-10 pr-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm text-on-surface outline-none transition-shadow placeholder:text-outline"
                        placeholder="Buscar por nombre o correo..."
                        type="text"
                    />
                </div>
                <div className="flex w-full sm:w-auto gap-2 shrink-0">
                    <div className="relative w-full sm:w-44">
                        <select
                            value={roleFilter}
                            onChange={(e) => onRoleChange(e.target.value)}
                            className="appearance-none w-full h-11 px-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm text-on-surface outline-none cursor-pointer pr-10"
                        >
                            <option value="">Rol: Todos</option>
                            <option value="dueño">Vendedor (Dueño)</option>
                            <option value="empleado">Cajero (Empleado)</option>
                            <option value="admin">Administrador</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                            expand_more
                        </span>
                    </div>
                    <div className="relative w-full sm:w-40">
                        <select
                            value={statusFilter}
                            onChange={(e) => onStatusChange(e.target.value)}
                            className="appearance-none w-full h-11 px-3 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-sm text-on-surface outline-none cursor-pointer pr-10"
                        >
                            <option value="">Estado: Todos</option>
                            <option value="active">Activo</option>
                            <option value="inactive">Inactivo</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none text-[20px]">
                            expand_more
                        </span>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden relative z-10">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                                <th className="py-3 px-4 font-semibold">Usuario</th>
                                <th className="py-3 px-4 font-semibold hidden sm:table-cell">Correo</th>
                                <th className="py-3 px-4 font-semibold">Rol</th>
                                <th className="py-3 px-4 font-semibold text-center">Estado</th>
                                <th className="py-3 px-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-on-surface divide-y divide-outline-variant/20">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
                                                progress_activity
                                            </span>
                                            <p className="font-medium">Cargando usuarios...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : fetchError ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-error">
                                            <span className="material-symbols-outlined text-[32px]">error</span>
                                            <p className="font-medium">{fetchError}</p>
                                            <button
                                                onClick={onRetry}
                                                className="mt-2 px-4 py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                                            >
                                                Reintentar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                                        <span className="material-symbols-outlined text-outline text-[40px] mb-2 block">
                                            person_off
                                        </span>
                                        No se encontraron usuarios con los filtros seleccionados.
                                    </td>
                                </tr>
                            ) : (
                                users.map((u) => (
                                    <tr
                                        key={u.id}
                                        className={`hover:bg-surface-container-low/50 transition-colors group ${
                                            u.status === "inactive" ? "opacity-75" : ""
                                        }`}
                                    >
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${
                                                        u.avatarColor || getAvatarColor(u.role)
                                                    }`}
                                                >
                                                    {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-on-surface">{u.name}</p>
                                                    <p className="text-xs text-on-surface-variant sm:hidden">{u.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4 text-on-surface-variant hidden sm:table-cell">
                                            {u.email}
                                        </td>
                                        <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                                        <td className="py-3 px-4 text-center">
                                            {(u.status || "active") === "active" ? (
                                                <span
                                                    className="material-symbols-outlined text-primary text-[20px]"
                                                    title="Activo"
                                                >
                                                    check_circle
                                                </span>
                                            ) : (
                                                <span
                                                    className="material-symbols-outlined text-outline text-[20px]"
                                                    title="Inactivo"
                                                >
                                                    cancel
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onDelete(u.id)}
                                                    className="p-1.5 text-on-surface-variant hover:text-error rounded-lg hover:bg-surface-container transition-colors"
                                                    title="Eliminar usuario"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        delete
                                                    </span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-4 py-3 bg-surface-container-lowest flex items-center justify-between border-t border-outline-variant/20 text-xs text-on-surface-variant">
                    <p>
                        Mostrando {users.length > 0 ? 1 : 0}-{users.length} de {users.length} usuarios
                    </p>
                </div>
            </div>
        </div>
    );
}
