import { useState } from "react";
import { useProducts } from "../features/products/hooks/useProducts";
import { useProveedores } from "../features/proveedores/hooks/useProveedores";
import { useCaja } from "../features/caja/hooks/useCaja";
import { useCarritoCompra } from "../features/compras/hooks/useCarritoCompra";
import { BuscadorProducto } from "../features/ventas/components/BuscadorProducto";
import { DetalleCompra } from "../features/compras/components/DetalleCompra";
import { PanelCompra } from "../features/compras/components/PanelCompra";
import { registrarCompra } from "../services/compraService";

// Un proveedor se considera inactivo si el backend lo informa (campo `activo` o `estado`).
const esProveedorActivo = (p) =>
    p.activo !== false && p.activo !== 0 && p.estado !== "inactivo";

/**
 * Página de registro de compra de mercadería.
 * Rol: admin_despensa.
 *
 * Layout:
 *   - Columna izquierda (2/3): buscador de productos + detalle editable
 *   - Columna derecha   (1/3): proveedor, tipo de pago y confirmación
 */
export function RegistrarCompra() {
    const { rawProducts, loading: loadingProductos, fetchProducts } = useProducts();
    const { rawProveedores, fetchProveedores } = useProveedores();
    const { cajaAbierta, loading: cajaLoading } = useCaja();
    const {
        items,
        agregarProducto,
        quitarProducto,
        cambiarCantidad,
        cambiarCosto,
        limpiarCarrito,
        totalCompra,
    } = useCarritoCompra();

    const [proveedorId, setProveedorId] = useState(null);
    const [tipoPago, setTipoPago] = useState("CONTADO");
    const [numeroComprobante, setNumeroComprobante] = useState("");
    const [mostrarErrores, setMostrarErrores] = useState(false);
    const [loadingCompra, setLoadingCompra] = useState(false);
    const [compraError, setCompraError] = useState(null);
    const [compraExitosa, setCompraExitosa] = useState(null);

    const proveedoresActivos = rawProveedores.filter(esProveedorActivo);

    const itemsInvalidos = items.some(
        (i) => !(parseFloat(i.cantidad) > 0) || !(parseFloat(i.costo_unitario) > 0)
    );
    const errorProveedor =
        mostrarErrores && !proveedorId ? "Seleccioná un proveedor." : "";

    const avisoCaja =
        tipoPago === "CONTADO" && !cajaLoading && !cajaAbierta
            ? "La caja está cerrada: una compra de contado genera un egreso de caja."
            : "";

    /** Valida en el cliente; devuelve el mensaje de error o null. */
    const validar = () => {
        if (items.length === 0) return "Agregá al menos un producto a la compra.";
        if (itemsInvalidos) return "Todas las cantidades y costos deben ser mayores a 0.";
        if (!proveedorId) return "Seleccioná un proveedor.";
        const proveedor = rawProveedores.find((p) => p.id === proveedorId);
        if (!proveedor || !esProveedorActivo(proveedor))
            return "El proveedor seleccionado está inactivo.";
        return null;
    };

    const handleConfirmar = async () => {
        setMostrarErrores(true);
        setCompraExitosa(null);

        const mensaje = validar();
        if (mensaje) {
            setCompraError(mensaje);
            return;
        }

        const payload = {
            proveedor_id: proveedorId,
            tipo_pago: tipoPago,
            numero_comprobante: numeroComprobante.trim() || null,
            items: items.map((i) => ({
                producto_id: i.producto.id,
                cantidad: parseFloat(i.cantidad),
                costo_unitario: parseFloat(i.costo_unitario),
            })),
        };

        try {
            setLoadingCompra(true);
            setCompraError(null);
            const data = await registrarCompra(payload);
            setCompraExitosa(data.compra ?? data);
            limpiarCarrito();
            setNumeroComprobante("");
            setProveedorId(null);
            setMostrarErrores(false);
            // Refresca stock/costos y saldo del proveedor (si fue a crédito)
            fetchProducts();
            fetchProveedores();
        } catch (err) {
            const primerError = err.data?.errors
                ? Object.values(err.data.errors).flat()[0]
                : null;
            setCompraError(primerError || err.message || "Error al registrar la compra.");
        } finally {
            setLoadingCompra(false);
        }
    };

    return (
        <div className="space-y-md p-md sm:p-lg">
            <header>
                <h1 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-sm">
                    <span className="material-symbols-outlined text-primary text-[28px]">
                        local_shipping
                    </span>
                    Registrar Compra
                </h1>
                <p className="text-body-md text-on-surface-variant">
                    Ingresá la mercadería recibida de un proveedor.
                </p>
            </header>

            {compraError && (
                <div className="flex items-center justify-between gap-sm p-md bg-error-container/30 border border-error/30 rounded-2xl">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-error text-[20px]">error</span>
                        <p className="text-body-md text-error">{compraError}</p>
                    </div>
                    <button
                        onClick={() => setCompraError(null)}
                        className="text-on-surface-variant hover:text-on-surface shrink-0"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            {compraExitosa && (
                <div className="flex items-center justify-between gap-sm p-md bg-green-500/10 border border-green-500/30 rounded-2xl">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-green-600 text-[22px]">
                            check_circle
                        </span>
                        <p className="text-body-md font-semibold text-green-700">
                            Compra {compraExitosa.id ? `#${compraExitosa.id} ` : ""}registrada correctamente.
                        </p>
                    </div>
                    <button
                        onClick={() => setCompraExitosa(null)}
                        className="text-on-surface-variant hover:text-on-surface"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-md items-start">
                <div className="space-y-md bg-surface-container-lowest border border-surface-container-high rounded-2xl p-md shadow-sm">
                    <h2 className="text-title-sm font-bold text-on-surface flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[20px] text-primary">
                            inventory_2
                        </span>
                        Detalle ({items.length} ítem{items.length !== 1 ? "s" : ""})
                    </h2>

                    <BuscadorProducto
                        productos={rawProducts}
                        onAgregar={agregarProducto}
                        disabled={loadingProductos}
                        placeholder="Buscar producto o escanear código de barras..."
                        disabledPlaceholder="Cargando catálogo..."
                        precioCampo="precio_compra"
                    />

                    <DetalleCompra
                        items={items}
                        onQuitar={quitarProducto}
                        onCambiarCantidad={cambiarCantidad}
                        onCambiarCosto={cambiarCosto}
                        mostrarErrores={mostrarErrores}
                    />
                </div>

                <div className="bg-surface-container-lowest border border-surface-container-high rounded-2xl p-md shadow-sm">
                    <h2 className="text-title-sm font-bold text-on-surface mb-md flex items-center gap-xs">
                        <span className="material-symbols-outlined text-[20px] text-primary">
                            receipt_long
                        </span>
                        Comprobante
                    </h2>
                    <PanelCompra
                        proveedores={proveedoresActivos}
                        proveedorId={proveedorId}
                        onProveedorChange={setProveedorId}
                        tipoPago={tipoPago}
                        onTipoPagoChange={setTipoPago}
                        numeroComprobante={numeroComprobante}
                        onNumeroComprobanteChange={setNumeroComprobante}
                        totalCompra={totalCompra}
                        onConfirmar={handleConfirmar}
                        loading={loadingCompra}
                        disabled={items.length === 0}
                        errorProveedor={errorProveedor}
                        aviso={avisoCaja}
                    />
                </div>
            </div>
        </div>
    );
}
