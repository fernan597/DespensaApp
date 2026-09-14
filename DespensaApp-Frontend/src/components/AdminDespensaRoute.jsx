import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminDespensaRoute() {
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


    const isAdminDespensa = user?.role === "admin_despensa";

    if (!isAdminDespensa) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}