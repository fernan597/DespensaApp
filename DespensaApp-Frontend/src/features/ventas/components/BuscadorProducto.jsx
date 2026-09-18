import { useState, useMemo, useRef, useEffect } from "react";
import { useBarcodeScanner } from "../../../hooks/useBarcodeScanner";

/**
 * Barra de búsqueda de productos para el Punto de Venta.
 * Filtra en memoria (sin peticiones adicionales a la API).
 * Soporta escaneo de código de barras vía useBarcodeScanner.
 *
 * @param {{
 *   productos: object[],
 *   onAgregar: (producto: object) => void,
 *   disabled?: boolean
 * }} props
 */
export function BuscadorProducto({ productos = [], onAgregar, disabled = false }) {
    const [query, setQuery] = useState("");
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef(null);
    const dropdownRef = useRef(null);

    // Filtrado en memoria por nombre o código de barras
    const resultados = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        return productos.filter(
            (p) =>
                p.nombre?.toLowerCase().includes(q) ||
                p.codigo_barra?.toLowerCase().includes(q)
        ).slice(0, 8); // Máximo 8 resultados visibles
    }, [query, productos]);

    // Escaneo de código de barras (reutiliza el hook existente del proyecto)
    useBarcodeScanner((codigoEscaneado) => {
        if (disabled) return;
        const producto = productos.find((p) => p.codigo_barra === codigoEscaneado);
        if (producto) {
            onAgregar(producto);
            setQuery("");
        } else {
            setQuery(codigoEscaneado); // Muestra el código escaneado si no hay match directo
            setShowDropdown(true);
        }
    });

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target) &&
                !inputRef.current.contains(e.target)
            ) {
                setShowDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (producto) => {
        onAgregar(producto);
        setQuery("");
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            setQuery("");
            setShowDropdown(false);
        }
    };

    return (
        <div className="relative">
            <div className="flex items-center gap-sm bg-surface-container-high rounded-2xl px-md py-sm border border-outline-variant focus-within:border-primary transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[22px]">
                    {disabled ? "lock" : "search"}
                </span>
                <input
                    ref={inputRef}
                    id="buscador-producto"
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => query && setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={
                        disabled
                            ? "Abrí la caja para buscar productos"
                            : "Buscar producto o escanear código de barras..."
                    }
                    disabled={disabled}
                    className="flex-1 bg-transparent text-body-md text-on-surface placeholder:text-on-surface-variant/60 outline-none disabled:cursor-not-allowed"
                    autoComplete="off"
                />
                {query && (
                    <button
                        onClick={() => { setQuery(""); setShowDropdown(false); }}
                        className="text-on-surface-variant hover:text-on-surface"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                )}
            </div>

            {/* Dropdown de resultados */}
            {showDropdown && resultados.length > 0 && (
                <ul
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-xs bg-surface-container rounded-2xl shadow-lg border border-outline-variant overflow-hidden"
                >
                    {resultados.map((producto) => (
                        <li key={producto.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(producto)}
                                className="w-full text-left px-md py-sm hover:bg-primary-container/30 transition-colors flex items-center justify-between gap-sm"
                            >
                                <div className="min-w-0">
                                    <p className="text-body-md font-semibold text-on-surface truncate">
                                        {producto.nombre}
                                    </p>
                                    <p className="text-label-sm text-on-surface-variant">
                                        {producto.codigo_barra} · Stock: {producto.stock_actual}
                                    </p>
                                </div>
                                <span className="text-body-md font-bold text-primary shrink-0">
                                    ${producto.precio_venta?.toFixed(2)}
                                </span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {/* Sin resultados */}
            {showDropdown && query.trim() && resultados.length === 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-xs bg-surface-container rounded-2xl shadow-lg border border-outline-variant px-md py-sm text-body-md text-on-surface-variant"
                >
                    Sin resultados para "{query}"
                </div>
            )}
        </div>
    );
}
