import { useAuth } from "../context/AuthContext";

/**
 * Hook centralizado para derivar permisos a partir del rol del usuario autenticado.
 *
 * Uso:
 *   const { isAdmin, isAdminDespensa, canUsePOS, canManageProducts } = useRole();
 *
 * Ventaja: si los strings de rol cambian en el backend, solo hay que actualizar este archivo.
 */
export function useRole() {
    const { user } = useAuth();

    const role = user?.role ?? null;

    return {
        /** Admin del sitio web — gestión de usuarios */
        isAdmin: role === "admin",

        /** Admin de la despensa — gestión de productos, stock y caja */
        isAdminDespensa: role === "admin_despensa",

        /** Empleado — operación del punto de venta */
        isEmpleado: role === "empleado",

        /** Puede operar el Punto de Venta (admin_despensa o empleado) */
        canUsePOS: role === "admin_despensa" || role === "empleado",

        /** Puede gestionar productos y stock */
        canManageProducts: role === "admin_despensa",

        /** Puede gestionar usuarios */
        canManageUsers: role === "admin",

        /** Rol crudo por si se necesita para lógica específica */
        role,
    };
}
