<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de Control de Acceso Basado en Roles (RBAC).
 *
 * Intercepta las peticiones HTTP entrantes para garantizar que el usuario
 * autenticado posea alguno de los roles requeridos por la ruta antes de
 * permitir que la solicitud llegue al controlador.
 *
 * Registro del alias:
 *   Configurado en `bootstrap/app.php` bajo el alias `'role'`.
 *
 * Ejemplos de uso en `routes/api.php`:
 *   - Un único rol:      `Route::middleware('role:admin')`
 *   - Múltiples roles:   `Route::middleware('role:admin_despensa,empleado')`
 *
 * Roles del sistema:
 *   - `admin`:          Administrador técnico del sistema (ABM de usuarios y auditoría).
 *   - `admin_despensa`: Administrador del negocio (catálogo, precios, proveedores, compras, caja, ventas).
 *   - `empleado`:       Operador de caja y punto de venta (ventas, apertura/cierre de caja, cobros CC).
 */
class CheckRole
{
    /**
     * Evalúa si el usuario de la petición actual está autenticado y autorizado por rol.
     *
     * Flujo de ejecución:
     *   1. Obtiene el usuario autenticado desde el guard activo (`auth:sanctum`).
     *   2. Si no existe sesión/token válido, corta el flujo con HTTP 401 (Unauthorized).
     *   3. Verifica mediante `User::hasRole()` si el atributo `$user->role` coincide
     *      estrictamente con alguno de los roles recibidos en `...$roles`.
     *   4. Si el rol no coincide, corta el flujo con HTTP 403 (Forbidden).
     *   5. Si cumple las validaciones, delega la petición al siguiente eslabón (`$next($request)`).
     *
     * @param  Request  $request  Instancia de la petición HTTP actual.
     * @param  Closure(Request): (Response)  $next  Callback hacia el siguiente middleware o controlador.
     * @param  string  ...$roles  Lista variádica de roles permitidos (separados por coma en la definición de la ruta).
     * @return Response           Respuesta JSON de error (401/403) o la respuesta del controlador.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        // 1. Recuperar el usuario autenticado inyectado previamente por el middleware 'auth:sanctum'
        $user = $request->user();

        // 2. Si no hay usuario autenticado, rechazar con 401 No Autenticado
        if (! $user) {
            return response()->json([
                'message' => 'No autenticado.',
            ], 401);
        }

        // 3. Comprobar si el rol del usuario está dentro de la lista de roles permitidos en la ruta
        if (! $user->hasRole($roles)) {
            return response()->json([
                'message' => 'Acceso no autorizado para este rol.',
            ], 403);
        }

        // 4. Usuario autenticado y con rol válido: continuar hacia el controlador
        return $next($request);
    }
}
