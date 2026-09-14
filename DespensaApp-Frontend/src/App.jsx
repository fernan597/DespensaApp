import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { DueñoRoute } from "./components/DueñoRoute";
import { LoginForm } from "./pages/login";
import { Dashboard } from "./pages/Dashboard";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminProducts } from "./pages/AdminProducts";
import { MainLayout } from "./components/MainLayout";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginForm />} />

          {/* RUTAS PROTEGIDAS CON SIDEBAR PERMANENTE */}
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>

              {/* Inicio / Dashboard */}
              <Route path="/" element={<Dashboard />} />

              {/* Exclusivo Admin del Sistema */}
              <Route element={<AdminRoute />}>
                <Route path="/admin/usuarios" element={<AdminUsers />} />
              </Route>

              {/* Exclusivo Dueño / Gestión de Productos */}
              <Route element={<DueñoRoute />}>
                <Route path="/admin/productos" element={<AdminProducts />} />
              </Route>

            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
