import { useState, useEffect, useCallback, useMemo } from "react";
import { useRole } from "../../../hooks/useRole";
import { getVentas } from "../../../services/ventaService";
import { getCajaEstado } from "../../../services/cajaService";
import { getProducts } from "../../../services/productService";
import { getCuentasCorrientesClientes } from "../../../services/cuentaCorrienteClienteService";
import { getCuentasCorrientesProveedores } from "../../../services/cuentaCorrienteProveedorService";
import {
    getReporteVentas,
    getReporteMasVendidos,
} from "../../../services/reporteService";
import { fetchUsers } from "../../../services/userService";

/**
 * Convierte un Date o string ISO/SQL a clave local YYYY-MM-DD.
 */
function toLocalDateKey(dateInput) {
    if (!dateInput) return "";
    const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(d.getTime())) return "";
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

/**
 * Calcula las fechas YYYY-MM-DD para los presets rápidos ("7d", "30d", "mes").
 */
function computePresetRange(presetId) {
    const today = new Date();
    const hasta = toLocalDateKey(today);

    if (presetId === "mes") {
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        return { desde: toLocalDateKey(firstDay), hasta };
    }

    const daysBack = presetId === "30d" ? 29 : 6;
    const start = new Date(today);
    start.setDate(today.getDate() - daysBack);
    return { desde: toLocalDateKey(start), hasta };
}

/**
 * Construye un reporte de respaldo local en caso de que el endpoint /api/reportes/ventas no esté disponible.
 */
function buildFallbackReporteVentas(ventas, desdeStr, hastaStr) {
    const start = desdeStr ? new Date(`${desdeStr}T00:00:00`) : new Date();
    const end = hastaStr ? new Date(`${hastaStr}T00:00:00`) : new Date();
    const mapByDay = new Map();

    const cur = new Date(start);
    let safety = 0;
    while (cur <= end && safety < 366) {
        const key = toLocalDateKey(cur);
        const etiqueta = new Intl.DateTimeFormat("es-AR", {
            day: "2-digit",
            month: "2-digit",
        }).format(cur);
        mapByDay.set(key, {
            fecha: key,
            etiqueta,
            total: 0,
            contado: 0,
            credito: 0,
            cantidad_ventas: 0,
        });
        cur.setDate(cur.getDate() + 1);
        safety += 1;
    }

    let totalFacturado = 0;
    let cantidadVentas = 0;
    let totalContado = 0;
    let totalCredito = 0;
    let montoEfectivo = 0;
    let montoOtros = 0;

    for (const v of ventas) {
        const key = toLocalDateKey(v.created_at);
        if (!mapByDay.has(key)) continue;

        const monto = Number(v.total) || 0;
        const esCredito =
            v.tipo_venta === "CUENTA_CORRIENTE" || v.medio_pago === "CREDITO";

        const bucket = mapByDay.get(key);
        bucket.total += monto;
        bucket.cantidad_ventas += 1;

        totalFacturado += monto;
        cantidadVentas += 1;

        if (esCredito) {
            bucket.credito += monto;
            totalCredito += monto;
        } else {
            bucket.contado += monto;
            totalContado += monto;
            if (v.medio_pago === "EFECTIVO") {
                montoEfectivo += monto;
            } else {
                montoOtros += monto;
            }
        }
    }

    return {
        periodo: { fecha_desde: desdeStr, fecha_hasta: hastaStr },
        resumen: {
            total_facturado: totalFacturado,
            cantidad_ventas: cantidadVentas,
            ticket_promedio:
                cantidadVentas > 0 ? totalFacturado / cantidadVentas : 0,
            total_contado: totalContado,
            total_credito: totalCredito,
        },
        serie_diaria: Array.from(mapByDay.values()),
        por_medio_pago: [
            {
                id: "EFECTIVO",
                label: "Efectivo en Caja",
                monto: montoEfectivo,
                porcentaje:
                    totalFacturado > 0
                        ? Math.round((montoEfectivo / totalFacturado) * 100)
                        : 0,
            },
            {
                id: "OTROS",
                label: "Transferencia / Tarjeta",
                monto: montoOtros,
                porcentaje:
                    totalFacturado > 0
                        ? Math.round((montoOtros / totalFacturado) * 100)
                        : 0,
            },
            {
                id: "CREDITO",
                label: "Cuenta Corriente (Fiado)",
                monto: totalCredito,
                porcentaje:
                    totalFacturado > 0
                        ? Math.round((totalCredito / totalFacturado) * 100)
                        : 0,
            },
        ],
    };
}

/**
 * Hook ejecutivo para consolidar las métricas administrativas del Dashboard
 * y los reportes [CU18] (/api/reportes/ventas y /api/reportes/mas-vendidos).
 */
export function useDashboardMetrics() {
    const { isAdmin, isAdminDespensa, canUsePOS } = useRole();

    const initialRange = useMemo(() => computePresetRange("7d"), []);
    const [fechaDesde, setFechaDesde] = useState(initialRange.desde);
    const [fechaHasta, setFechaHasta] = useState(initialRange.hasta);
    const [activePreset, setActivePreset] = useState("7d");

    const [loading, setLoading] = useState(true);
    const [loadingReportes, setLoadingReportes] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const [ventasRaw, setVentasRaw] = useState([]);
    const [reporteVentasServer, setReporteVentasServer] = useState(null);
    const [reporteMasVendidosServer, setReporteMasVendidosServer] =
        useState(null);
    const [cajaData, setCajaData] = useState({
        caja_abierta: false,
        caja: null,
    });
    const [productsRaw, setProductsRaw] = useState([]);
    const [ccClientesKpis, setCcClientesKpis] = useState({
        total_deuda_global: 0,
        cantidad_clientes_con_deuda: 0,
        cantidad_clientes_al_dia: 0,
        total_clientes: 0,
    });
    const [ccProveedoresKpis, setCcProveedoresKpis] = useState({
        total_deuda_global: 0,
        cantidad_proveedores_con_deuda: 0,
        cantidad_proveedores_al_dia: 0,
        total_proveedores: 0,
    });
    const [usersRaw, setUsersRaw] = useState([]);

    /**
     * Consulta exclusivamente los endpoints de reportes [CU18] cuando cambia el rango de fechas.
     */
    const fetchReportesByDateRange = useCallback(
        async (desde, hasta) => {
            if (!canUsePOS) return;
            setLoadingReportes(true);
            try {
                const [resVentas, resMasVendidos] = await Promise.allSettled([
                    getReporteVentas({ fecha_desde: desde, fecha_hasta: hasta }),
                    getReporteMasVendidos({
                        fecha_desde: desde,
                        fecha_hasta: hasta,
                        limit: 8,
                    }),
                ]);

                if (resVentas.status === "fulfilled" && resVentas.value) {
                    setReporteVentasServer(resVentas.value);
                }
                if (
                    resMasVendidos.status === "fulfilled" &&
                    resMasVendidos.value
                ) {
                    setReporteMasVendidosServer(resMasVendidos.value);
                }
            } finally {
                setLoadingReportes(false);
            }
        },
        [canUsePOS]
    );

    const reloadMetrics = useCallback(async () => {
        setLoading(true);
        try {
            if (isAdmin) {
                const resUsers = await Promise.allSettled([fetchUsers()]);
                if (resUsers[0].status === "fulfilled") {
                    setUsersRaw(
                        Array.isArray(resUsers[0].value) ? resUsers[0].value : []
                    );
                }
                setLastUpdated(new Date());
                return;
            }

            if (canUsePOS) {
                const promises = [
                    getVentas(),
                    getCajaEstado(),
                    getProducts(),
                    getCuentasCorrientesClientes(),
                    getReporteVentas({
                        fecha_desde: fechaDesde,
                        fecha_hasta: fechaHasta,
                    }),
                    getReporteMasVendidos({
                        fecha_desde: fechaDesde,
                        fecha_hasta: fechaHasta,
                        limit: 8,
                    }),
                ];

                if (isAdminDespensa) {
                    promises.push(getCuentasCorrientesProveedores());
                }

                const results = await Promise.allSettled(promises);

                if (results[0]?.status === "fulfilled") {
                    setVentasRaw(
                        Array.isArray(results[0].value) ? results[0].value : []
                    );
                }
                if (results[1]?.status === "fulfilled" && results[1].value) {
                    setCajaData(results[1].value);
                }
                if (results[2]?.status === "fulfilled") {
                    const prods = results[2].value;
                    setProductsRaw(
                        Array.isArray(prods) ? prods : prods?.products ?? []
                    );
                }
                if (
                    results[3]?.status === "fulfilled" &&
                    results[3].value?.kpis
                ) {
                    setCcClientesKpis(results[3].value.kpis);
                }
                if (results[4]?.status === "fulfilled" && results[4].value) {
                    setReporteVentasServer(results[4].value);
                }
                if (results[5]?.status === "fulfilled" && results[5].value) {
                    setReporteMasVendidosServer(results[5].value);
                }
                if (
                    isAdminDespensa &&
                    results[6]?.status === "fulfilled" &&
                    results[6].value?.kpis
                ) {
                    setCcProveedoresKpis(results[6].value.kpis);
                }
            }

            setLastUpdated(new Date());
        } finally {
            setLoading(false);
        }
    }, [isAdmin, isAdminDespensa, canUsePOS, fechaDesde, fechaHasta]);

    useEffect(() => {
        reloadMetrics();
    }, [reloadMetrics]);

    const handleApplyDateRange = useCallback(
        (desde, hasta) => {
            setActivePreset("custom");
            setFechaDesde(desde);
            setFechaHasta(hasta);
            fetchReportesByDateRange(desde, hasta);
        },
        [fetchReportesByDateRange]
    );

    const handleSelectPreset = useCallback(
        (presetId) => {
            const { desde, hasta } = computePresetRange(presetId);
            setActivePreset(presetId);
            setFechaDesde(desde);
            setFechaHasta(hasta);
            fetchReportesByDateRange(desde, hasta);
        },
        [fetchReportesByDateRange]
    );

    const metrics = useMemo(() => {
        const now = new Date();
        const todayKey = toLocalDateKey(now);
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Métricas de Ventas del Día y del Mes (para KPIs superiores)
        let ventasHoyTotal = 0;
        let ventasHoyCount = 0;
        let ventasHoyContado = 0;
        let ventasHoyCredito = 0;
        let ventasMesTotal = 0;
        let ventasMesCount = 0;

        for (const v of ventasRaw) {
            const monto = Number(v.total) || 0;
            const d = v.created_at ? new Date(v.created_at) : null;
            const dateKey = d ? toLocalDateKey(d) : "";
            const esCredito =
                v.tipo_venta === "CUENTA_CORRIENTE" ||
                v.medio_pago === "CREDITO";

            if (dateKey === todayKey) {
                ventasHoyTotal += monto;
                ventasHoyCount += 1;
                if (esCredito) {
                    ventasHoyCredito += monto;
                } else {
                    ventasHoyContado += monto;
                }
            }

            if (
                d &&
                !isNaN(d.getTime()) &&
                d.getMonth() === currentMonth &&
                d.getFullYear() === currentYear
            ) {
                ventasMesTotal += monto;
                ventasMesCount += 1;
            }
        }

        const ticketPromedioHoy =
            ventasHoyCount > 0 ? ventasHoyTotal / ventasHoyCount : 0;

        const reporteVentas =
            reporteVentasServer ||
            buildFallbackReporteVentas(ventasRaw, fechaDesde, fechaHasta);

        const reporteMasVendidos = reporteMasVendidosServer || {
            periodo: { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
            resumen: {
                total_unidades_top: 0,
                total_recaudado_top: 0,
                cantidad_productos: 0,
            },
            productos: [],
        };

        // 2. Métricas de Inventario y Valorización
        let totalUnidades = 0;
        let valorCostoTotal = 0;
        let valorVentaTotal = 0;
        let productosAgotados = 0;
        let productosBajoStock = 0;
        let productosOptimos = 0;

        for (const p of productsRaw) {
            const stock = Number(p.stock_actual) || 0;
            const min = Number(p.stock_minimo) || 0;
            const costo = Number(p.precio_compra) || 0;
            const venta = Number(p.precio_venta) || 0;

            if (stock > 0) {
                totalUnidades += stock;
                valorCostoTotal += stock * costo;
                valorVentaTotal += stock * venta;
            }

            if (stock <= 0) {
                productosAgotados += 1;
            } else if (stock <= min) {
                productosBajoStock += 1;
            } else {
                productosOptimos += 1;
            }
        }

        const gananciaPotencial = Math.max(0, valorVentaTotal - valorCostoTotal);

        // 3. Métricas de Usuarios (para rol admin)
        const totalUsuarios = usersRaw.length;
        const usuariosPorRol = {
            admin: usersRaw.filter((u) => u.role === "admin").length,
            admin_despensa: usersRaw.filter((u) => u.role === "admin_despensa")
                .length,
            empleado: usersRaw.filter((u) => u.role === "empleado").length,
        };

        return {
            ventas: {
                hoyTotal: ventasHoyTotal,
                hoyCount: ventasHoyCount,
                hoyContado: ventasHoyContado,
                hoyCredito: ventasHoyCredito,
                ticketPromedioHoy,
                mesTotal: ventasMesTotal,
                mesCount: ventasMesCount,
                recientes: ventasRaw.slice(0, 6),
                reporteVentas,
                reporteMasVendidos,
            },
            caja: {
                abierta: Boolean(cajaData?.caja_abierta),
                detalle: cajaData?.caja || null,
                saldoEsperado:
                    cajaData?.caja?.saldo_esperado ??
                    cajaData?.caja?.saldo_inicial ??
                    0,
                ingresosTurno: cajaData?.caja?.total_ingresos ?? 0,
                egresosTurno: cajaData?.caja?.total_egresos ?? 0,
            },
            ccClientes: {
                totalDeuda: Number(ccClientesKpis?.total_deuda_global) || 0,
                conDeuda:
                    Number(ccClientesKpis?.cantidad_clientes_con_deuda) || 0,
                alDia: Number(ccClientesKpis?.cantidad_clientes_al_dia) || 0,
                total: Number(ccClientesKpis?.total_clientes) || 0,
            },
            ccProveedores: {
                totalDeuda: Number(ccProveedoresKpis?.total_deuda_global) || 0,
                conDeuda:
                    Number(
                        ccProveedoresKpis?.cantidad_proveedores_con_deuda
                    ) || 0,
                alDia:
                    Number(ccProveedoresKpis?.cantidad_proveedores_al_dia) || 0,
                total: Number(ccProveedoresKpis?.total_proveedores) || 0,
            },
            inventario: {
                totalProductos: productsRaw.length,
                totalUnidades,
                valorCostoTotal,
                valorVentaTotal,
                gananciaPotencial,
                productosOptimos,
                productosBajoStock,
                productosAgotados,
            },
            usuarios: {
                total: totalUsuarios,
                porRol: usuariosPorRol,
                recientes: usersRaw.slice(0, 5),
            },
        };
    }, [
        ventasRaw,
        reporteVentasServer,
        reporteMasVendidosServer,
        fechaDesde,
        fechaHasta,
        cajaData,
        productsRaw,
        ccClientesKpis,
        ccProveedoresKpis,
        usersRaw,
    ]);

    return {
        loading,
        loadingReportes,
        lastUpdated,
        fechaDesde,
        fechaHasta,
        activePreset,
        handleApplyDateRange,
        handleSelectPreset,
        reloadMetrics,
        metrics,
    };
}
