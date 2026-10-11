/**
 * Formatea un número como moneda ARS ($ 1.250,00).
 *
 * @param {number|string} val
 * @returns {string}
 */
export const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        minimumFractionDigits: 2,
    }).format(num);
};
