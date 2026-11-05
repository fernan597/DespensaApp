# ==============================================================================
# Dockerfile de Producción para DespensaApp-Backend (Laravel 12 + PostgreSQL)
# Optimizado para despliegue en Render.com
# ==============================================================================
FROM php:8.4-apache

# 1. Instalar dependencias del sistema y librerías necesarias para PostgreSQL, BCMath y Zip
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    curl \
    unzip \
    libpq-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install \
        pdo \
        pdo_pgsql \
        pgsql \
        bcmath \
        mbstring \
        zip \
        opcache \
    && a2enmod rewrite headers \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 2. Configurar OPcache para rendimiento en producción
RUN { \
    echo 'opcache.enable=1'; \
    echo 'opcache.memory_consumption=128'; \
    echo 'opcache.interned_strings_buffer=8'; \
    echo 'opcache.max_accelerated_files=10000'; \
    echo 'opcache.validate_timestamps=0'; \
} > /usr/local/etc/php/conf.d/opcache-recommended.ini

# 3. Copiar binario oficial de Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# 4. Establecer directorio de trabajo
WORKDIR /var/www/html

# 5. Copiar manifiestos de dependencias primero para aprovechar caché de capas Docker
COPY composer.json composer.lock ./

# 6. Instalar dependencias de PHP sin paquetes de desarrollo
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --no-autoloader \
    --prefer-dist

# 7. Copiar el código fuente de la aplicación
COPY . .

# 8. Generar autoloader optimizado de Composer
RUN composer dump-autoload --optimize --no-dev --no-scripts

# 9. Configurar VirtualHost de Apache y script de entrada (normalizando saltos de línea CRLF -> LF)
COPY docker/apache.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh \
    && chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache

# Puerto por defecto en Render
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

