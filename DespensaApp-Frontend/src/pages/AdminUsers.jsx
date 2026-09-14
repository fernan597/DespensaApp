import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchUsers, createUser, deleteUser } from "../services/userService";

export function AdminUsers() {
    const { user: currentUser, logout } = useAuth();

    // Lista de usuarios reales
    const [users, setUsers] = useState([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const [fetchError, setFetchError] = useState(null);

    // Notificaciones / Toast
    const [toastMessage, setToastMessage] = useState(null);

    // Estados de filtros
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");

    // Estado del modal de agregar usuario
    const [isModalOpen, setIsModalOpen] = useState(false);
    const initialFormData = {
        name: "",
        email: "",
        role: "dueño",
        password: "",
        password_confirmation: "",
    };
    const [formData, setFormData] = useState(initialFormData);
    const [formErrors, setFormErrors] = useState({});
    const [formGeneralError, setFormGeneralError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Acordeones de permisos por rol
    const [openPermissions, setOpenPermissions] = useState({
        administrador: false,
        vendedor: true,
        cajero: false,
    });

    const togglePermission = (role) => {
        setOpenPermissions((prev) => ({
            ...prev,
            [role]: !prev[role],
        }));
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData(initialFormData);
        setFormErrors({});
        setFormGeneralError("");
        setShowPassword(false);
        setShowConfirmPassword(false);
    };

    const loadUsers = async () => {
        setIsLoadingUsers(true);
        setFetchError(null);
        try {
            const data = await fetchUsers();
            setUsers(data);
        } catch (err) {
            console.error("Error al cargar usuarios:", err);
            setFetchError("No se pudieron cargar los usuarios del servidor.");
        } finally {
            setIsLoadingUsers(false);
        }
    };

    // Cargar usuarios desde la API al montar el componente
    useEffect(() => {
        loadUsers();
    }, []);

    // Cerrar modal con Escape
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isModalOpen) {
                handleCloseModal();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isModalOpen]);

    // Validación del formulario
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = "El nombre completo es obligatorio";
        } else if (formData.name.trim().length < 2) {
            errors.name = "El nombre debe tener al menos 2 caracteres";
        }

        if (!formData.email.trim()) {
            errors.email = "El correo electrónico es obligatorio";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
            errors.email = "Ingresa un correo electrónico válido";
        } else if (users.some((u) => u.email?.toLowerCase() === formData.email.trim().toLowerCase())) {
            errors.email = "Ya existe un usuario con este correo electrónico";
        }

        if (!formData.password) {
            errors.password = "La contraseña es obligatoria";
        } else if (formData.password.length < 6) {
            errors.password = "La contraseña debe tener al menos 6 caracteres";
        }

        if (!formData.password_confirmation) {
            errors.password_confirmation = "Confirma la contraseña";
        } else if (formData.password !== formData.password_confirmation) {
            errors.password_confirmation = "Las contraseñas no coinciden";
        }

        return errors;
    };

    // Manejador para agregar usuario
    const handleAddUser = async (e) => {
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
                status: created.status,
                created_at: created.created_at,
            };

            setUsers((prev) => [newUser, ...prev]);
            handleCloseModal();
            setToastMessage(`Usuario "${newUser.name}" registrado correctamente.`);
            setTimeout(() => {
                setToastMessage(null);
            }, 4000);
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

    // Manejador para eliminar usuario
    const handleDeleteUser = async (id) => {
        const previousUsers = users;
        setUsers(users.filter((u) => u.id !== id));
        try {
            const response = await deleteUser(id);
            setToastMessage(`Usuario "${response.user.name}" eliminado correctamente.`);
            setTimeout(() => {
                setToastMessage(null);
            }, 4000);
        } catch (error) {
            setUsers(previousUsers);
            setFormGeneralError(error.message || "Error al eliminar el usuario.");
        };
    };

    // Color de avatar según rol
    const getAvatarColor = (role) => {
        if (role === "dueño") {
            return "bg-secondary-container text-on-secondary-container";
        }
        if (role === "empleado") {
            return "bg-surface-variant text-on-surface-variant";
        }
        return "bg-primary text-on-primary";
    };

    // Filtrar usuarios
    const filteredUsers = users.filter((u) => {
        const matchesSearch =
            (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesRole =
            roleFilter === "" ||
            u.role === roleFilter ||
            (roleFilter === "dueño" && (u.role === "dueño" || u.role === "vendedor")) ||
            (roleFilter === "empleado" && (u.role === "empleado" || u.role === "cajero")) ||
            (roleFilter === "admin" && (u.role === "admin" || u.role === "administrador"));

        const userStatus = u.status || "active";
        const matchesStatus = statusFilter === "" || userStatus === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    // Helpers para etiquetas de roles
    const getRoleBadge = (role) => {
        switch (role) {
            case "admin":
            case "administrador":
                return (
                    <span className="inline-flex items-center px-sm py-xs rounded-full bg-primary-container text-on-primary-container font-label-sm text-label-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-primary-container mr-1.5"></span>
                        Administrador
                    </span>
                );
            case "dueño":
            case "vendedor":
                return (
                    <span className="inline-flex items-center px-sm py-xs rounded-full bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-on-secondary-fixed mr-1.5"></span>
                        Vendedor (Dueño)
                    </span>
                );
            case "empleado":
            case "cajero":
                return (
                    <span className="inline-flex items-center px-sm py-xs rounded-full bg-surface-variant text-on-surface-variant font-label-sm text-label-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline mr-1.5"></span>
                        Cajero (Empleado)
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-sm py-xs rounded-full bg-surface-container-high text-on-surface font-label-sm text-label-sm capitalize">
                        {role}
                    </span>
                );
        }
    };

    return (
        <>
            <div className="bg-background font-body-md text-on-background min-h-screen">
                {/* Contenido de la página */}
                <main className="pt-20 min-h-screen bg-surface">
                    <div className="flex flex-col w-full h-full max-w-max-width mx-auto px-margin-mobile lg:px-lg py-lg space-y-xl">
                        {/* Cabecera de la sección */}
                        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-md relative z-10">
                            <div className="flex items-center gap-md">
                                <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center shadow-sm">
                                    <span className="material-symbols-outlined text-on-primary-container text-[24px]">
                                        manage_accounts
                                    </span>
                                </div>
                                <div>
                                    <h2 className="font-headline-lg text-headline-lg text-on-background tracking-tight">
                                        Gestión de Usuarios
                                    </h2>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        Administra el acceso y roles de los miembros de tu despensa.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="bg-primary text-on-primary px-xl py-md rounded-full font-label-md text-label-md flex items-center justify-center gap-sm shadow-md hover:bg-primary/90 transition-colors shrink-0"
                            >
                                <span className="material-symbols-outlined text-[20px]">person_add</span>
                                Agregar Usuario
                            </button>
                        </header>

                        {/* Grid de contenido */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg lg:gap-xl">
                            {/* Columna izquierda: Tabla y Filtros */}
                            <div className="lg:col-span-8 flex flex-col gap-lg">
                                {/* Barra de búsqueda y selectores */}
                                <div className="bg-surface-container-lowest rounded-xl shadow-sm p-sm sm:p-md flex flex-col sm:flex-row gap-sm items-center z-10">
                                    <div className="relative flex-1 w-full">
                                        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                                            search
                                        </span>
                                        <input
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full h-[48px] pl-xl pr-md bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface outline-none transition-shadow placeholder:text-outline"
                                            placeholder="Buscar por nombre o correo..."
                                            type="text"
                                        />
                                    </div>
                                    <div className="flex w-full sm:w-auto gap-sm shrink-0">
                                        <div className="relative w-full sm:w-44">
                                            <select
                                                value={roleFilter}
                                                onChange={(e) => setRoleFilter(e.target.value)}
                                                className="appearance-none w-full h-[48px] px-md bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface outline-none cursor-pointer pr-10"
                                            >
                                                <option value="">Rol: Todos</option>
                                                <option value="dueño">Vendedor (Dueño)</option>
                                                <option value="empleado">Cajero (Empleado)</option>
                                                <option value="admin">Administrador</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                                                expand_more
                                            </span>
                                        </div>
                                        <div className="relative w-full sm:w-40">
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => setStatusFilter(e.target.value)}
                                                className="appearance-none w-full h-[48px] px-md bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface outline-none cursor-pointer pr-10"
                                            >
                                                <option value="">Estado: Todos</option>
                                                <option value="active">Activo</option>
                                                <option value="inactive">Inactivo</option>
                                            </select>
                                            <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                                                expand_more
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla */}
                                <div className="bg-surface-container-lowest rounded-xl shadow-md overflow-hidden relative z-10">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-surface-container-low text-on-surface-variant font-label-md text-label-md uppercase tracking-wider">
                                                    <th className="py-md px-lg font-medium">Usuario</th>
                                                    <th className="py-md px-lg font-medium hidden sm:table-cell">Correo</th>
                                                    <th className="py-md px-lg font-medium">Rol</th>
                                                    <th className="py-md px-lg font-medium text-center">Estado</th>
                                                    <th className="py-md px-lg font-medium text-right">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-body-md text-on-surface">
                                                {isLoadingUsers ? (
                                                    <tr>
                                                        <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                                                            <div className="flex flex-col items-center justify-center gap-2">
                                                                <span className="material-symbols-outlined animate-spin text-primary text-[32px]">
                                                                    progress_activity
                                                                </span>
                                                                <p className="text-body-md font-medium">Cargando usuarios...</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : fetchError ? (
                                                    <tr>
                                                        <td colSpan="5" className="py-12 text-center">
                                                            <div className="flex flex-col items-center justify-center gap-2 text-error">
                                                                <span className="material-symbols-outlined text-[32px]">error</span>
                                                                <p className="text-body-md font-medium">{fetchError}</p>
                                                                <button
                                                                    onClick={loadUsers}
                                                                    className="mt-2 px-md py-1.5 text-xs font-semibold bg-primary text-on-primary rounded-full hover:bg-primary/90 transition-colors shadow-sm"
                                                                >
                                                                    Reintentar
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : filteredUsers.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="5" className="py-12 text-center text-on-surface-variant">
                                                            <span className="material-symbols-outlined text-outline text-[40px] mb-2 block">
                                                                person_off
                                                            </span>
                                                            No se encontraron usuarios con los filtros seleccionados.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredUsers.map((u) => (
                                                        <tr
                                                            key={u.id}
                                                            className={`hover:bg-surface-container-low/50 transition-colors group ${u.status === "inactive" ? "opacity-75" : ""
                                                                }`}
                                                        >
                                                            <td className="py-md px-lg">
                                                                <div className="flex items-center gap-md">
                                                                    <div
                                                                        className={`w-10 h-10 rounded-full flex items-center justify-center font-headline-md text-headline-md shadow-sm ${u.avatarColor || getAvatarColor(u.role)
                                                                            }`}
                                                                    >
                                                                        {u.name ? u.name.charAt(0).toUpperCase() : "U"}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-label-md text-label-md font-medium">
                                                                            {u.name}
                                                                        </p>
                                                                        <p className="font-label-sm text-label-sm text-on-surface-variant sm:hidden">
                                                                            {u.email}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-md px-lg text-on-surface-variant hidden sm:table-cell">
                                                                {u.email}
                                                            </td>
                                                            <td className="py-md px-lg">{getRoleBadge(u.role)}</td>
                                                            <td className="py-md px-lg text-center">
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
                                                            <td className="py-md px-lg text-right">
                                                                <div className="flex justify-end gap-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    <button
                                                                        className="p-xs text-on-surface-variant hover:text-primary transition-colors"
                                                                        title="Editar"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">
                                                                            edit
                                                                        </span>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteUser(u.id)}
                                                                        className="p-xs text-on-surface-variant hover:text-error transition-colors"
                                                                        title="Eliminar"
                                                                    >
                                                                        <span className="material-symbols-outlined text-[20px]">
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

                                    <div className="px-lg py-md bg-surface-container-lowest flex items-center justify-between shadow-[0_-1px_0_rgba(0,0,0,0.05)]">
                                        <p className="font-label-sm text-label-sm text-on-surface-variant">
                                            Mostrando {filteredUsers.length > 0 ? 1 : 0}-{filteredUsers.length} de {filteredUsers.length} usuarios
                                        </p>
                                        <div className="flex gap-sm">
                                            <button
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                                                disabled
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    chevron_left
                                                </span>
                                            </button>
                                            <button
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-50"
                                                disabled
                                            >
                                                <span className="material-symbols-outlined text-[20px]">
                                                    chevron_right
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Columna derecha: Resumen de Licencias y Permisos */}
                            <div className="lg:col-span-4 flex flex-col gap-lg z-10">
                                {/* Resumen de Licencias */}
                                <div className="bg-surface-container-lowest rounded-xl shadow-md p-lg flex flex-col relative overflow-hidden">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-fixed/20 rounded-full blur-2xl z-0 pointer-events-none"></div>
                                    <h3 className="font-title-lg text-title-lg text-on-surface mb-md relative z-10">
                                        Resumen de Licencias
                                    </h3>
                                    <div className="flex items-end gap-sm mb-lg relative z-10">
                                        <span className="font-display-lg text-display-lg text-primary leading-none">
                                            {users.length}
                                        </span>
                                        <span className="font-body-md text-body-md text-on-surface-variant pb-1">
                                            / 5 Asientos Usados
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden relative z-10">
                                        <div
                                            className="h-full bg-primary rounded-full transition-all duration-300"
                                            style={{ width: `${(users.length / 5) * 100}%` }}
                                        ></div>
                                    </div>
                                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-sm relative z-10">
                                        Quedan {Math.max(0, 5 - users.length)} cuentas disponibles en tu plan actual.
                                    </p>
                                    <button className="mt-lg w-full py-md rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors shadow-sm relative z-10">
                                        Actualizar Plan
                                    </button>
                                </div>

                                {/* Permisos por Rol */}
                                <div className="bg-surface-container-lowest rounded-xl shadow-md p-lg flex flex-col z-10">
                                    <h3 className="font-title-lg text-title-lg text-on-surface mb-md">
                                        Permisos por Rol
                                    </h3>
                                    <div className="space-y-4">
                                        {/* Administrador */}
                                        <div className="group">
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => togglePermission("administrador")}
                                            >
                                                <div className="flex items-center gap-sm">
                                                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                                                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                                                        Administrador
                                                    </span>
                                                </div>
                                                <span
                                                    className={`material-symbols-outlined text-outline group-hover:text-primary transition-transform ${openPermissions.administrador ? "rotate-180" : ""
                                                        }`}
                                                >
                                                    expand_more
                                                </span>
                                            </div>
                                            {openPermissions.administrador && (
                                                <div className="mt-sm pl-4 space-y-2">
                                                    <label className="flex items-center gap-sm cursor-not-allowed opacity-70">
                                                        <input
                                                            checked
                                                            disabled
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Control total del sistema y base de datos
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-sm cursor-not-allowed opacity-70">
                                                        <input
                                                            checked
                                                            disabled
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Gestión de usuarios y asignación de roles
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-sm cursor-not-allowed opacity-70">
                                                        <input
                                                            checked
                                                            disabled
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Gestión de licencias y configuraciones globales
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px w-full bg-surface-variant/50"></div>

                                        {/* Vendedor (Dueño) */}
                                        <div className="group">
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => togglePermission("vendedor")}
                                            >
                                                <div className="flex items-center gap-sm">
                                                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                                                        Vendedor (Dueño)
                                                    </span>
                                                </div>
                                                <span
                                                    className={`material-symbols-outlined text-outline group-hover:text-primary transition-transform ${openPermissions.vendedor ? "rotate-180" : ""
                                                        }`}
                                                >
                                                    expand_more
                                                </span>
                                            </div>
                                            {openPermissions.vendedor && (
                                                <div className="mt-sm pl-4 space-y-2">
                                                    <label className="flex items-center gap-sm cursor-pointer">
                                                        <input
                                                            defaultChecked
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Añadir/Editar productos y stock en inventario
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-sm cursor-pointer">
                                                        <input
                                                            defaultChecked
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Gestionar proveedores y órdenes de compra
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-sm cursor-pointer">
                                                        <input
                                                            defaultChecked
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Ver reportes de ventas, ingresos y ganancias
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-sm cursor-pointer">
                                                        <input
                                                            defaultChecked
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Fijar precios de venta y ofertas
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="h-px w-full bg-surface-variant/50"></div>

                                        {/* Cajero (Empleado) */}
                                        <div className="group">
                                            <div
                                                className="flex items-center justify-between cursor-pointer"
                                                onClick={() => togglePermission("cajero")}
                                            >
                                                <div className="flex items-center gap-sm">
                                                    <span className="w-2 h-2 rounded-full bg-outline"></span>
                                                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                                                        Cajero (Empleado)
                                                    </span>
                                                </div>
                                                <span
                                                    className={`material-symbols-outlined text-outline group-hover:text-primary transition-transform ${openPermissions.cajero ? "rotate-180" : ""
                                                        }`}
                                                >
                                                    expand_more
                                                </span>
                                            </div>
                                            {openPermissions.cajero && (
                                                <div className="mt-sm pl-4 space-y-2">
                                                    <label className="flex items-center gap-sm cursor-pointer">
                                                        <input
                                                            defaultChecked
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Punto de venta y cobro a clientes
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-sm cursor-pointer">
                                                        <input
                                                            defaultChecked
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Consulta de precios y disponibilidad de stock
                                                        </span>
                                                    </label>
                                                    <label className="flex items-center gap-sm cursor-pointer">
                                                        <input
                                                            defaultChecked
                                                            type="checkbox"
                                                            className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary"
                                                        />
                                                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                                                            Apertura y cierre de caja por turno
                                                        </span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* Toast de notificación */}
            {toastMessage && (
                <div className="fixed top-24 right-8 z-50 flex items-center gap-sm bg-primary text-on-primary px-lg py-md rounded-xl shadow-xl border border-on-primary/10 transition-all">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    <span className="font-label-md text-label-md font-medium">{toastMessage}</span>
                    <button
                        onClick={() => setToastMessage(null)}
                        className="ml-2 text-on-primary/80 hover:text-on-primary p-1 transition-colors"
                        title="Cerrar notificación"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            {/* Modal para agregar usuario */}
            {isModalOpen && (
                <div
                    onClick={handleCloseModal}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-on-background/40 backdrop-blur-sm p-margin-mobile overflow-y-auto"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-surface-container-lowest w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto border border-surface-variant/30"
                    >
                        {/* Cabecera del modal */}
                        <div className="p-lg border-b border-surface-variant/50 flex items-center justify-between bg-surface-container-low/40">
                            <div className="flex items-center gap-sm">
                                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                                    <span className="material-symbols-outlined text-on-primary-container text-[20px]">
                                        person_add
                                    </span>
                                </div>
                                <div>
                                    <h3 className="font-headline-md text-headline-md text-on-surface">
                                        Nuevo Miembro de la Despensa
                                    </h3>
                                    <p className="text-body-sm text-on-surface-variant">
                                        Ingresa los datos para registrar el usuario en el sistema.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleCloseModal}
                                className="text-on-surface-variant hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
                                title="Cerrar"
                            >
                                <span className="material-symbols-outlined text-[24px]">close</span>
                            </button>
                        </div>

                        {/* Error general del servidor o formulario */}
                        {formGeneralError && (
                            <div className="mx-lg mt-lg p-md bg-error-container text-on-error-container rounded-xl flex items-center gap-sm text-label-md">
                                <span className="material-symbols-outlined text-error text-[20px]">error</span>
                                <p>{formGeneralError}</p>
                            </div>
                        )}

                        {/* Formulario */}
                        <form onSubmit={handleAddUser} className="p-lg space-y-md">
                            {/* Nombre Completo */}
                            <div className="space-y-xs">
                                <label className="font-label-md text-label-md text-on-surface">
                                    Nombre Completo <span className="text-error">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                                        person
                                    </span>
                                    <input
                                        required
                                        value={formData.name}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, name: e.target.value }));
                                            if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                                        }}
                                        className={`w-full h-12 pl-12 pr-md bg-surface-container rounded-lg border-none focus:ring-2 text-body-md text-on-surface outline-none transition-shadow ${formErrors.name
                                                ? "ring-2 ring-error/60 bg-error-container/10"
                                                : "focus:ring-primary/20"
                                            }`}
                                        placeholder="Ej. Juan Pérez"
                                        type="text"
                                    />
                                </div>
                                {formErrors.name && (
                                    <p className="text-label-sm text-error flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">error</span>
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>

                            {/* Correo Electrónico */}
                            <div className="space-y-xs">
                                <label className="font-label-md text-label-md text-on-surface">
                                    Correo Electrónico <span className="text-error">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                                        mail
                                    </span>
                                    <input
                                        required
                                        value={formData.email}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, email: e.target.value }));
                                            if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                                        }}
                                        className={`w-full h-12 pl-12 pr-md bg-surface-container rounded-lg border-none focus:ring-2 text-body-md text-on-surface outline-none transition-shadow ${formErrors.email
                                                ? "ring-2 ring-error/60 bg-error-container/10"
                                                : "focus:ring-primary/20"
                                            }`}
                                        placeholder="juan@ejemplo.com"
                                        type="email"
                                    />
                                </div>
                                {formErrors.email && (
                                    <p className="text-label-sm text-error flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">error</span>
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>

                            {/* Rol */}
                            <div className="space-y-xs">
                                <label className="font-label-md text-label-md text-on-surface">
                                    Rol en la Despensa <span className="text-error">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                                        badge
                                    </span>
                                    <select
                                        value={formData.role}
                                        onChange={(e) =>
                                            setFormData((prev) => ({ ...prev, role: e.target.value }))
                                        }
                                        className="appearance-none w-full h-12 pl-12 pr-10 bg-surface-container rounded-lg border-none focus:ring-2 focus:ring-primary/20 text-body-md text-on-surface outline-none cursor-pointer"
                                    >
                                        <option value="dueño">Vendedor (Dueño de la despensa)</option>
                                        <option value="empleado">Cajero (Empleado en la despensa)</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline pointer-events-none">
                                        expand_more
                                    </span>
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="space-y-xs">
                                <label className="font-label-md text-label-md text-on-surface">
                                    Contraseña Inicial <span className="text-error">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                                        lock
                                    </span>
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => {
                                            setFormData((prev) => ({ ...prev, password: e.target.value }));
                                            if (formErrors.password)
                                                setFormErrors((prev) => ({ ...prev, password: "" }));
                                        }}
                                        className={`w-full h-12 pl-12 pr-12 bg-surface-container rounded-lg border-none focus:ring-2 text-body-md text-on-surface outline-none transition-shadow ${formErrors.password
                                                ? "ring-2 ring-error/60 bg-error-container/10"
                                                : "focus:ring-primary/20"
                                            }`}
                                        placeholder="Mínimo 6 caracteres"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                                        title={showPassword ? "Ocultar" : "Mostrar"}
                                    >
                                        {showPassword ? "visibility_off" : "visibility"}
                                    </button>
                                </div>
                                {formErrors.password && (
                                    <p className="text-label-sm text-error flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">error</span>
                                        {formErrors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirmar Contraseña */}
                            <div className="space-y-xs">
                                <label className="font-label-md text-label-md text-on-surface">
                                    Confirmar Contraseña <span className="text-error">*</span>
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline">
                                        lock_reset
                                    </span>
                                    <input
                                        required
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.password_confirmation}
                                        onChange={(e) => {
                                            setFormData((prev) => ({
                                                ...prev,
                                                password_confirmation: e.target.value,
                                            }));
                                            if (formErrors.password_confirmation)
                                                setFormErrors((prev) => ({
                                                    ...prev,
                                                    password_confirmation: "",
                                                }));
                                        }}
                                        className={`w-full h-12 pl-12 pr-12 bg-surface-container rounded-lg border-none focus:ring-2 text-body-md text-on-surface outline-none transition-shadow ${formErrors.password_confirmation
                                                ? "ring-2 ring-error/60 bg-error-container/10"
                                                : "focus:ring-primary/20"
                                            }`}
                                        placeholder="Repite la contraseña"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="material-symbols-outlined absolute right-md top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
                                        title={showConfirmPassword ? "Ocultar" : "Mostrar"}
                                    >
                                        {showConfirmPassword ? "visibility_off" : "visibility"}
                                    </button>
                                </div>
                                {formErrors.password_confirmation && (
                                    <p className="text-label-sm text-error flex items-center gap-1 mt-1">
                                        <span className="material-symbols-outlined text-[14px]">error</span>
                                        {formErrors.password_confirmation}
                                    </p>
                                )}
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-md pt-md">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    disabled={isSubmitting}
                                    className="flex-1 py-md rounded-full font-label-md text-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-md rounded-full bg-primary text-on-primary font-label-md text-label-md shadow-md hover:bg-primary/90 transition-colors flex items-center justify-center gap-sm disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="material-symbols-outlined animate-spin text-[20px]">
                                                progress_activity
                                            </span>
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[20px]">check</span>
                                            Guardar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
