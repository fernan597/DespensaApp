import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../services/api";

export function LoginForm() {
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // Si ya está logueado, redirigir directo al dashboard
    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setGeneralError("");
        setIsSubmitting(true);

        try {
            const data = await apiFetch("/login", {
                method: "POST",
                body: JSON.stringify({ email, password }),
            });

            // Pasa el objeto de usuario y el token que devuelve tu controller de Laravel
            login(data.user, data.token);

            // Redirigir al dashboard
            navigate("/", { replace: true });
        } catch (error) {
            if (error.status === 422 && error.data?.errors) {
                setErrors(error.data.errors);
            } else {
                setGeneralError(error.message || "Credenciales incorrectas o error en el servidor");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-surface font-body-md text-on-surface flex items-center justify-center min-h-screen">
            <main className="w-full max-w-md">
                <div className="flex flex-col w-full h-full items-center justify-center p-lg relative overflow-hidden bg-surface">

                    {/* Elementos decorativos */}
                    <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary-fixed-dim/20 rounded-full blur-3xl"></div>
                    <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-secondary-fixed/30 rounded-full blur-3xl"></div>

                    {/* Tarjeta de Login */}
                    <div className="w-full max-w-sm bg-surface-container-lowest rounded-2xl shadow-xl relative z-10 p-xl flex flex-col gap-lg">

                        {/* Header */}
                        <div className="text-center flex flex-col gap-sm">
                            <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-sm">
                                <span className="material-symbols-outlined text-on-primary-container text-[32px]">
                                    eco
                                </span>
                            </div>
                            <h1 className="font-headline-lg text-2xl font-bold text-on-surface">Bienvenido</h1>
                            <p className="font-body-md text-body-md text-on-surface-variant">Gestiona tu despensa</p>
                        </div>
                        {/* Mensaje de error general */}
                        {generalError && (
                            <div className="p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded-lg text-center">
                                {generalError}
                            </div>
                        )}
                        {/* Formulario */}
                        <form onSubmit={handleSubmit} className="flex flex-col gap-md w-full">

                            {/* Input Email */}
                            <div className="flex flex-col gap-xs">
                                <label className="font-label-md text-label-md text-on-surface" htmlFor="email">
                                    Correo Electrónico
                                </label>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">
                                        mail
                                    </span>
                                    <input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="tu@email.com"
                                        required
                                        className="w-full h-12 bg-surface-container rounded-lg pl-12 pr-md font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
                                    />
                                </div>
                                {errors.email && (
                                    <span className="text-xs text-red-600 mt-1">{errors.email[0]}</span>
                                )}
                            </div>

                            {/* Input Password */}
                            <div className="flex flex-col gap-xs">
                                <div className="flex justify-between items-center">
                                    <label className="font-label-md text-label-md text-on-surface" htmlFor="password">
                                        Contraseña
                                    </label>
                                </div>
                                <div className="relative">
                                    <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">
                                        lock
                                    </span>
                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        className="w-full h-12 bg-surface-container rounded-lg pl-12 pr-md font-body-md text-body-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest transition-colors"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-md top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? "visibility" : "visibility_off"}
                                        </span>
                                    </button>
                                </div>
                                {errors.password && (
                                    <span className="text-xs text-red-600 mt-1">{errors.password[0]}</span>
                                )}
                            </div>

                            {/* Botón Submit */}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full h-12 bg-primary text-on-primary rounded-full font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all mt-sm shadow-sm disabled:opacity-50"
                            >
                                {isSubmitting ? "Iniciando sesión..." : "Iniciar Sesión"}
                            </button>
                        </form>

                    </div>
                </div>
            </main>
        </div>
    );
}
