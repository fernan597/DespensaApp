<?php

namespace App\Enums;

/**
 * Tipos de acciones sensibles registradas en la bitácora de auditoría.
 */
enum AccionAuditoria: string
{
    // Autenticación
    case INICIO_SESION = 'INICIO_SESION';
    case CIERRE_SESION = 'CIERRE_SESION';
    case INICIO_SESION_FALLIDO = 'INICIO_SESION_FALLIDO';

    // Usuarios
    case CREAR_USUARIO = 'CREAR_USUARIO';
    case ELIMINAR_USUARIO = 'ELIMINAR_USUARIO';

    // Caja
    case ABRIR_CAJA = 'ABRIR_CAJA';
    case CERRAR_CAJA = 'CERRAR_CAJA';
    case MOVIMIENTO_CAJA = 'MOVIMIENTO_CAJA';

    // Ventas
    case VENTA_CONTADO = 'VENTA_CONTADO';
    case VENTA_CREDITO = 'VENTA_CREDITO';
    case COBRO_CLIENTE = 'COBRO_CLIENTE';

    // Compras
    case REGISTRAR_COMPRA = 'REGISTRAR_COMPRA';
    case PAGO_PROVEEDOR = 'PAGO_PROVEEDOR';

    // Catálogo
    case CREAR_PRODUCTO = 'CREAR_PRODUCTO';
    case ACTUALIZAR_PRODUCTO = 'ACTUALIZAR_PRODUCTO';
    case ELIMINAR_PRODUCTO = 'ELIMINAR_PRODUCTO';
    case ACTUALIZAR_PRECIOS = 'ACTUALIZAR_PRECIOS';
    case CREAR_CATEGORIA = 'CREAR_CATEGORIA';
    case ELIMINAR_CATEGORIA = 'ELIMINAR_CATEGORIA';
    case CREAR_MARCA = 'CREAR_MARCA';
    case ELIMINAR_MARCA = 'ELIMINAR_MARCA';

    // Proveedores
    case CREAR_PROVEEDOR = 'CREAR_PROVEEDOR';
    case ACTUALIZAR_PROVEEDOR = 'ACTUALIZAR_PROVEEDOR';
    case ELIMINAR_PROVEEDOR = 'ELIMINAR_PROVEEDOR';

    /**
     * Etiqueta legible en español para mostrar en la interfaz.
     */
    public function label(): string
    {
        return match ($this) {
            self::INICIO_SESION          => 'Inicio de sesión',
            self::CIERRE_SESION          => 'Cierre de sesión',
            self::INICIO_SESION_FALLIDO  => 'Intento de inicio de sesión fallido',
            self::CREAR_USUARIO          => 'Creación de usuario',
            self::ELIMINAR_USUARIO       => 'Eliminación de usuario',
            self::ABRIR_CAJA             => 'Apertura de caja',
            self::CERRAR_CAJA            => 'Cierre de caja',
            self::MOVIMIENTO_CAJA        => 'Movimiento manual de caja',
            self::VENTA_CONTADO          => 'Venta de contado',
            self::VENTA_CREDITO          => 'Venta a crédito',
            self::COBRO_CLIENTE          => 'Cobro a cliente',
            self::REGISTRAR_COMPRA       => 'Registro de compra',
            self::PAGO_PROVEEDOR         => 'Pago a proveedor',
            self::CREAR_PRODUCTO         => 'Creación de producto',
            self::ACTUALIZAR_PRODUCTO    => 'Actualización de producto',
            self::ELIMINAR_PRODUCTO      => 'Eliminación de producto',
            self::ACTUALIZAR_PRECIOS     => 'Actualización de precios',
            self::CREAR_CATEGORIA        => 'Creación de categoría',
            self::ELIMINAR_CATEGORIA     => 'Eliminación de categoría',
            self::CREAR_MARCA            => 'Creación de marca',
            self::ELIMINAR_MARCA         => 'Eliminación de marca',
            self::CREAR_PROVEEDOR        => 'Creación de proveedor',
            self::ACTUALIZAR_PROVEEDOR   => 'Actualización de proveedor',
            self::ELIMINAR_PROVEEDOR     => 'Eliminación de proveedor',
        };
    }

    /**
     * Categoría funcional usada para agrupar y colorear en el frontend.
     */
    public function categoria(): string
    {
        return match ($this) {
            self::INICIO_SESION,
            self::CIERRE_SESION,
            self::INICIO_SESION_FALLIDO  => 'AUTENTICACION',

            self::CREAR_USUARIO,
            self::ELIMINAR_USUARIO       => 'USUARIOS',

            self::ABRIR_CAJA,
            self::CERRAR_CAJA,
            self::MOVIMIENTO_CAJA        => 'CAJA',

            self::VENTA_CONTADO,
            self::VENTA_CREDITO,
            self::COBRO_CLIENTE          => 'VENTAS',

            self::REGISTRAR_COMPRA,
            self::PAGO_PROVEEDOR         => 'COMPRAS',

            self::CREAR_PRODUCTO,
            self::ACTUALIZAR_PRODUCTO,
            self::ELIMINAR_PRODUCTO,
            self::ACTUALIZAR_PRECIOS,
            self::CREAR_CATEGORIA,
            self::ELIMINAR_CATEGORIA,
            self::CREAR_MARCA,
            self::ELIMINAR_MARCA         => 'CATALOGO',

            self::CREAR_PROVEEDOR,
            self::ACTUALIZAR_PROVEEDOR,
            self::ELIMINAR_PROVEEDOR     => 'PROVEEDORES',
        };
    }
}
