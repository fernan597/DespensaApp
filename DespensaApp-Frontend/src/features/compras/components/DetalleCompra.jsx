import { InputField } from "../../../components/ui/InputField";

/**
 * Tabla editable con los ítems de la compra en curso.
 *
 * @param {{
 *   items: Array<{ producto: object, cantidad: number|string, costo_unitario: number|string }>,
 *   onQuitar: (productoId: number) => void,
 *   onCambiarCantidad: (productoId: number, cantidad: string) => void,
 *   onCambiarCosto: (productoId: number, costo: string) => void,
 *   mostrarErrores?: boolean
 * }} props
 */
export function DetalleCompra({
    items,
    onQuitar,
    onCambiarCantidad,
    onCambiarCosto,
    mostrarErrores = false,
}) {
    if (items.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-sm py-xl text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] text-outline">
                    inventory
                </span>
                <p className="text-body-md">No hay productos en la compra.</p>
                <p className="text-body-sm">Buscá un producto para agregarlo.</p>
            </div>
        );
    }

    return (
        <div className="space-y-xs">
            <div className="hidden sm:grid grid-cols-[1fr_6rem_7rem_7rem_2rem] gap-sm px-sm text-label-sm text-on-surface-variant uppercase tracking-wide">
                <span>Producto</span>
                <span className="text-center">Cant.</span>
                <span className="text-center">Costo unit.</span>
                <span className="text-right">Subtotal</span>
                <span />
            </div>

            {items.map(({ producto, cantidad, costo_unitario }) => {
                const cant = parseFloat(cantidad);
                const costo = parseFloat(costo_unitario);
                const errorCantidad = mostrarErrores && !(cant > 0) ? "Debe ser mayor a 0" : "";
                const errorCosto = mostrarErrores && !(costo > 0) ? "Debe ser mayor a 0" : "";
                const subtotal = (isNaN(cant) ? 0 : cant) * (isNaN(costo) ? 0 : costo);

                return (
                    <div
                        key={producto.id}
                        className="grid grid-cols-2 sm:grid-cols-[1fr_6rem_7rem_7rem_2rem] gap-sm items-start px-sm py-sm bg-surface-container rounded-xl"
                    >
                        <div className="min-w-0 col-span-2 sm:col-span-1 pt-2">
                            <p className="text-body-md font-semibold text-on-surface truncate">
                                {producto.nombre}
                            </p>
                            <p className="text-label-sm text-on-surface-variant">
                                Stock actual: {producto.stock_actual}
                            </p>
                        </div>

                        <InputField
                            id={`compra-cantidad-${producto.id}`}
                            type="number"
                            min="1"
                            step="1"
                            value={cantidad}
                            error={errorCantidad}
                            onChange={(e) => onCambiarCantidad(producto.id, e.target.value)}
                        />

                        <InputField
                            id={`compra-costo-${producto.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={costo_unitario}
                            error={errorCosto}
                            onChange={(e) => onCambiarCosto(producto.id, e.target.value)}
                        />

                        <span className="text-right text-body-md font-semibold text-on-surface pt-2">
                            ${subtotal.toFixed(2)}
                        </span>

                        <button
                            type="button"
                            onClick={() => onQuitar(producto.id)}
                            className="text-on-surface-variant hover:text-error transition-colors pt-2 justify-self-end"
                            aria-label={`Quitar ${producto.nombre}`}
                        >
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
