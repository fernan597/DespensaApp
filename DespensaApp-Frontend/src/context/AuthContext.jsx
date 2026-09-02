import { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "../services/api";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Evita parpadeos mientras verifica la sesión

    // 1. Al cargar la app, verificar si hay un token y obtener los datos del usuario
    useEffect(() => {
        async function checkAuth() {
            const token = localStorage.getItem("auth_token");

            if (token) {
                try {
                    // Petición al endpoint GET /api/user de Laravel
                    const userData = await apiFetch("/user");
                    setUser(userData);
                } catch (error) {
                    console.error("Sesión expirada o token inválido:", error);
                    // Si el token no sirve (401), se borra
                    localStorage.removeItem("auth_token");
                    setUser(null);
                }
            }
            setLoading(false);
        }

        checkAuth();
    }, []);

    // 2. Función de Login: Guarda token y usuario
    const login = (userData, token) => {
        localStorage.setItem("auth_token", token);
        setUser(userData);
    };

    // 3. Función de Logout: Notifica a Laravel y limpia el almacenamiento local
    const logout = async () => {
        try {
            await apiFetch("/logout", { method: "POST" });
        } catch (error) {
            console.error("Error al cerrar sesión en el servidor:", error);
        } finally {
            localStorage.removeItem("auth_token");
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, isAuthenticated: !!user }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);