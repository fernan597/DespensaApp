import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { LoginForm } from "./pages/login";
import { Dashboard } from "./pages/Dashboard";
import { AdminUsers } from "./pages/AdminUsers";
import { AdminProducts } from "./pages/AdminProducts";
import { PuntoDeVenta } from "./pages/PuntoDeVenta";
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
              <Route element={<RoleRoute roles={["admin"]} />}>
                <Route path="/admin/usuarios" element={<AdminUsers />} />
              </Route>

              {/* Exclusivo Admin Despensa — Gestión de Productos */}
              <Route element={<RoleRoute roles={["admin_despensa"]} />}>
                <Route path="/admin/productos" element={<AdminProducts />} />
              </Route>

              {/* Punto de Venta — empleado y admin_despensa */}
              <Route element={<RoleRoute roles={["admin_despensa", "empleado"]} />}>
                <Route path="/punto-de-venta" element={<PuntoDeVenta />} />
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

