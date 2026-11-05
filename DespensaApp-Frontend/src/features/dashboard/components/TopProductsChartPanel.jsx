import { useState, useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { formatCurrency } from "../../../utils/formatters";

/**
 * [CU18] Panel gráfico de Productos Más Vendidos (GET /api/reportes/mas-vendidos)
 * renderizado con Chart.js (Horizontal Bar Chart) y tabla de ranking.
 */
export function TopProductsChartPanel({
    reporteMasVendidos,
    loading = false,
}) {
    const [metricMode, setMetricMode] = useState("unidades"); // "unidades" | "monto"
    const canvasRef = useRef(null);
    const chartInstanceRef = useRef(null);

    const productos = reporteMasVendidos?.productos || [];
    const resumen = reporteMasVendidos?.resumen || {
        total_unidades_top: 0,
        total_recaudado_top: 0,
        cantidad_productos: 0,
    };

    useEffect(() => {
        if (!canvasRef.current || loading || productos.length === 0) return;

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
        }

        const labels = productos.map((p) =>
            p.nombre.length > 24 ? `${p.nombre.slice(0, 22)}…` : p.nombre
        );
        const values = productos.map((p) =>
            metricMode === "unidades"
                ? Number(p.cantidad_vendida) || 0
                : Number(p.total_recaudado) || 0
        );

        chartInstanceRef.current = new Chart(canvasRef.current, {
            type: "bar",
            data: {
                labels,
                datasets: [
                    {
                        label:
                            metricMode === "unidades"
                                ? "Unidades Vendidas"
                                : "Total Recaudado (ARS)",
                        data: values,
                        backgroundColor: productos.map((_, idx) =>
                            idx === 0
                                ? "#154212"
                                : idx < 3
                                ? "#2d5a27"
                                : "#4a6549"
                        ),
                        borderRadius: 6,
                        barThickness: 18,
                    },
                ],
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: "#1a1c19",
                        titleColor: "#fafaf4",
                        bodyColor: "#e3e3de",
                        padding: 10,
                        cornerRadius: 10,
                        callbacks: {
                            title: (items) => {
                                const idx = items[0]?.dataIndex;
                                return productos[idx]?.nombre || "";
                            },
                            label: (ctx) => {
                                const prod = productos[ctx.dataIndex];
                                if (!prod) return "";
                                return [
                                    ` Unidades vendidas: ${prod.cantidad_vendida} un.`,
                                    ` Recaudación: ${formatCurrency(prod.total_recaudado)}`,
                                    ` Tickets: ${prod.frecuencia_ventas} venta(s)`,
                                ];
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        grid: {
                            color: "rgba(194, 201, 187, 0.3)",
                        },
                        ticks: {
                            color: "#42493e",
                            font: { size: 10 },
                            callback: (val) => {
                                if (metricMode === "unidades") return `${val} un.`;
                                if (val >= 1000) return `$${(val / 1000).toFixed(0)}k`;
                                return `$${val}`;
                            },
                        },
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: "#1a1c19",
                            font: {
                                family: "Inter, system-ui, sans-serif",
                                size: 11,
                                weight: "600",
                            },
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [productos, metricMode, loading]);

    return (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 shadow-xs p-5 flex flex-col justify-between gap-4">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/25 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-[20px]">
                            workspace_premium
                        </span>
                        <h3 className="text-base font-bold text-on-surface">
                            Ranking de Productos Más Vendidos
                        </h3>
                    </div>
                    <p className="text-xs text-on-surface-variant mt-0.5">
                        Artículos con mayor rotación y facturación en el período seleccionado
                    </p>
                </div>

                {/* Selector Unidades vs Importe */}
                <div className="inline-flex items-center bg-surface-container p-1 rounded-xl border border-outline-variant/30 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setMetricMode("unidades")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            metricMode === "unidades"
                                ? "bg-primary text-on-primary shadow-2xs"
                                : "text-on-surface-variant hover:text-on-surface"
                        }`}
                    >
                        Por Unidades
                    </button>
                    <button
                        type="button"
                        onClick={() => setMetricMode("monto")}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            metricMode === "monto"
                                ? "bg-primary text-on-primary shadow-2xs"
                                : "text-on-surface-variant hover:text-on-surface"
                        }`}
                    >
                        Por Ingresos ($)
                    </button>
                </div>
            </div>

            {/* Sub-KPIs del Ranking */}
            <div className="grid grid-cols-2 gap-3 bg-surface-container-low/70 p-3 rounded-xl border border-outline-variant/25 text-xs">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                        Unidades Vendidas (Top)
                    </span>
                    <span className="text-base font-bold text-primary font-mono tabular-nums">
                        {loading ? "—" : `${resumen.total_unidades_top} un.`}
                    </span>
                </div>
                <div className="border-l border-outline-variant/30 pl-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant block">
                        Recaudación acumulada (Top)
                    </span>
                    <span className="text-base font-bold text-on-surface font-mono tabular-nums">
                        {loading ? "—" : formatCurrency(resumen.total_recaudado_top)}
                    </span>
                </div>
            </div>

            {/* Gráfico Chart.js Horizontal o Estado Vacío */}
            {loading ? (
                <div className="h-56 flex items-center justify-center text-xs text-on-surface-variant gap-2">
                    <span className="material-symbols-outlined animate-spin text-primary text-[22px]">
                        progress_activity
                    </span>
                    Consultando ranking de productos más vendidos...
                </div>
            ) : productos.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-center text-on-surface-variant space-y-1.5">
                    <span className="material-symbols-outlined text-outline text-[34px]">
                        trending_up
                    </span>
                    <p className="text-sm font-semibold text-on-surface">
                        Sin ventas registradas en este rango de fechas
                    </p>
                    <p className="text-xs max-w-xs">
                        Seleccioná un rango de fechas con operaciones o registrá ventas desde el POS para visualizar el ranking.
                    </p>
                </div>
            ) : (
                <div className="relative h-56 w-full">
                    <canvas ref={canvasRef} />
                </div>
            )}

            {/* Top 3 destacado en tarjetas compactas */}
            {!loading && productos.length > 0 && (
                <div className="pt-2 border-t border-outline-variant/25 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {productos.slice(0, 3).map((prod, idx) => (
                        <div
                            key={prod.producto_id}
                            className="p-2.5 rounded-xl bg-surface-container-low border border-outline-variant/25 flex items-center justify-between gap-2"
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <span
                                    className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${
                                        idx === 0
                                            ? "bg-primary text-on-primary"
                                            : "bg-secondary-container text-primary"
                                    }`}
                                >
                                    #{idx + 1}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-on-surface truncate">
                                        {prod.nombre}
                                    </p>
                                    <p className="text-[11px] text-on-surface-variant font-mono tabular-nums">
                                        {formatCurrency(prod.total_recaudado)}
                                    </p>
                                </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-secondary-container/70 text-primary text-xs font-bold font-mono tabular-nums shrink-0">
                                {prod.cantidad_vendida} un.
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

