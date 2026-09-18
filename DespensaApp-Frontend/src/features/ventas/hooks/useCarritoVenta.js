import { useState, useMemo, useCallback } from "react";

/**
 * Hook para gestionar el carrito de productos de la venta en curso.
 * Solo maneja estado local — sin llamadas a la API.
 *
 * Cada ítem del carrito tiene la forma:
 * { producto: object, cantidad: number, subtotal: number }
 */
export function useCarritoVenta() {
    const [items, setItems] = useState([]);

    /**
     * Agrega un producto al carrito.
     * Si el producto ya existe, incrementa la cantidad en 1.
     * @param {object} producto - Objeto producto del catálogo (debe tener id y precio_venta)
     */
    const agregarProducto = useCallback((producto) => {
        setItems((prev) => {
            const existente = prev.find((i) => i.producto.id === producto.id);
            if (existente) {
                return prev.map((i) =>
                    i.producto.id === producto.id
                        ? {
                              ...i,
                              cantidad: i.cantidad + 1,
                              subtotal: (i.cantidad + 1) * i.producto.precio_venta,
                          }
                        : i
                );
            }
            return [
                ...prev,
                {
                    producto,
                    cantidad: 1,
                    subtotal: producto.precio_venta,
                },
            ];
        });
    }, []);

    /**
     * Elimina un ítem del carrito por ID de producto.
     * @param {number} productoId
     */
    const quitarProducto = useCallback((productoId) => {
        setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
    }, []);

    /**
     * Cambia la cantidad de un ítem. Si la cantidad llega a 0, lo elimina.
     * @param {number} productoId
     * @param {number} nuevaCantidad
     */
    const cambiarCantidad = useCallback((productoId, nuevaCantidad) => {
        const cantidad = parseInt(nuevaCantidad, 10);
        if (isNaN(cantidad) || cantidad <= 0) {
            setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
            return;
        }
        setItems((prev) =>
            prev.map((i) =>
                i.producto.id === productoId
                    ? { ...i, cantidad, subtotal: cantidad * i.producto.precio_venta }
                    : i
            )
        );
    }, []);

    /**
     * Vacía el carrito completamente (usado al finalizar una venta).
     */
    const limpiarCarrito = useCallback(() => {
        setItems([]);
    }, []);

    /**
     * Total de la venta: suma de todos los subtotales.
     * Recalculado solo cuando los ítems cambian.
     */
    const totalVenta = useMemo(
        () => items.reduce((acc, i) => acc + i.subtotal, 0),
        [items]
    );

    return {
        items,
        agregarProducto,
        quitarProducto,
        cambiarCantidad,
        limpiarCarrito,
        totalVenta,
    };
}
