import { useAuth } from "../context/AuthContext";

export function Dashboard() {
    const { user, logout } = useAuth();

    return (
        <div style={{ maxWidth: "600px", margin: "40px auto", padding: "20px", fontFamily: "sans-serif" }}>
            <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                <h1>DespensaApp - Dashboard</h1>
                <button
                    onClick={logout}
                    style={{
                        padding: "8px 16px",
                        backgroundColor: "#e53e3e",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Cerrar sesión
                </button>
            </header>

            <div style={{ padding: "16px", background: "#f7fafc", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                <h3>Bienvenido/a, {user?.name || user?.email || "Usuario"}!</h3>
                <p><strong>Email:</strong> {user?.email}</p>
                {user?.id && <p><strong>ID:</strong> {user?.id}</p>}
            </div>
        </div>
    );
}
