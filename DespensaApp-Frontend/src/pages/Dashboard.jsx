import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Dashboard() {
    const { user, logout } = useAuth();
    const isAdmin = user?.role === "admin";
    const isAdminDespensa = user?.role === "admin_despensa";


    return (
        <div className="min-h-screen bg-background text-on-background p-md sm:p-xl font-body-md">
            <div className="max-w-3xl mx-auto space-y-lg">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-md pb-md border-b border-surface-variant/60">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-primary text-[32px]">potted_plant</span>
                        <div>
                            <h1 className="font-headline-md text-headline-md text-primary tracking-tight">
                                DespensaApp
                            </h1>
                            <p className="text-label-sm text-on-surface-variant">Panel General</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-md">
                        <button
                            onClick={logout}
                            className="px-md py-sm rounded-full bg-surface-container text-error hover:bg-error-container hover:text-on-error-container font-label-md text-label-md transition-colors flex items-center gap-xs"
                        >
                            <span className="material-symbols-outlined text-[18px]">logout</span>
                            Cerrar sesión
                        </button>
                    </div>
                </header>

                <div className="bg-surface-container-lowest p-lg rounded-2xl shadow-sm border border-surface-container-high space-y-sm">
                    <div className="flex items-center gap-md">
                        <div className="w-12 h-12 rounded-full bg-primary text-on-primary flex items-center justify-center font-headline-md text-headline-md shadow-sm">
                            {(user?.name || user?.email || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="font-title-lg text-title-lg text-on-surface">
                                ¡Bienvenido/a, {user?.name || user?.email || "Usuario"}!
                            </h2>
                            <p className="text-on-surface-variant text-body-md">
                                Rol actual: <span className="font-semibold text-primary capitalize">{user?.role || "Sin rol asignado"}</span>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Gestión de Usuarios - solo Admin */}
                {isAdmin && (
                    <div className="bg-primary-container/20 border border-primary/20 p-lg rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-md shadow-sm">
                        <div className="flex items-center gap-md">
                            <div className="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-[26px]">manage_accounts</span>
                            </div>
                            <div>
                                <h3 className="font-headline-md text-title-lg text-primary font-bold">
                                    Gestión de Usuarios
                                </h3>
                                <p className="text-on-surface-variant text-label-md">
                                    Accede al panel de control para administrar roles y miembros del sistema.
                                </p>
                            </div>
                        </div>
                        <Link to="/admin/usuarios" className="inline-flex items-center justify-center gap-xs px-lg py-md bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary/90 transition-colors shrink-0 shadow-sm">
                            <span>Ir al Panel de Usuarios</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                    </div>
                )}

                {/* Gestión de Productos - solo Owner */}
                {isAdminDespensa && (
                    <div className="bg-secondary-container/20 border border-secondary/20 p-lg rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-md shadow-sm">
                        <div className="flex items-center gap-md">
                            <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center">
                                <span className="material-symbols-outlined text-[26px]">inventory_2</span>
                            </div>
                            <div>
                                <h3 className="font-headline-md text-title-lg text-secondary font-bold">
                                    Gestión de Productos
                                </h3>
                                <p className="text-on-surface-variant text-label-md">
                                    Administra el catálogo de productos y el inventario del negocio.
                                </p>
                            </div>
                        </div>
                        <Link to="/admin/productos" className="inline-flex items-center justify-center gap-xs px-lg py-md bg-secondary text-on-secondary rounded-full font-label-md text-label-md hover:bg-secondary/90 transition-colors shrink-0 shadow-sm">
                            <span>Ir al Panel de Productos</span>
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </Link>
                    </div>
                )}

                {/* Placeholder si no tiene ninguna sección especial */}
                {!isAdmin && !isAdminDespensa && (
                    <div className="bg-surface-container-lowest p-lg rounded-2xl border border-surface-container-high text-on-surface-variant text-center space-y-xs">
                        <span className="material-symbols-outlined text-outline text-[32px]">storefront</span>
                        <p className="font-label-md">Sección de ventas e inventario en desarrollo.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
