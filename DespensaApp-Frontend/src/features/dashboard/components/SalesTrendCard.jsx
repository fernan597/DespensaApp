import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { formatCurrency } from "../../../utils/formatters";

/**
 * [CU18] Panel analítico de Evolución de Ventas y Medios de Cobro con Chart.js
 * e integración de selectores de rango de fechas (fecha_desde / fecha_hasta).
 */
export function SalesTrendCard({
    reporteVentas,
    fechaDesde,
    fechaHasta,
    activePreset,
    onApplyDateRange,
    onSelectPreset,
    loading = false,
}) {
    const [chartType, setChartType] = useState("bar"); // "bar" | "line"
    const [localDesde, setLocalDesde] = useState(fechaDesde || "");
    const [localHasta, setLocalHasta] = useState(fechaHasta || "");

    const mainCanvasRef = useRef(null);
    const mainChartRef = useRef(null);
    const doughnutCanvasRef = useRef(null);
    const doughnutChartRef = useRef(null);

    useEffect(() => {
        setLocalDesde(fechaDesde || "");
        setLocalHasta(fechaHasta || "");
    }, [fechaDesde, fechaHasta]);

    const serieDiaria = reporteVentas?.serie_diaria || [];
    const resumen = reporteVentas?.resumen || {
        total_facturado: 0,
        cantidad_ventas: 0,
        ticket_promedio: 0,
        total_contado: 0,
        total_credito: 0,
    };
    const mediosPago = reporteVentas?.por_medio_pago || [];

    // Renderizar Gráfico Principal (Barras Apiladas / Línea) con Chart.js
    useEffect(() => {
        if (!mainCanvasRef.current || loading) return;

        if (mainChartRef.current) {
            mainChartRef.current.destroy();
        }

        const labels = serieDiaria.map((d) => d.etiqueta || d.label || d.fecha);
        const dataContado = serieDiaria.map((d) => Number(d.contado) || 0);
        const dataCredito = serieDiaria.map((d) => Number(d.credito) || 0);

        const isLine = chartType === "line";

        mainChartRef.current = new Chart(mainCanvasRef.current, {
            type: isLine ? "line" : "bar",
            data: {
                labels,
                datasets: [
                    {
                        label: "Ventas Contado",
                        data: dataContado,
                        backgroundColor: isLine
                            ? "rgba(21, 66, 18, 0.14)"
                            : "#154212",
                        borderColor: "#154212",
                        borderWidth: isLine ? 2.5 : 0,
                        borderRadius: isLine ? 0 : 6,
                        fill: isLine,
                        tension: 0.3,
                        pointRadius: isLine ? 3 : 0,
                        pointHoverRadius: 5,
                    },
                    {
                        label: "Crédito / Fiado (CC)",
                        data: dataCredito,
                        backgroundColor: isLine
                            ? "rgba(217, 119, 6, 0.14)"
                            : "#a1d494",
                        borderColor: isLine ? "#d97706" : "#4a6549",
                        borderWidth: isLine ? 2 : 0,
                        borderRadius: isLine ? 0 : 6,
                        fill: isLine,
                        tension: 0.3,
                        pointRadius: isLine ? 3 : 0,
                        pointHoverRadius: 5,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: "index",
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: "top",
                        align: "end",
                        labels: {
                            boxWidth: 10,
                            boxHeight: 10,
                            usePointStyle: true,
                            pointStyle: "rectRounded",
                            font: {
                                family: "Inter, system-ui, sans-serif",
                                size: 11,
                                weight: "600",
                            },
                            color: "#42493e",
                        },
                    },
                    tooltip: {
                        backgroundColor: "#1a1c19",
                        titleColor: "#fafaf4",
                        bodyColor: "#e3e3de",
                        padding: 10,
                        cornerRadius: 10,
                        callbacks: {
                            afterTitle: (items) => {
                                const idx = items[0]?.dataIndex;
                                const item = serieDiaria[idx];
                                if (!item) return "";
                                const ops = item.cantidad_ventas ?? item.count ?? 0;
                                return `${ops} operación(es) registrada(s)`;
                            },
                            label: (ctx) => {
                                const val = ctx.parsed.y || 0;
                                return ` ${ctx.dataset.label}: ${formatCurrency(val)}`;
                            },
                            footer: (items) => {
                                const sum = items.reduce(
                                    (acc, it) => acc + (it.parsed.y || 0),
                                    0
                                );
                                return `Total del día: ${formatCurrency(sum)}`;
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        stacked: !isLine,
                        grid: {
                            display: false,
                        },
                        ticks: {
                            color: "#42493e",
                            font: { size: 10, weight: "500" },
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 10,
                        },
                    },
                    y: {
                        stacked: !isLine,
                        beginAtZero: true,
                        grid: {
                            color: "rgba(194, 201, 187, 0.3)",
                        },
                        ticks: {
                            color: "#42493e",
                            font: { size: 10 },
                            callback: (val) => {
                                if (val >= 1000000) return `$${(val / 1000000).toFixed(1)}M`;
                                if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                return `$${val}`;
                            },
                        },
                    },
                },
            },
        });

        return () => {
            if (mainChartRef.current) {
                mainChartRef.current.destroy();
                mainChartRef.current = null;
            }
        };
    }, [serieDiaria, chartType, loading]);

    // Renderizar Gráfico Doughnut de Medios de Pago con Chart.js
    useEffect(() => {
        if (!doughnutCanvasRef.current || loading) return;

        if (doughnutChartRef.current) {
            doughnutChartRef.current.destroy();
        }

        const totalMedios = mediosPago.reduce(
            (acc, m) => acc + (Number(m.monto) || 0),
            0
        );

        const labels = mediosPago.map((m) => m.label);
        const values =
            totalMedios > 0
                ? mediosPago.map((m) => Number(m.monto) || 0)
                : [1];
        const colors =
            totalMedios > 0
                ? ["#154212", "#4a6549", "#d97706"]
                : ["#e3e3de"];

        doughnutChartRef.current = new Chart(doughnutCanvasRef.current, {
            type: "doughnut",
            data: {
                labels: totalMedios > 0 ? labels : ["Sin ventas en el período"],
                datasets: [
                    {
                        data: values,
                        backgroundColor: colors,
                        borderWidth: 2,
                        borderColor: "#ffffff",
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: "68%",
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: totalMedios > 0,
                        callbacks: {
                            label: (ctx) =>
                                ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`,
                        },
                    },
                },
            },
        });

        return () => {
            if (doughnutChartRef.current) {
                doughnutChartRef.current.destroy();
                doughnutChartRef.current = null;
            }
        };
    }, [mediosPago, loading]);

    const handleSubmitDates = (e) => {
        e.preventDefault();
        if (localDesde && localHasta && onApplyDateRange) {
            onApplyDateRange(localDesde, localHasta);
        }
    };

    return (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between gap-4">
            {/* Cabecera + Selector de Tipo de Gráfico y Presets */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                            analytics
                        </span>
                        <h3 className="text-base font-bold text-on-surface">
                            Reporte y Evolución de Ventas (Chart.js)
                        </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        Agregación de comprobantes por fecha y modalidad de cobro
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Selector Barras vs Línea */}
                    <div className="inline-flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant/30">
                        <button
                            type="button"
                            onClick={() => setChartType("bar")}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                chartType === "bar"
                                    ? "bg-surface-container-lowest text-primary shadow-2xs"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                            title="Vista de barras apiladas"
                        >
                            <span className="material-symbols-outlined text-[15px]">
                                bar_chart
                            </span>
                            <span>Barras</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setChartType("line")}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                chartType === "line"
                                    ? "bg-surface-container-lowest text-primary shadow-2xs"
                                    : "text-on-surface-variant hover:text-on-surface"
                            }`}
                            title="Vista de curva de tendencia"
                        >
                            <span className="material-symbols-outlined text-[15px]">
                                show_chart
                            </span>
                            <span>Tendencia</span>
                        </button>
                    </div>

                    {/* Atajos rápidos de rango */}
                    <div className="inline-flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant/30">
                        {[
                            { id: "7d", label: "7 días" },
                            { id: "30d", label: "30 días" },
                            { id: "mes", label: "Este Mes" },
                        ].map((preset) => (
                            <button
                                key={preset.id}
                                type="button"
                                onClick={() => onSelectPreset?.(preset.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                                    activePreset === preset.id
                                        ? "bg-primary text-on-primary shadow-2xs"
                                        : "text-on-surface-variant hover:text-on-surface"
                                }`}
                            >
                                {preset.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Selector explícito de Rango de Fechas (CU18) */}
            <form
                onSubmit={handleSubmitDates}
                className="bg-surface-container-low/80 p-3 rounded-xl border border-outline-variant/30 flex flex-wrap items-end justify-between gap-3 text-xs"
            >
                <div className="flex flex-wrap items-end gap-3 flex-1">
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                            Fecha Desde
                        </label>
                        <input
                            type="date"
                            value={localDesde}
                            max={localHasta || undefined}
                            onChange={(e) => setLocalDesde(e.target.value)}
                            className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface text-xs font-medium focus:outline-none focus:border-primary"
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                            Fecha Hasta
                        </label>
                        <input
                            type="date"
                            value={localHasta}
                            min={localDesde || undefined}
                            onChange={(e) => setLocalHasta(e.target.value)}
                            className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-2.5 py-1.5 text-on-surface text-xs font-medium focus:outline-none focus:border-primary"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading || !localDesde || !localHasta}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary text-on-primary font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-2xs"
                    >
                        <span className="material-symbols-outlined text-[16px]">
                            filter_alt
                        </span>
                        <span>Filtrar Gráficos</span>
                    </button>
                </div>

                {/* Resumen rápido del rango filtrado */}
                <div className="flex items-center gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            Facturado en Rango
                        </span>
                        <span className="text-sm font-bold text-primary font-mono tabular-nums">
                            {loading ? "—" : formatCurrency(resumen.total_facturado)}
                        </span>
                    </div>
                    <div className="text-right border-l border-outline-variant/30 pl-3">
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                            Tickets / Promedio
                        </span>
                        <span className="text-sm font-bold text-on-surface font-mono tabular-nums">
                            {loading
                                ? "—"
                                : `${resumen.cantidad_ventas} op. (${formatCurrency(resumen.ticket_promedio)})`}
                        </span>
                    </div>
                </div>
            </form>

            {/* Canvas Principal de Chart.js */}
            <div className="relative h-56 w-full">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-xs text-on-surface-variant gap-2">
                        <span className="material-symbols-outlined animate-spin text-primary text-[22px]">
                            progress_activity
                        </span>
                        Consultando reporte de ventas en el servidor...
                    </div>
                ) : (
                    <canvas ref={mainCanvasRef} />
                )}
            </div>

            {/* Desglose por Medio de Pago con Mini-Doughnut Chart.js */}
            <div className="pt-3 border-t border-outline-variant/25 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-center">
                <div className="relative h-24 w-24 mx-auto">
                    <canvas ref={doughnutCanvasRef} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {mediosPago.map((mp) => (
                        <div
                            key={mp.id}
                            className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25 space-y-1"
                        >
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-on-surface truncate">
                                    {mp.label}
                                </span>
                                <span className="font-bold text-primary tabular-nums">
                                    {mp.porcentaje}%
                                </span>
                            </div>
                            <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                                <div
                                    style={{ width: `${mp.porcentaje}%` }}
                                    className={`h-full rounded-full ${
                                        mp.id === "EFECTIVO"
                                            ? "bg-primary"
                                            : mp.id === "CREDITO"
                                            ? "bg-amber-600"
                                            : "bg-secondary"
                                    }`}
                                />
                            </div>
                            <p className="text-xs font-mono tabular-nums text-on-surface-variant font-semibold">
                                {loading ? "—" : formatCurrency(mp.monto)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
