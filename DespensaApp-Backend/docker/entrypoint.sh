#!/usr/bin/env bash
set -e

# 1. Puerto dinámico inyectado por Render (por defecto 8080)
export PORT="${PORT:-8080}"

echo "==> Configurando Apache para escuchar en el puerto ${PORT}..."
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf

# 2. Compatibilidad con DATABASE_URL de Render PostgreSQL / Neon / Supabase
if [ -n "${DATABASE_URL:-}" ] && [ -z "${DB_URL:-}" ]; then
    export DB_URL="${DATABASE_URL}"
fi

# 3. Asegurar directorios y permisos de escritura de Laravel
mkdir -p storage/framework/{sessions,views,cache/data} storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

# 4. Limpiar y optimizar cachés de configuración y rutas para producción
php artisan config:clear
php artisan route:clear

if [ "${APP_ENV:-production}" = "production" ]; then
    php artisan config:cache
    php artisan route:cache
fi

# 5. Ejecutar migraciones automáticamente al desplegar (desactivable con RUN_MIGRATIONS=false)
if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
    echo "==> Ejecutando migraciones de base de datos..."
    php artisan migrate --force
fi

# 6. Ejecutar seeder de usuarios administradores iniciales si RUN_ADMIN_SEEDER=true
if [ "${RUN_ADMIN_SEEDER:-true}" = "true" ]; then
    echo "==> Verificando/creando usuarios administradores iniciales (AdminUserSeeder)..."
    php artisan db:seed --class=Database\\Seeders\\AdminUserSeeder --force
fi

# 7. Ejecutar todos los seeders de catálogo si RUN_SEEDERS=true
if [ "${RUN_SEEDERS:-false}" = "true" ]; then
    echo "==> Ejecutando seeders de base de datos..."
    php artisan db:seed --force
fi

echo "==> Iniciando servidor Apache en puerto ${PORT}..."
exec apache2-foreground

