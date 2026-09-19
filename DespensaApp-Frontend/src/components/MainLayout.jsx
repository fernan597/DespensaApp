import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRole } from "../hooks/useRole";

/**
 * Ítem de navegación del sidebar.
 * Encapsula el markup y las clases activo/inactivo para evitar repetición.
 */
function SidebarNavLink({ to, icon, label, end = false }) {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) =>
                `flex items-center px-md py-md rounded-xl transition-all duration-200 ${
                    isActive
                        ? "bg-secondary-container text-on-secondary-container font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                }`
            }
        >
            <span className="material-symbols-outlined mr-md">{icon}</span>
            <span className="font-label-md text-label-md">{label}</span>
        </NavLink>
    );
}

export function MainLayout() {
    const { user, logout } = useAuth();
    const { isAdmin, isAdminDespensa, canUsePOS } = useRole();

    return (
        <div className="bg-background font-body-md text-on-background min-h-screen">

            {/* Sidebar lateral fijo */}
            <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col shadow-[4px_0_12px_rgba(21,66,18,0.04)]">
                <div className="px-xl py-xl flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-[32px]">potted_plant</span>
                    <h1 className="font-headline-md text-headline-md text-primary tracking-tight">DespensaApp</h1>
                </div>

                <nav className="flex-1 px-md flex flex-col gap-xs">
                    <SidebarNavLink to="/" icon="dashboard" label="Dashboard" end />

                    {isAdmin && (
                        <SidebarNavLink to="/admin/usuarios" icon="group" label="Usuarios" />
                    )}

                    {isAdminDespensa && (
                        <SidebarNavLink to="/admin/productos" icon="inventory_2" label="Productos y Stock" />
                    )}

                    {canUsePOS && (
                        <SidebarNavLink to="/punto-de-venta" icon="point_of_sale" label="Punto de Venta" />
                    )}

                    {/* Botón Cerrar Sesión */}
                    <button
                        onClick={logout}
                        className="flex items-center px-md py-md rounded-xl text-on-surface-variant hover:bg-error-container hover:text-error transition-all duration-200 mt-auto mb-xl text-left w-full"
                    >
                        <span className="material-symbols-outlined mr-md">logout</span>
                        <span className="font-label-md text-label-md">Cerrar Sesión</span>
                    </button>
                </nav>
            </aside>

            {/* Contenedor principal con margen izquierdo desplazado por el sidebar */}
            <div className="pl-72">

                {/* Header superior fijo */}
                <header className="fixed top-0 left-72 right-0 h-20 bg-surface/80 backdrop-blur-xl z-40 px-margin-desktop flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
                    <div className="flex-1 max-w-xl">
                        <div className="relative flex items-center">
                            <span className="text-sm font-medium text-primary bg-primary-container/40 px-3 py-1 rounded-full">
                                Panel de Administración
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-xl">
                        <div className="flex items-center gap-md pl-md">
                            <div className="text-right hidden sm:block">
                                <p className="font-label-md text-label-md text-on-surface font-semibold">
                                    {user?.name || "Administrador"}
                                </p>
                                <p className="text-label-sm text-on-surface-variant">
                                    {user?.email || "admin@verdant.local"}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center border-2 border-surface-container-high shadow-sm">
                                <span className="material-symbols-outlined text-on-primary text-[20px]">person</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Inyección dinámica del contenido interno mediante Outlet */}
                <main className="pt-20 min-h-screen bg-surface">
                    <Outlet />
                </main>

            </div>
        </div>
    );
}
