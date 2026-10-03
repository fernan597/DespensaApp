import { useState, useMemo, useCallback } from "react";

const toNumber = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
};

/**
 * Hook para gestionar los ítems de la compra en curso (estado local, sin API).
 *
 * Cada ítem: { producto, cantidad, costo_unitario }
 * `cantidad` y `costo_unitario` se guardan tal como los tipea el usuario
 * (string o number) para permitir edición libre; el subtotal se deriva.
 * A diferencia del carrito de ventas, un ítem con cantidad 0 NO se elimina:
 * queda marcado para que la validación lo informe.
 */
export function useCarritoCompra() {
    const [items, setItems] = useState([]);

    const agregarProducto = useCallback((producto) => {
        setItems((prev) => {
            const existente = prev.find((i) => i.producto.id === producto.id);
            if (existente) {
                return prev.map((i) =>
                    i.producto.id === producto.id
                        ? { ...i, cantidad: toNumber(i.cantidad) + 1 }
                        : i
                );
            }
            return [
                ...prev,
                {
                    producto,
                    cantidad: 1,
                    costo_unitario: producto.precio_compra ?? "",
                },
            ];
        });
    }, []);

    const quitarProducto = useCallback((productoId) => {
        setItems((prev) => prev.filter((i) => i.producto.id !== productoId));
    }, []);

    const cambiarCantidad = useCallback((productoId, cantidad) => {
        setItems((prev) =>
            prev.map((i) => (i.producto.id === productoId ? { ...i, cantidad } : i))
        );
    }, []);

    const cambiarCosto = useCallback((productoId, costo_unitario) => {
        setItems((prev) =>
            prev.map((i) => (i.producto.id === productoId ? { ...i, costo_unitario } : i))
        );
    }, []);

    const limpiarCarrito = useCallback(() => setItems([]), []);

    const totalCompra = useMemo(
        () =>
            items.reduce(
                (acc, i) => acc + toNumber(i.cantidad) * toNumber(i.costo_unitario),
                0
            ),
        [items]
    );

    return {
        items,
        agregarProducto,
        quitarProducto,
        cambiarCantidad,
        cambiarCosto,
        limpiarCarrito,
        totalCompra,
    };
}
