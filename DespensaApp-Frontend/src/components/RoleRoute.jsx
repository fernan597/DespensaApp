import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * Guard route genérico parametrizable por roles.
 * Reemplaza AdminRoute y AdminDespensaRoute (que eran idénticos salvo el rol verificado).
 *
 * Uso en App.jsx:
 *   <RoleRoute roles={["admin"]} />
 *   <RoleRoute roles={["admin_despensa", "empleado"]} />
 *
 * @param {{ roles: string[] }} props - Lista de roles con acceso permitido.
 */
export function RoleRoute({ roles }) {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background text-on-background">
                <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined animate-spin text-primary">sync</span>
                    <p className="font-body-md">Verificando permisos...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!roles.includes(user?.role)) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
