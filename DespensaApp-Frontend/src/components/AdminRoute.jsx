import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function AdminRoute() {
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

    // ARREGLAR ESTO SOLAMENTE EL ADMIN PUEDE USAR ESTO
    const isAdmin = user?.role === "admin";

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
