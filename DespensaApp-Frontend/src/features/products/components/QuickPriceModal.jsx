import { useState, useEffect, useMemo } from "react";
import { Modal } from "../../../components/ui/Modal";
import { InputField } from "../../../components/ui/InputField";
import { updateProductPrices } from "../../../services/productService";
import { formatCurrency } from "../../../utils/formatters";
import {
    calcularGananciaUnitaria,
    calcularMargen,
    calcularPrecioVenta,
} from "../../../utils/pricing";

const PRESET_MARGINS = [15, 25, 30, 40, 50];
const PRESET_INCREASES = [5, 10, 15, 20, 30];

/**
 * [CU06] Modal para Actualizar Precios y Márgenes:
 * - Modo Individual: edición rápida de costo, margen (%) y precio de venta con cálculo bidireccional en vivo.
 * - Modo Masivo: ajuste porcentual de precios o fijación de margen por Categoría, Marca o Todo el catálogo,
 *   con vista previa antes de confirmar.
 */
export function QuickPriceModal({
    isOpen,
    onClose,
    selectedProduct = null,
    products = [],
    categories = [],
    marcas = [],
    onSuccess,
}) {
    const [modo, setModo] = useState("individual");

    // Estado modo individual
    const [precioCompra, setPrecioCompra] = useState("");
    const [margenPorcentaje, setMargenPorcentaje] = useState("");
    const [precioVenta, setPrecioVenta] = useState("");

    // Estado modo masivo
    const [filtroTipo, setFiltroTipo] = useState("categoria");
    const [categoriaId, setCategoriaId] = useState("");
    const [marcaId, setMarcaId] = useState("");
    const [tipoAjuste, setTipoAjuste] = useState("porcentaje_aumento");
    const [valorPorcentaje, setValorPorcentaje] = useState("10");
    const [actualizarCosto, setActualizarCosto] = useState(false);

    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setErrors({});

        if (selectedProduct) {
            setModo("individual");
            const compra = Number(selectedProduct.precio_compra) || 0;
            const venta = Number(selectedProduct.precio_venta) || 0;
            const margenInicial = compra > 0 ? calcularMargen(compra, venta) : 0;

            setPrecioCompra(String(compra));
            setPrecioVenta(String(venta));
            setMargenPorcentaje(String(margenInicial));
        } else {
            setModo("masivo");
            setFiltroTipo("categoria");
            setCategoriaId(categories[0]?.id ? String(categories[0].id) : "");
            setMarcaId(marcas[0]?.id ? String(marcas[0].id) : "");
            setTipoAjuste("porcentaje_aumento");
            setValorPorcentaje("10");
            setActualizarCosto(false);
        }
    }, [isOpen, selectedProduct, categories, marcas]);

    // --- Handlers de cálculo dinámico bidireccional (Modo Individual) ---
    const handleCompraChange = (val) => {
        setPrecioCompra(val);
        const compraNum = parseFloat(val);
        const margenNum = parseFloat(margenPorcentaje);
        if (!isNaN(compraNum) && compraNum >= 0 && !isNaN(margenNum)) {
            setPrecioVenta(calcularPrecioVenta(compraNum, margenNum));
        }
    };

    const handleMargenChange = (val) => {
        setMargenPorcentaje(val);
        const compraNum = parseFloat(precioCompra);
        const margenNum = parseFloat(val);
        if (!isNaN(compraNum) && compraNum > 0 && !isNaN(margenNum)) {
            const nuevoVenta = Math.max(
                0.01,
                Number(calcularPrecioVenta(compraNum, margenNum))
            ).toFixed(2);
            setPrecioVenta(nuevoVenta);
        }
    };

    const handleVentaChange = (val) => {
        setPrecioVenta(val);
        const compraNum = parseFloat(precioCompra);
        const ventaNum = parseFloat(val);
        if (!isNaN(compraNum) && compraNum > 0 && !isNaN(ventaNum)) {
            setMargenPorcentaje(String(calcularMargen(compraNum, ventaNum)));
        }
    };

    // Ganancia unitaria en modo individual
    const gananciaUnitaria = useMemo(
        () => calcularGananciaUnitaria(precioCompra, precioVenta),
        [precioCompra, precioVenta]
    );

    // --- Vista previa en vivo para Modo Masivo ---
    const productosAfectados = useMemo(() => {
        const list = Array.isArray(products) ? products : [];
        if (filtroTipo === "categoria") {
            return list.filter(
                (p) => String(p.categoria_id ?? p.categoria?.id) === String(categoriaId)
            );
        }
        if (filtroTipo === "marca") {
            return list.filter(
                (p) => String(p.marca_id ?? p.marca?.id) === String(marcaId)
            );
        }
        return list;
    }, [products, filtroTipo, categoriaId, marcaId]);

    const previewItems = useMemo(() => {
        const pct = parseFloat(valorPorcentaje);
        if (isNaN(pct)) return [];
        const factor = 1 + pct / 100;

        return productosAfectados.slice(0, 5).map((p) => {
            const costoActual = Number(p.precio_compra) || 0;
            const ventaActual = Number(p.precio_venta) || 0;

            let nuevoCosto = costoActual;
            let nuevaVenta = ventaActual;

            if (tipoAjuste === "porcentaje_aumento") {
                if (actualizarCosto && costoActual > 0) {
                    nuevoCosto = Math.max(0.01, +(costoActual * factor).toFixed(2));
                }
                nuevaVenta = Math.max(0.01, +(ventaActual * factor).toFixed(2));
            } else if (tipoAjuste === "fijar_margen") {
                if (costoActual > 0) {
                    nuevaVenta = Math.max(
                        0.01,
                        Number(calcularPrecioVenta(costoActual, pct))
                    );
                }
            }

            return {
                id: p.id,
                nombre: p.nombre,
                costoActual,
                ventaActual,
                nuevoCosto,
                nuevaVenta,
            };
        });
    }, [productosAfectados, valorPorcentaje, tipoAjuste, actualizarCosto]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        const ventaNum = parseFloat(precioVenta);
        const compraNum = parseFloat(precioCompra);

        if (modo === "individual" && (!Number.isFinite(ventaNum) || ventaNum <= 0)) {
            setErrors({ precio_venta: ["El precio de venta debe ser mayor a 0."] });
            return;
        }

        if (modo === "individual" && (!Number.isFinite(compraNum) || compraNum < 0)) {
            setErrors({ precio_compra: ["El precio de compra no puede ser negativo."] });
            return;
        }

        setSubmitting(true);

        try {
            let response;

            if (modo === "individual") {
                response = await updateProductPrices({
                    modo: "individual",
                    product_id: selectedProduct.id,
                    precio_compra: compraNum,
                    precio_venta: ventaNum,
                });
            } else {
                response = await updateProductPrices({
                    modo: "masivo",
                    filtro_tipo: filtroTipo,
                    categoria_id: filtroTipo === "categoria" ? parseInt(categoriaId, 10) : null,
                    marca_id: filtroTipo === "marca" ? parseInt(marcaId, 10) : null,
                    tipo_ajuste: tipoAjuste,
                    valor_porcentaje: parseFloat(valorPorcentaje),
                    actualizar_costo: Boolean(actualizarCosto),
                });
            }

            onSuccess?.(response);
            onClose();
        } catch (error) {
            if (error.status === 422) {
                setErrors(error.data?.errors || { general: [error.message] });
            } else {
                setErrors({ general: [error.message || "Error al actualizar precios"] });
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                modo === "individual" && selectedProduct
                    ? `Actualizar Precio y Margen`
                    : `Actualización Masiva de Precios y Márgenes`
            }
            maxWidth="max-w-lg"
        >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Selector de pestaña si se abrió con un producto o general */}
                {selectedProduct && (
                    <div className="grid grid-cols-2 gap-1 p-1 bg-surface-container rounded-xl text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setModo("individual")}
                            className={`py-2 rounded-lg transition-all ${
                                modo === "individual"
                                    ? "bg-primary text-on-primary shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            Producto Individual
                        </button>
                        <button
                            type="button"
                            onClick={() => setModo("masivo")}
                            className={`py-2 rounded-lg transition-all ${
                                modo === "masivo"
                                    ? "bg-primary text-on-primary shadow-sm"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                        >
                            Actualización Masiva
                        </button>
                    </div>
                )}

                {errors.general && (
                    <div className="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-medium">
                        {errors.general[0]}
                    </div>
                )}

                {modo === "individual" && selectedProduct ? (
                    <>
                        {/* Resumen del producto */}
                        <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/30 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-on-surface">
                                    {selectedProduct.nombre}
                                </p>
                                <p className="text-xs text-on-surface-variant">
                                    {selectedProduct.categoria?.nombre || "Sin categoría"} •{" "}
                                    {selectedProduct.marca?.nombre || "Sin marca"}
                                </p>
                            </div>
                            <div className="text-right">
                                <span className="text-[11px] text-on-surface-variant block">
                                    Precio actual
                                </span>
                                <span className="text-sm font-bold text-primary">
                                    {formatCurrency(selectedProduct.precio_venta)}
                                </span>
                            </div>
                        </div>

                        {/* Inputs sincronizados: Costo + Margen % + Precio Venta */}
                        <div className="grid grid-cols-3 gap-3">
                            <InputField
                                label="Precio Compra ($)"
                                type="number"
                                step="0.01"
                                min="0"
                                required
                                value={precioCompra}
                                onChange={(e) => handleCompraChange(e.target.value)}
                                error={errors.precio_compra?.[0]}
                            />

                            <InputField
                                label="Margen (%)"
                                type="number"
                                step="0.01"
                                value={margenPorcentaje}
                                onChange={(e) => handleMargenChange(e.target.value)}
                                placeholder="Ej: 30"
                            />

                            <InputField
                                label="Precio Venta ($)"
                                type="number"
                                step="0.01"
                                min="0.01"
                                required
                                value={precioVenta}
                                onChange={(e) => handleVentaChange(e.target.value)}
                                error={errors.precio_venta?.[0]}
                            />
                        </div>

                        {/* Presets rápidos de margen */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-xs text-on-surface-variant">
                                Aplicar margen rápido:
                            </span>
                            <div className="flex items-center gap-1.5">
                                {PRESET_MARGINS.map((pct) => (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() => handleMargenChange(String(pct))}
                                        className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-container/60 text-on-secondary-container hover:bg-secondary-container transition-colors"
                                    >
                                        +{pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tarjeta de resultado de ganancia */}
                        <div
                            className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                                gananciaUnitaria >= 0
                                    ? "bg-primary-container/25 border-primary/20 text-on-surface"
                                    : "bg-error-container/40 border-error/30 text-on-error-container"
                            }`}
                        >
                            <span>Ganancia neta estimada por unidad:</span>
                            <span className="font-bold text-sm">
                                {formatCurrency(gananciaUnitaria)} (
                                {Number(margenPorcentaje || 0).toFixed(1)}%)
                            </span>
                        </div>

                        {gananciaUnitaria < 0 && (
                            <p className="text-[11px] text-error flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">
                                    warning
                                </span>
                                El precio de venta es menor al costo: el margen es negativo.
                            </p>
                        )}
                    </>
                ) : (
                    <>
                        {/* Alcance del ajuste masivo */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface">
                                1. Seleccionar alcance de productos
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "categoria", label: "Por Categoría", icon: "category" },
                                    { id: "marca", label: "Por Marca", icon: "sell" },
                                    { id: "todos", label: "Todo el Catálogo", icon: "inventory_2" },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setFiltroTipo(opt.id)}
                                        className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border text-xs font-semibold transition-all ${
                                            filtroTipo === opt.id
                                                ? "bg-secondary-container border-secondary text-on-secondary-container"
                                                : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant hover:bg-surface-container"
                                        }`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">
                                            {opt.icon}
                                        </span>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Selector de Categoría o Marca */}
                        {filtroTipo === "categoria" && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface">
                                    Categoría a actualizar *
                                </label>
                                <select
                                    required
                                    value={categoriaId}
                                    onChange={(e) => setCategoriaId(e.target.value)}
                                    className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Selecciona una categoría...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>
                                            {cat.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.categoria_id && (
                                    <span className="text-xs text-error">
                                        {errors.categoria_id[0]}
                                    </span>
                                )}
                            </div>
                        )}

                        {filtroTipo === "marca" && (
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-medium text-on-surface">
                                    Marca a actualizar *
                                </label>
                                <select
                                    required
                                    value={marcaId}
                                    onChange={(e) => setMarcaId(e.target.value)}
                                    className="w-full h-10 bg-surface-container rounded-lg px-3 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">Selecciona una marca...</option>
                                    {marcas.map((m) => (
                                        <option key={m.id} value={m.id}>
                                            {m.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.marca_id && (
                                    <span className="text-xs text-error">{errors.marca_id[0]}</span>
                                )}
                            </div>
                        )}

                        {/* Tipo de operación masiva */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface">
                                2. Tipo de regla a aplicar
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setTipoAjuste("porcentaje_aumento")}
                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                        tipoAjuste === "porcentaje_aumento"
                                            ? "bg-primary-container/40 border-primary text-on-surface"
                                            : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant"
                                    }`}
                                >
                                    <p className="text-xs font-bold">Aumentar / Ajustar en %</p>
                                    <p className="text-[11px] opacity-80">
                                        Incrementa los precios actuales en un porcentaje
                                    </p>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setTipoAjuste("fijar_margen")}
                                    className={`p-2.5 rounded-xl border text-left transition-all ${
                                        tipoAjuste === "fijar_margen"
                                            ? "bg-primary-container/40 border-primary text-on-surface"
                                            : "bg-surface-container-low border-outline-variant/30 text-on-surface-variant"
                                    }`}
                                >
                                    <p className="text-xs font-bold">Fijar Margen sobre Costo</p>
                                    <p className="text-[11px] opacity-80">
                                        Calcula Precio Venta = Costo + % Margen
                                    </p>
                                </button>
                            </div>
                        </div>

                        {/* Valor porcentual + presets */}
                        <div className="space-y-2">
                            <InputField
                                label={
                                    tipoAjuste === "porcentaje_aumento"
                                        ? "Porcentaje de aumento / ajuste (%)"
                                        : "Margen de ganancia objetivo sobre costo (%)"
                                }
                                type="number"
                                step="0.01"
                                required
                                value={valorPorcentaje}
                                onChange={(e) => setValorPorcentaje(e.target.value)}
                                error={errors.valor_porcentaje?.[0]}
                            />

                            <div className="flex items-center justify-between gap-2 flex-wrap">
                                <span className="text-xs text-on-surface-variant">
                                    Valores rápidos:
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {(tipoAjuste === "porcentaje_aumento"
                                        ? PRESET_INCREASES
                                        : PRESET_MARGINS
                                    ).map((pct) => (
                                        <button
                                            key={pct}
                                            type="button"
                                            onClick={() => setValorPorcentaje(String(pct))}
                                            className="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary-container/60 text-on-secondary-container hover:bg-secondary-container transition-colors"
                                        >
                                            +{pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {tipoAjuste === "porcentaje_aumento" && (
                                <label className="flex items-center gap-2 text-xs text-on-surface cursor-pointer pt-1">
                                    <input
                                        type="checkbox"
                                        checked={actualizarCosto}
                                        onChange={(e) => setActualizarCosto(e.target.checked)}
                                        className="rounded border-outline-variant text-primary focus:ring-primary"
                                    />
                                    <span>
                                        Aplicar el mismo porcentaje también al{" "}
                                        <strong>Precio de Compra (Costo)</strong>
                                    </span>
                                </label>
                            )}
                        </div>

                        {/* Vista previa de impacto */}
                        <div className="rounded-xl border border-outline-variant/30 bg-surface-container-low p-3 space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-on-surface">
                                    Vista previa de impacto
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary font-bold">
                                    {productosAfectados.length} producto(s) alcanzado(s)
                                </span>
                            </div>

                            {previewItems.length === 0 ? (
                                <p className="text-xs text-on-surface-variant py-2 text-center">
                                    No hay productos para el filtro seleccionado.
                                </p>
                            ) : (
                                <div className="divide-y divide-outline-variant/20 text-xs max-h-36 overflow-y-auto">
                                    {previewItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="py-1.5 flex items-center justify-between gap-2"
                                        >
                                            <span className="truncate text-on-surface font-medium">
                                                {item.nombre}
                                            </span>
                                            <span className="shrink-0 font-mono">
                                                <span className="text-on-surface-variant line-through mr-1.5">
                                                    {formatCurrency(item.ventaActual)}
                                                </span>
                                                <span className="font-bold text-primary">
                                                    → {formatCurrency(item.nuevaVenta)}
                                                </span>
                                            </span>
                                        </div>
                                    ))}
                                    {productosAfectados.length > 5 && (
                                        <p className="pt-1.5 text-[11px] text-center text-on-surface-variant">
                                            ...y {productosAfectados.length - 5} producto(s) más.
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-full text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={
                            submitting ||
                            (modo === "masivo" && productosAfectados.length === 0)
                        }
                        className="px-5 py-2 bg-primary text-on-primary rounded-full text-sm font-medium hover:bg-primary-container hover:text-on-primary-container transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {submitting && (
                            <span className="material-symbols-outlined text-[16px] animate-spin">
                                progress_activity
                            </span>
                        )}
                        {submitting
                            ? "Aplicando..."
                            : modo === "individual"
                            ? "Guardar Precio"
                            : `Aplicar a ${productosAfectados.length} Producto(s)`}
                    </button>
                </div>
            </form>
        </Modal>
    );
}

