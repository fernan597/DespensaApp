// Lee la variable de entorno VITE_API_URL definida en el archivo .env
// Si no existe esa variable (por ejemplo en desarrollo local), usa "http://localhost:8000/api" como valor por defecto
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// Declara y exporta la función apiFetch para que otros archivos puedan importarla
// "async" significa que la función puede usar "await" y devuelve una Promesa
// "endpoint" es la ruta del recurso que queremos consultar, ej: "/productos"
// "options" son parámetros opcionales de la petición (método, cuerpo, etc.); si no se pasan, es un objeto vacío {}
export async function apiFetch(endpoint, options = {}) {

    // Busca en el almacenamiento local del navegador (localStorage) el token JWT
    // que se guardó cuando el usuario inició sesión
    // Si el usuario NO está logueado, token será null
    const token = localStorage.getItem("auth_token");

    // Crea el objeto de cabeceras (headers) que se enviarán junto con la petición HTTP
    const headers = {
        "Content-Type": "application/json",  // Le dice al servidor que estamos enviando datos en formato JSON
        "Accept": "application/json",        // Le dice al servidor que esperamos recibir una respuesta en formato JSON

        // Si el token existe (no es null), agrega la cabecera Authorization con el formato "Bearer <token>"
        // Esto es lo que le demuestra al servidor que el usuario está autenticado
        // El operador "&&" evita agregar la cabecera si el token es null o vacío
        // El operador "..." (spread) despliega las propiedades del objeto dentro de headers
        ...(token && { Authorization: `Bearer ${token}` }),

        // Si el llamador pasó cabeceras extra en options.headers, las agrega aquí
        // Estas tienen prioridad: si tienen el mismo nombre que las anteriores, las sobreescriben
        ...options.headers,
    };

    // Realiza la petición HTTP real usando la Fetch API del navegador
    // "await" pausa la función hasta que el servidor responda
    // La URL completa se arma concatenando API_URL + endpoint, ej: "http://localhost:8000/api/productos"
    const res = await fetch(`${API_URL}${endpoint}`, {
        ...options,  // Copia todas las opciones que pasó el llamador (method, body, signal, etc.)
        headers,     // Reemplaza las headers con las que acabamos de construir arriba
    });

    // Convierte el cuerpo de la respuesta de texto JSON a un objeto JavaScript
    // "await" pausa porque leer el cuerpo también es una operación asíncrona
    // Esto se hace SIEMPRE, incluso si hubo un error, porque el servidor manda detalles del error en JSON
    const data = await res.json();

    // Verifica si la respuesta HTTP fue exitosa (código 2xx como 200, 201, etc.)
    // "res.ok" es false cuando el código es 4xx (error del cliente) o 5xx (error del servidor)
    if (!res.ok) {

        // Crea un nuevo objeto Error con el mensaje que vino del servidor
        // Si el servidor no mandó un mensaje, usa el texto genérico "Error en la petición"
        const error = new Error(data.message || "Error en la petición");

        // Agrega el código de estado HTTP al objeto error para que el llamador sepa qué pasó
        // Ejemplos: 401 = no autorizado, 422 = datos inválidos, 500 = error del servidor
        error.status = res.status;

        // Agrega el cuerpo completo de la respuesta al error
        // Útil para acceder a los errores de validación campo por campo (data.errors)
        error.data = data;

        // Lanza el error para interrumpir la ejecución y avisarle al llamador que algo falló
        // El llamador deberá atraparlo con try/catch o .catch()
        throw error;
    }

    // Si todo salió bien, devuelve el objeto JavaScript con los datos de la respuesta
    return data;
}
