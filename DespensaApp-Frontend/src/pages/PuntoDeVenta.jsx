import { useState, useEffect, useCallback } from "react";
import { CajaEstadoBanner } from "../features/caja/components/CajaEstadoBanner";
import { BuscadorProducto } from "../features/products/components/BuscadorProducto";
import { CarritoVenta } from "../features/ventas/components/CarritoVenta";
import { PanelPago } from "../features/ventas/components/PanelPago";
import { ClienteSelectorModal } from "../features/ventas/components/ClienteSelectorModal";
import { useCaja } from "../features/caja/hooks/useCaja";
import { useCarritoVenta } from "../features/ventas/hooks/useCarritoVenta";
import { getProducts } from "../services/productService";
import { registrarVentaContado, registrarVentaCredito } from "../services/ventaService";
import { formatCurrency } from "../utils/formatters";

/**
 * Página del Punto de Venta.
 * Roles: admin_despensa, empleado.
 *
 * Soporta ventas de Contado y ventas a Crédito (Fiado en Cuenta Corriente).
 *
 * Layout:
 *   - Columna izquierda (2/3): banner de caja + buscador + carrito
 *   - Columna derecha   (1/3): panel de cobro y confirmación
 */
export function PuntoDeVenta() {
    const { cajaAbierta, caja, loading: cajLoading, error: cajaError, handleAbrir, handleCerrar, handleMovimiento } = useCaja();
    const { items, agregarProducto, quitarProducto, cambiarCantidad, limpiarCarrito, totalVenta } = useCarritoVenta();

    const [productos, setProductos] = useState([]);
    const [loadingProductos, setLoadingProductos] = useState(true);
    const [loadingVenta, setLoadingVenta] = useState(false);
    const [ventaError, setVentaError] = useState(null);
    const [ventaExitosa, setVentaExitosa] = useState(null); // Guarda la última venta registrada

    // Gestión del cliente seleccionado para ventas
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
    const [isClienteModalOpen, setIsClienteModalOpen] = useState(false);

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
     * Construye el payload y llama a la API según la modalidad (Contado o Crédito).
     * Si tiene éxito: limpia el carrito, resetea el cliente, refresca el stock y muestra confirmación.
     */
    const handleConfirmarVenta = async ({ tipo_venta, cliente_id, medio_pago }) => {
        if (items.length === 0) return;

        if (tipo_venta === "CREDITO" && !cliente_id) {
            setVentaError("Debe seleccionar un cliente registrado para vender a crédito.");
            return;
        }

        try {
            setLoadingVenta(true);
            setVentaError(null);

            const itemsPayload = items.map((i) => ({
                producto_id: i.producto.id,
                cantidad: i.cantidad,
            }));

            let data;
            if (tipo_venta === "CREDITO") {
                data = await registrarVentaCredito({
                    cliente_id,
                    items: itemsPayload,
                });
            } else {
                data = await registrarVentaContado({
                    cliente_id: cliente_id ?? null,
                    medio_pago,
                    items: itemsPayload,
                });
            }

            setVentaExitosa(data.venta);
            limpiarCarrito();
            setClienteSeleccionado(null);
            fetchProductos(); // Refresca stock actualizado
        } catch (err) {
            const primerError = err.data?.errors
                ? Object.values(err.data.errors).flat()[0]
                : null;
            setVentaError(primerError || err.message || "Error al registrar la venta.");
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
                    Registrá ventas de contado y fiado a crédito en tiempo real.
                </p>
            </header>

            {/* Banner de estado de caja */}
            <CajaEstadoBanner
                cajaAbierta={cajaAbierta}
                caja={caja}
                loading={cajLoading}
                onAbrir={handleAbrir}
                onCerrar={handleCerrar}
                onMovimiento={handleMovimiento}
            />

            {cajaError && (
                <p className="text-label-sm text-error">{cajaError}</p>
            )}

            {/* Error de registro de venta */}
            {ventaError && (
                <div className="flex items-center justify-between gap-sm p-md bg-error-container/30 border border-error/30 rounded-2xl">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-error text-[20px]">error</span>
                        <p className="text-body-md text-error">{ventaError}</p>
                    </div>
                    <button
                        onClick={() => setVentaError(null)}
                        className="text-on-surface-variant hover:text-on-surface shrink-0"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            {/* Confirmación de venta exitosa */}
            {ventaExitosa && (
                <div className="flex items-center justify-between gap-sm p-md bg-green-500/10 border border-green-500/30 rounded-2xl">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-green-600 text-[22px]">
                            check_circle
                        </span>
                        <div>
                            <p className="text-body-md font-semibold text-green-700">
                                Venta #{ventaExitosa.id} registrada correctamente — Total: {formatCurrency(ventaExitosa.total)}
                            </p>
                            <p className="text-xs text-green-800">
                                Modalidad: {ventaExitosa.tipo_venta === "CUENTA_CORRIENTE" ? "Crédito / Fiado (Cuenta Corriente)" : "Contado"}
                                {ventaExitosa.cliente && (
                                    <> · Cliente: {ventaExitosa.cliente.nombre} {ventaExitosa.cliente.apellido || ""}</>
                                )}
                            </p>
                        </div>
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

                {/* Columna derecha: panel de cobro */}
                <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-md shadow-sm">
                    <h2 className="text-title-sm font-bold text-on-surface mb-md flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[20px] text-primary">
                            receipt_long
                        </span>
                        Cobro
                    </h2>
                    <PanelPago
                        totalVenta={totalVenta}
                        clienteSeleccionado={clienteSeleccionado}
                        onOpenClienteModal={() => setIsClienteModalOpen(true)}
                        onClearCliente={() => setClienteSeleccionado(null)}
                        onConfirmar={handleConfirmarVenta}
                        loading={loadingVenta}
                        cajaAbierta={cajaAbierta}
                        itemsLength={items.length}
                    />
                </div>
            </div>

            {/* Modal para seleccionar cliente registrado */}
            <ClienteSelectorModal
                isOpen={isClienteModalOpen}
                onClose={() => setIsClienteModalOpen(false)}
                onSelect={(cliente) => setClienteSeleccionado(cliente)}
                selectedClienteId={clienteSeleccionado?.id}
            />
        </div>
    );
}
