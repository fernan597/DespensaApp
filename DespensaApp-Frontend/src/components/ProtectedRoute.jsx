import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LandingPage } from "../pages/LandingPage";

export function ProtectedRoute() {
    const { isAuthenticated, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
                <p></p>
            </div>
        );
    }

    if (!isAuthenticated) {
        if (location.pathname === "/") {
            return <LandingPage />;
        }
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
