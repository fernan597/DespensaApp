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

/**
 * Formatea una fecha/hora ISO o SQL en formato amigable argentino (DD/MM/AAAA HH:mm).
 *
 * @param {string|Date} val
 * @returns {string}
 */
export const formatDateTime = (val) => {
    if (!val) return "N/A";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(d);
};

/**
 * Formatea una fecha ISO o SQL en formato solo fecha (DD/MM/AAAA).
 *
 * @param {string|Date} val
 * @returns {string}
 */
export const formatDate = (val) => {
    if (!val) return "N/A";
    const d = new Date(val);
    if (isNaN(d.getTime())) return String(val);
    return new Intl.DateTimeFormat("es-AR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(d);
};
