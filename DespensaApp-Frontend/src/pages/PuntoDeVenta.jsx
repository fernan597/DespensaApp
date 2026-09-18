import { useState, useEffect, useCallback } from "react";
import { CajaEstadoBanner } from "../features/caja/components/CajaEstadoBanner";
import { BuscadorProducto } from "../features/ventas/components/BuscadorProducto";
import { CarritoVenta } from "../features/ventas/components/CarritoVenta";
import { PanelPago } from "../features/ventas/components/PanelPago";
import { useCaja } from "../features/caja/hooks/useCaja";
import { useCarritoVenta } from "../features/ventas/hooks/useCarritoVenta";
import { getProducts } from "../services/productService";
import { registrarVentaContado } from "../services/ventaService";

/**
 * Página del Punto de Venta.
 * Roles: admin_despensa, empleado.
 *
 * Layout:
 *   - Columna izquierda (2/3): banner de caja + buscador + carrito
 *   - Columna derecha   (1/3): panel de pago y confirmación
 */
export function PuntoDeVenta() {
    const { cajaAbierta, caja, loading: cajLoading, error: cajaError, handleAbrir, handleCerrar } = useCaja();
    const { items, agregarProducto, quitarProducto, cambiarCantidad, limpiarCarrito, totalVenta } = useCarritoVenta();

    const [productos, setProductos] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(true);
    const [loadingVenta, setLoadingVenta] = useState(false);
    const [ventaExitosa, setVentaExitosa] = useState(null); // Guarda la última venta registrada

    // Cargar catálogo de productos al montar (una sola vez)
    const fetchProductos = useCallback(async () => {
        try {
            setLoadingProductos(true);
            const data = await getProducts();
            setProductos(Array.isArray(data) ? data : data?.products ?? []);
        } catch (err) {
            console.error("Error al cargar productos:", err);
        } finally {
            setLoadingProductos(false);
        }
    }, []);

    useEffect(() => {
        fetchProductos();
    }, [fetchProductos]);

    /**
     * Construye el payload y llama a la API para registrar la venta.
     * Si tiene éxito: limpia el carrito, refresca el catálogo y muestra confirmación.
     */
    const handleConfirmarVenta = async ({ cliente_id, medio_pago }) => {
        if (items.length === 0) return;

        const payload = {
            cliente_id: cliente_id ?? null,
            medio_pago,
            items: items.map((i) => ({
                producto_id: i.producto.id,
                cantidad: i.cantidad,
            })),
        };

        try {
            setLoadingVenta(true);
            const data = await registrarVentaContado(payload);
            setVentaExitosa(data.venta);
            limpiarCarrito();
            fetchProductos(); // Refresca stock actualizado
        } catch (err) {
            alert(err.message || "Error al registrar la venta.");
        } finally {
            setLoadingVenta(false);
        }
    };

    return (
        <div className="space-y-md p-md sm:p-lg">
            {/* Título */}
            <header>
                <h1 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-[28px]">
                        point_of_sale
                    </span>
                    Punto de Venta
                </h1>
                <p className="text-body-md text-on-surface-variant">
                    Registrá ventas de contado en tiempo real.
                </p>
            </header>

            {/* Banner de estado de caja */}
            <CajaEstadoBanner
                cajaAbierta={cajaAbierta}
                caja={caja}
                loading={cajLoading}
                onAbrir={handleAbrir}
                onCerrar={handleCerrar}
            />

            {cajaError && (
                <p className="text-label-sm text-error">{cajaError}</p>
            )}

            {/* Confirmación de venta exitosa */}
            {ventaExitosa && (
                <div className="flex items-center justify-between gap-sm p-md bg-green-500/10 border border-green-500/30 rounded-2xl">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-green-600 text-[22px]">
                            check_circle
                        </span>
                        <p className="text-body-md font-semibold text-green-700">
                            Venta #{ventaExitosa.id} registrada — Total: ${Number(ventaExitosa.total).toFixed(2)}
                        </p>
                    </div>
                    <button
                        onClick={() => setVentaExitosa(null)}
                        className="text-on-surface-variant hover:text-on-surface"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            {/* Layout principal: carrito + panel de pago */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-md items-start">

                {/* Columna izquierda: buscador + carrito */}
                <div className="space-y-md bg-surface-container-lowest border border-surface-container-high rounded-2xl p-md shadow-sm">
                    <h2 className="text-title-sm font-bold text-on-surface flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[20px] text-primary">
                            shopping_cart
                        </span>
                        Carrito ({items.length} ítem{items.length !== 1 ? "s" : ""})
                    </h2>

                    <BuscadorProducto
                        productos={productos}
                        onAgregar={agregarProducto}
                        disabled={!cajaAbierta || loadingProductos}
                    />

                    <CarritoVenta
                        items={items}
                        onQuitar={quitarProducto}
                        onCambiarCantidad={cambiarCantidad}
                        totalVenta={totalVenta}
                    />
                </div>

                {/* Columna derecha: panel de pago */}
                <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-md shadow-sm">
                    <h2 className="text-title-sm font-bold text-on-surface mb-md flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[20px] text-primary">
                            payments
                        </span>
                        Cobro
                    </h2>
                    <PanelPago
                        totalVenta={totalVenta}
                        clientes={[]}
                        onConfirmar={handleConfirmarVenta}
                        loading={loadingVenta}
                        disabled={!cajaAbierta || items.length === 0}
                    />
                </div>
            </div>
        </div>
    );
}
