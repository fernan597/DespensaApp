/**
 * Tabla de ítems del carrito de la venta en curso.
 *
 * @param {{
 *   items: Array<{ producto: object, cantidad: number, subtotal: number }>,
 *   onQuitar: (productoId: number) => void,
 *   onCambiarCantidad: (productoId: number, nuevaCantidad: number) => void,
 *   totalVenta: number
 * }} props
 */
export function CarritoVenta({ items, onQuitar, onCambiarCantidad, totalVenta }) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-sm py-xl text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-outline">
                    shopping_cart
                </span>
                <p className="text-body-md">El carrito está vacío.</p>
                <p className="text-body-sm">Buscá un producto para agregarlo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-xs">
            {/* Encabezado */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto_auto] gap-sm px-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                <span>Producto</span>
                <span className="text-right w-24">Precio</span>
                <span className="text-center w-20">Cant.</span>
                <span className="text-right w-24">Subtotal</span>
                <span className="w-8" />
            </div>

            {/* Ítems */}
            {items.map(({ producto, cantidad, subtotal }) => (
                <div
                    key={producto.id}
                    className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_auto_auto_auto_auto] gap-sm items-center px-sm py-sm bg-surface-container rounded-xl"
                >
                    {/* Nombre del producto */}
                    <div className="min-w-0">
                        <p className="text-body-md font-semibold text-on-surface truncate">
                            {producto.nombre}
                        </p>
                        <p className="text-label-sm text-on-surface-variant sm:hidden">
                            ${producto.precio_venta?.toFixed(2)} c/u
                        </p>
                    </div>

                    {/* Precio unitario (solo escritorio) */}
                    <span className="hidden sm:block text-body-md text-on-surface-variant text-right w-24">
                        ${producto.precio_venta?.toFixed(2)}
                    </span>

                    {/* Input de cantidad */}
                    <input
                        id={`cantidad-producto-${producto.id}`}
                        type="number"
                        min="1"
                        max={producto.stock_actual}
                        value={cantidad}
                        onChange={(e) => onCambiarCantidad(producto.id, e.target.value)}
                        className="w-20 text-center bg-surface-container-high border border-outline-variant rounded-lg px-xs py-xs text-body-md text-on-surface focus:outline-none focus:border-primary transition-colors"
                    />

                    {/* Subtotal */}
                    <span className="hidden sm:block text-body-md font-bold text-on-surface text-right w-24">
                        ${subtotal.toFixed(2)}
                    </span>

                    {/* Botón quitar */}
                    <button
                        onClick={() => onQuitar(producto.id)}
                        title="Quitar del carrito"
                        className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container hover:text-error transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                </div>
            ))}

            {/* Total */}
            <div className="flex items-center justify-between px-sm pt-sm border-t border-outline-variant mt-sm">
                <span className="text-title-md font-bold text-on-surface">Total</span>
                <span className="text-title-lg font-bold text-primary">
                    ${totalVenta.toFixed(2)}
                </span>
            </div>
        </div>
    );
}
