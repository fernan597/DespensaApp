/**
 * Cálculos de precios y márgenes compartidos por el módulo de productos.
 * El margen se calcula como markup sobre el costo:
 *   (precio_venta - precio_compra) / precio_compra * 100
 */

export function calcularMargen(precioCompra, precioVenta) {
    const compra = Number(precioCompra) || 0;
    const venta = Number(precioVenta) || 0;

    if (compra <= 0) return 0;

    return Number((((venta - compra) / compra) * 100).toFixed(2));
}

export function calcularPrecioVenta(precioCompra, margenPorcentaje) {
    const compra = Number(precioCompra) || 0;
    const margen = Number(margenPorcentaje) || 0;

    return (compra * (1 + margen / 100)).toFixed(2);
}

export function calcularGananciaUnitaria(precioCompra, precioVenta) {
    const compra = Number(precioCompra) || 0;
    const venta = Number(precioVenta) || 0;

    return venta - compra;
}
