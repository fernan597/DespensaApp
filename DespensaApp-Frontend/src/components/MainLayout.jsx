import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // Ajusta la ruta a tu AuthContext

export function MainLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="bg-background font-body-md text-on-background min-h-screen">

            {/* Sidebar lateral fijo */}
            <aside className="fixed left-0 top-0 h-full w-72 bg-surface-container-low z-50 flex flex-col shadow-[4px_0_12px_rgba(21,66,18,0.04)]">
                <div className="px-xl py-xl flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-[32px]">potted_plant</span>
                    <h1 className="font-headline-md text-headline-md text-primary tracking-tight">Verdant</h1>
                </div>

                <nav className="flex-1 px-md flex flex-col gap-xs">
                    {/* Opción de Usuarios (Solo visible para Admin) */}
                    {(user?.role === "admin") && (
                        <NavLink
                            to="/admin/usuarios"
                            className={({ isActive }) =>
                                `flex items-center px-md py-md rounded-xl transition-all duration-200 ${isActive
                                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                                }`
                            }
                        >
                            <span className="material-symbols-outlined mr-md">group</span>
                            <span className="font-label-md text-label-md">Usuarios</span>
                        </NavLink>
                    )}

                    {/* Opción de Productos y Stock (Para el Dueño / Vendedor) */}
                    {user?.role === "admin_despensa" && (

                        <NavLink
                            to="/admin/productos"
                            className={({ isActive }) =>
                                `flex items-center px-md py-md rounded-xl transition-all duration-200 ${isActive
                                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                                }`
                            }
                        >
                            <span className="material-symbols-outlined mr-md">inventory_2</span>
                            <span className="font-label-md text-label-md">Productos y Stock</span>
                        </NavLink>

                    )}

                    {/* Opción Punto de Venta (Visible para Dueño y Empleados) */}
                    {(user?.role === "admin_despensa" || user?.role === "empleado") && (
                        <NavLink
                            to="/punto-de-venta"
                            className={({ isActive }) =>
                                `flex items-center px-md py-md rounded-xl transition-all duration-200 ${isActive
                                    ? "bg-secondary-container text-on-secondary-container font-semibold"
                                    : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                                }`
                            }
                        >
                            <span className="material-symbols-outlined mr-md">point_of_sale</span>
                            <span className="font-label-md text-label-md">Punto de Venta</span>
                        </NavLink>
                    )}


                    {/* Dashboard General */}
                    <NavLink
                        to="/"
                        end
                        className={({ isActive }) =>
                            `flex items-center px-md py-md rounded-xl transition-all duration-200 ${isActive
                                ? "bg-secondary-container text-on-secondary-container font-semibold"
                                : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
                            }`
                        }
                    >
                        <span className="material-symbols-outlined mr-md">dashboard</span>
                        <span className="font-label-md text-label-md">Dashboard</span>
                    </NavLink>

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
                        <button className="relative p-sm text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">notifications</span>
                            <span className="absolute top-1 right-1 w-2 h-2 bg-error rounded-full"></span>
                        </button>

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