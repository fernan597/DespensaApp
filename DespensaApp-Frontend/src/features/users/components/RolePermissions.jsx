import { useState } from "react";

/**
 * Panel lateral con resumen de licencias y acordeón de permisos por rol.
 */
export function RolePermissions({ userCount = 0 }) {
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

    return (
        <div className="flex flex-col gap-lg z-10">
            {/* Resumen de Licencias */}
            <div className="bg-surface-container-lowest rounded-xl shadow-md p-lg flex flex-col relative overflow-hidden border border-outline-variant/20">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary-fixed/20 rounded-full blur-2xl z-0 pointer-events-none"></div>
                <h3 className="font-title-lg text-title-lg text-on-surface mb-md relative z-10 font-bold">
                    Resumen de Licencias
                </h3>
                <div className="flex items-end gap-sm mb-lg relative z-10">
                    <span className="font-display-lg text-3xl font-bold text-primary leading-none">
                        {userCount}
                    </span>
                    <span className="font-body-md text-sm text-on-surface-variant pb-1">
                        / 5 Asientos Usados
                    </span>
                </div>
                <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden relative z-10">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (userCount / 5) * 100)}%` }}
                    ></div>
                </div>
                <p className="font-label-sm text-xs text-on-surface-variant mt-sm relative z-10">
                    Quedan {Math.max(0, 5 - userCount)} cuentas disponibles en tu plan actual.
                </p>
                <button
                    type="button"
                    className="mt-lg w-full py-2.5 rounded-xl bg-surface-container text-on-surface font-label-md text-sm font-semibold hover:bg-surface-container-high transition-colors shadow-sm relative z-10"
                >
                    Actualizar Plan
                </button>
            </div>

            {/* Permisos por Rol */}
            <div className="bg-surface-container-lowest rounded-xl shadow-md p-lg flex flex-col z-10 border border-outline-variant/20">
                <h3 className="font-title-lg text-title-lg text-on-surface mb-md font-bold">
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
                                <span className="font-label-md text-sm text-on-surface font-semibold">
                                    Administrador
                                </span>
                            </div>
                            <span
                                className={`material-symbols-outlined text-outline group-hover:text-primary transition-transform ${
                                    openPermissions.administrador ? "rotate-180" : ""
                                }`}
                            >
                                expand_more
                            </span>
                        </div>
                        {openPermissions.administrador && (
                            <div className="mt-sm pl-4 space-y-2 text-xs">
                                <label className="flex items-center gap-sm cursor-not-allowed opacity-70">
                                    <input checked disabled type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none" />
                                    <span className="text-on-surface-variant">Control total del sistema y base de datos</span>
                                </label>
                                <label className="flex items-center gap-sm cursor-not-allowed opacity-70">
                                    <input checked disabled type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none" />
                                    <span className="text-on-surface-variant">Gestión de usuarios y asignación de roles</span>
                                </label>
                                <label className="flex items-center gap-sm cursor-not-allowed opacity-70">
                                    <input checked disabled type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none" />
                                    <span className="text-on-surface-variant">Gestión de licencias y configuraciones globales</span>
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
                                <span className="font-label-md text-sm text-on-surface font-semibold">
                                    Vendedor (Dueño)
                                </span>
                            </div>
                            <span
                                className={`material-symbols-outlined text-outline group-hover:text-primary transition-transform ${
                                    openPermissions.vendedor ? "rotate-180" : ""
                                }`}
                            >
                                expand_more
                            </span>
                        </div>
                        {openPermissions.vendedor && (
                            <div className="mt-sm pl-4 space-y-2 text-xs">
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input defaultChecked type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary" />
                                    <span className="text-on-surface-variant">Añadir/Editar productos y stock en inventario</span>
                                </label>
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input defaultChecked type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary" />
                                    <span className="text-on-surface-variant">Gestionar proveedores y órdenes de compra</span>
                                </label>
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input defaultChecked type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary" />
                                    <span className="text-on-surface-variant">Ver reportes de ventas, ingresos y ganancias</span>
                                </label>
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input defaultChecked type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary" />
                                    <span className="text-on-surface-variant">Fijar precios de venta y ofertas</span>
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
                                <span className="font-label-md text-sm text-on-surface font-semibold">
                                    Cajero (Empleado)
                                </span>
                            </div>
                            <span
                                className={`material-symbols-outlined text-outline group-hover:text-primary transition-transform ${
                                    openPermissions.cajero ? "rotate-180" : ""
                                }`}
                            >
                                expand_more
                            </span>
                        </div>
                        {openPermissions.cajero && (
                            <div className="mt-sm pl-4 space-y-2 text-xs">
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input defaultChecked type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary" />
                                    <span className="text-on-surface-variant">Punto de venta y cobro a clientes</span>
                                </label>
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input defaultChecked type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary" />
                                    <span className="text-on-surface-variant">Consulta de precios y disponibilidad de stock</span>
                                </label>
                                <label className="flex items-center gap-sm cursor-pointer">
                                    <input defaultChecked type="checkbox" className="w-4 h-4 rounded text-primary bg-surface-container border-none accent-primary" />
                                    <span className="text-on-surface-variant">Arqueo y cierre de caja diario</span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
