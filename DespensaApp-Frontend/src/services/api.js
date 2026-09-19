const API_URL = "http://localhost:8000/api";

export async function apiFetch(endpoint, options = {}) {
    //Recuperar el token guardado tras el login
    const token = localStorage.getItem("auth_token");

    const headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        //Adjuntar el Bearer Token si existe
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
    };

    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    // 5. Manejo de errores HTTP (para capturar 401 Unauthorized, 422 Validation, etc.)
    const data = await res.json();

    if (!res.ok) {
        const error = new Error(data.message || "Error en la petición");
        error.status = res.status;
        error.data = data; // Contiene los errores de validación (data.errors)
        throw error;
    }

    return data;
}