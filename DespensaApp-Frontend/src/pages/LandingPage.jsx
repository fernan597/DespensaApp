import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const FEATURES = [
    {
        icon: "point_of_sale",
        badge: "Operación Diaria",
        title: "Punto de Venta (POS) Ágil",
        description:
            "Facturación rápida pensada para mostrador: búsqueda instantánea de artículos, cálculo automático de vueltos y cobros en Efectivo, Transferencia, Tarjeta o Cuenta Corriente.",
        highlights: ["Búsqueda rápida por nombre o código", "Cálculo de vuelto en vivo", "Múltiples medios de pago"],
    },
    {
        icon: "payments",
        badge: "Tesorería",
        title: "Control de Caja por Turnos",
        description:
            "Apertura y cierre de turnos con saldo inicial, registro de ingresos o retiros manuales y arqueo asistido comparando saldo esperado vs. efectivo real.",
        highlights: ["Apertura y arqueo de turno", "Movimientos de ingreso y egreso", "Detección de diferencias de caja"],
    },
    {
        icon: "inventory_2",
        badge: "Abastecimiento",
        title: "Inventario y Alertas de Stock",
        description:
            "Catálogo organizado por categorías con control de precios de costo y venta. Notificaciones automáticas cuando un producto alcanza su stock mínimo o se agota.",
        highlights: ["Semáforo de stock mínimo", "Gestión de precios y márgenes", "Clasificación por categorías"],
    },
    {
        icon: "contact_page",
        badge: "Fidelización",
        title: "Cuentas Corrientes (Fiado)",
        description:
            "Administración transparente de libretas y saldos de clientes habituales con límites de crédito configurables, historial de consumos y registro de entregas parciales.",
        highlights: ["Tope de crédito por cliente", "Cobros parciales o totales", "Estado de cuenta detallado"],
    },
    {
        icon: "local_shipping",
        badge: "Proveedores",
        title: "Compras y Cuentas por Pagar",
        description:
            "Recepción de mercadería con actualización automática de inventario y seguimiento de saldos pendientes con cada proveedor o distribuidor.",
        highlights: ["Ingreso de compras al stock", "Cuenta corriente de proveedores", "Historial de pagos emitidos"],
    },
    {
        icon: "monitoring",
        badge: "Dirección",
        title: "Métricas y Auditoría de Operaciones",
        description:
            "Tablero ejecutivo con indicadores financieros en tiempo real, evolución de ingresos, ranking de productos más vendidos y registro inalterable de auditoría.",
        highlights: ["KPIs y gráficos interactivos", "Ranking de artículos líderes", "Trazabilidad por usuario y fecha"],
    },
];

const WORKFLOW_STEPS = [
    {
        step: "01",
        icon: "lock_open",
        title: "Apertura de Turno",
        description: "El operador inicia la jornada declarando el fondo de caja inicial para habilitar la terminal de ventas.",
    },
    {
        step: "02",
        icon: "shopping_cart_checkout",
        title: "Atención en Mostrador",
        description: "Carga ágil de productos en el POS, selección del medio de pago o imputación a cuenta corriente del cliente.",
    },
    {
        step: "03",
        icon: "sync_saved_locally",
        title: "Impacto Automático",
        description: "Cada venta descuenta stock al instante, actualiza el saldo de caja y alimenta los reportes gerenciales.",
    },
    {
        step: "04",
        icon: "fact_check",
        title: "Arqueo y Balance",
        description: "Al finalizar el turno se realiza el recuento físico, conciliando los totales cobrados y auditando el resultado.",
    },
];

const ROLES = [
    {
        role: "Administrador del Comercio",
        badge: "Gestión Integral",
        icon: "storefront",
        description:
            "Control completo del negocio: tablero financiero, catálogo de precios, compras a proveedores, cuentas corrientes, punto de venta y auditoría.",
        permissions: ["Dashboard de métricas y reportes", "Catálogo, stock y proveedores", "POS, caja y cuentas corrientes"],
    },
    {
        role: "Operador de Caja / Vendedor",
        badge: "Atención al Público",
        icon: "badge",
        description:
            "Interfaz enfocada en la velocidad de atención en mostrador: facturación en el POS, gestión del turno de caja y cobros de clientes.",
        permissions: ["Terminal de Punto de Venta (POS)", "Apertura, movimientos y cierre de caja", "Consulta y cobro de CC Clientes"],
    },
];

export function LandingPage() {
    const { isAuthenticated } = useAuth();
    const ctaTarget = isAuthenticated ? "/" : "/login";
    const ctaLabel = isAuthenticated ? "Ir al Panel de Control" : "Iniciar Sesión";

    return (
        <div className="min-h-screen bg-surface text-on-surface font-body-md flex flex-col selection:bg-secondary-container selection:text-primary">
            {/* ── HEADER / NAVBAR SUPERIOR ── */}
            <header className="sticky top-0 z-40 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/40">
                <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                    {/* Identidad de Marca */}
                    <Link to="/" className="flex items-center gap-2.5 group">
                        <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-xs group-hover:bg-primary-container transition-colors">
                            <span className="material-symbols-outlined text-[22px]">
                                storefront
                            </span>
                        </div>
                        <div>
                            <span className="text-base sm:text-lg font-bold text-primary tracking-tight block leading-none">
                                DespensaApp
                            </span>
                            <span className="text-[11px] font-medium text-on-surface-variant block mt-0.5">
                                Sistema de Ventas y Gestión Comercial
                            </span>
                        </div>
                    </Link>

                    {/* Navegación interna */}
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-on-surface-variant">
                        <a
                            href="#funciones"
                            className="hover:text-primary transition-colors"
                        >
                            Funciones
                        </a>
                        <a
                            href="#flujo"
                            className="hover:text-primary transition-colors"
                        >
                            Flujo Operativo
                        </a>
                        <a
                            href="#perfiles"
                            className="hover:text-primary transition-colors"
                        >
                            Perfiles de Uso
                        </a>
                    </nav>

                    {/* Botón de Acceso / Login */}
                    <div className="flex items-center gap-3">
                        <Link
                            to={ctaTarget}
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all shadow-xs"
                        >
                            <span className="material-symbols-outlined text-[18px]">
                                login
                            </span>
                            <span>{ctaLabel}</span>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* ── SECCIÓN HERO ── */}
                <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 border-b border-outline-variant/30">
                    {/* Fondos decorativos suaves */}
                    <div className="pointer-events-none absolute -top-28 -left-28 w-96 h-96 bg-primary-fixed-dim/25 rounded-full blur-3xl" />
                    <div className="pointer-events-none absolute top-1/3 -right-28 w-96 h-96 bg-secondary-fixed/40 rounded-full blur-3xl" />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
                            {/* Columna Izquierda: Propuesta de Valor */}
                            <div className="lg:col-span-6 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary-container/80 border border-secondary/20 text-primary text-xs font-semibold">
                                    <span className="material-symbols-outlined text-[16px]">
                                        verified
                                    </span>
                                    <span>Software ERP y Punto de Venta para Comercios Minoristas</span>
                                </div>

                                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-on-surface tracking-tight leading-[1.15]">
                                    Todo el control de tu{" "}
                                    <span className="text-primary">comercio y despensa</span> en un
                                    solo sistema.
                                </h1>

                                <p className="text-base sm:text-lg text-on-surface-variant leading-relaxed">
                                    Agilizá las ventas en mostrador, controlá los turnos de caja sin
                                    faltantes, llevá al día las cuentas corrientes de tus clientes y
                                    recibí alertas automáticas antes de quedarte sin stock.
                                </p>

                                {/* Acciones principales */}
                                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                                    <Link
                                        to={ctaTarget}
                                        className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-primary text-on-primary font-semibold text-sm sm:text-base hover:bg-primary-container hover:text-on-primary-container active:scale-[0.98] transition-all shadow-sm"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            login
                                        </span>
                                        <span>{ctaLabel}</span>
                                    </Link>

                                    <a
                                        href="#funciones"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-surface-container-lowest border border-outline-variant/60 text-on-surface font-semibold text-sm sm:text-base hover:bg-surface-container-high transition-colors"
                                    >
                                        <span>Ver funciones del sistema</span>
                                        <span className="material-symbols-outlined text-[18px]">
                                            arrow_downward
                                        </span>
                                    </a>
                                </div>

                                {/* Indicadores rápidos de confianza */}
                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-outline-variant/40">
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                                            POS 24/7
                                        </p>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            Facturación rápida y multimétodo
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                                            100% Trazable
                                        </p>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            Arqueo de caja y logs de auditoría
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-bold text-primary tabular-nums">
                                            En Vivo
                                        </p>
                                        <p className="text-xs text-on-surface-variant mt-0.5">
                                            Alertas de stock y cuentas claras
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Columna Derecha: Vista Previa Visual de la Interfaz */}
                            <div className="lg:col-span-6">
                                <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/50 shadow-xl overflow-hidden">
                                    {/* Barra superior simulada del sistema */}
                                    <div className="bg-surface-container-low px-4 py-3 border-b border-outline-variant/40 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-error/70" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                            <span className="w-2.5 h-2.5 rounded-full bg-primary/80" />
                                            <span className="ml-2 text-xs font-semibold text-on-surface-variant flex items-center gap-1.5">
                                                <span className="material-symbols-outlined text-[16px] text-primary">
                                                    point_of_sale
                                                </span>
                                                Terminal Punto de Venta · Turno Mañana
                                            </span>
                                        </div>
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-secondary-container text-primary">
                                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                            Caja Abierta
                                        </span>
                                    </div>

                                    {/* Cuerpo de la vista previa */}
                                    <div className="p-4 sm:p-5 space-y-4 bg-surface">
                                        {/* Mini KPIs superiores */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                                                <div className="flex items-center justify-between text-on-surface-variant">
                                                    <span className="text-[11px] font-medium">
                                                        Ventas del Día
                                                    </span>
                                                    <span className="material-symbols-outlined text-[16px] text-primary">
                                                        trending_up
                                                    </span>
                                                </div>
                                                <p className="text-base sm:text-lg font-bold text-on-surface tabular-nums mt-1">
                                                    $ 248.500
                                                </p>
                                                <span className="text-[10px] font-semibold text-primary">
                                                    38 tickets emitidos
                                                </span>
                                            </div>

                                            <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                                                <div className="flex items-center justify-between text-on-surface-variant">
                                                    <span className="text-[11px] font-medium">
                                                        Saldo en Caja
                                                    </span>
                                                    <span className="material-symbols-outlined text-[16px] text-primary">
                                                        account_balance_wallet
                                                    </span>
                                                </div>
                                                <p className="text-base sm:text-lg font-bold text-on-surface tabular-nums mt-1">
                                                    $ 164.200
                                                </p>
                                                <span className="text-[10px] font-semibold text-on-surface-variant">
                                                    Efectivo conciliado
                                                </span>
                                            </div>

                                            <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
                                                <div className="flex items-center justify-between text-on-surface-variant">
                                                    <span className="text-[11px] font-medium">
                                                        Alertas Stock
                                                    </span>
                                                    <span className="material-symbols-outlined text-[16px] text-amber-600">
                                                        notifications_active
                                                    </span>
                                                </div>
                                                <p className="text-base sm:text-lg font-bold text-on-surface tabular-nums mt-1">
                                                    4 ítems
                                                </p>
                                                <span className="text-[10px] font-semibold text-amber-700">
                                                    Reposición sugerida
                                                </span>
                                            </div>
                                        </div>

                                        {/* Simulación de Ticket POS en curso */}
                                        <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/40 p-3.5 space-y-2.5">
                                            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2">
                                                <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-[16px] text-primary">
                                                        receipt_long
                                                    </span>
                                                    Venta en Mostrador #00412
                                                </span>
                                                <span className="text-[11px] font-medium text-on-surface-variant">
                                                    Cliente: Consumidor Final
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex items-center justify-between py-1">
                                                    <div>
                                                        <p className="font-semibold text-on-surface">
                                                            Yerba Mate Selección 1 Kg
                                                        </p>
                                                        <p className="text-[11px] text-on-surface-variant">
                                                            2 un. x $ 4.200 · Almacén
                                                        </p>
                                                    </div>
                                                    <span className="font-bold tabular-nums text-on-surface">
                                                        $ 8.400
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between py-1 border-t border-outline-variant/20">
                                                    <div>
                                                        <p className="font-semibold text-on-surface">
                                                            Aceite de Girasol 1.5 L
                                                        </p>
                                                        <p className="text-[11px] text-on-surface-variant">
                                                            1 un. x $ 3.150 · Almacén
                                                        </p>
                                                    </div>
                                                    <span className="font-bold tabular-nums text-on-surface">
                                                        $ 3.150
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between py-1 border-t border-outline-variant/20">
                                                    <div>
                                                        <p className="font-semibold text-on-surface">
                                                            Leche Entera Larga Vida 1 L
                                                        </p>
                                                        <p className="text-[11px] text-on-surface-variant">
                                                            3 un. x $ 1.450 · Lácteos
                                                        </p>
                                                    </div>
                                                    <span className="font-bold tabular-nums text-on-surface">
                                                        $ 4.350
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-2 py-0.5 rounded-md bg-secondary-container/70 text-primary text-[11px] font-semibold">
                                                        Efectivo / Transferencia / Fiado
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[11px] text-on-surface-variant mr-2">
                                                        Total a cobrar:
                                                    </span>
                                                    <span className="text-base font-bold text-primary tabular-nums">
                                                        $ 15.900
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Barra inferior del mockup */}
                                        <div className="flex items-center justify-between text-xs bg-secondary-container/40 border border-secondary/20 rounded-xl px-3.5 py-2.5">
                                            <div className="flex items-center gap-2 text-primary font-medium">
                                                <span className="material-symbols-outlined text-[18px]">
                                                    check_circle
                                                </span>
                                                <span>
                                                    Stock descontado y caja actualizada en tiempo real
                                                </span>
                                            </div>
                                            <Link
                                                to={ctaTarget}
                                                className="font-bold text-primary hover:underline shrink-0 ml-2"
                                            >
                                                Probar ahora →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SECCIÓN DE FUNCIONES PRINCIPALES ── */}
                <section id="funciones" className="py-16 sm:py-20 bg-surface-container-low/60 border-b border-outline-variant/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
                            <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-primary text-xs font-bold uppercase tracking-wider">
                                Módulos Integrados
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                                Herramientas diseñadas para la rutina real del comercio
                            </h2>
                            <p className="text-sm sm:text-base text-on-surface-variant">
                                Desde la venta rápida en mostrador hasta el control financiero de
                                proveedores y auditoría de usuarios, todo conectado sin planillas
                                sueltas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {FEATURES.map((feature) => (
                                <article
                                    key={feature.title}
                                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 shadow-xs hover:shadow-md hover:border-primary/30 transition-all flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-secondary-container/80 text-primary flex items-center justify-center">
                                                <span className="material-symbols-outlined text-[26px]">
                                                    {feature.icon}
                                                </span>
                                            </div>
                                            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-container text-on-surface-variant">
                                                {feature.badge}
                                            </span>
                                        </div>

                                        <h3 className="text-lg font-bold text-on-surface mb-2">
                                            {feature.title}
                                        </h3>
                                        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                                            {feature.description}
                                        </p>
                                    </div>

                                    <ul className="space-y-1.5 pt-4 border-t border-outline-variant/30">
                                        {feature.highlights.map((item) => (
                                            <li
                                                key={item}
                                                className="flex items-center gap-2 text-xs font-medium text-on-surface"
                                            >
                                                <span className="material-symbols-outlined text-[16px] text-primary shrink-0">
                                                    check_circle
                                                </span>
                                                <span>{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SECCIÓN FLUJO OPERATIVO ── */}
                <section id="flujo" className="py-16 sm:py-20 bg-surface border-b border-outline-variant/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
                            <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-primary text-xs font-bold uppercase tracking-wider">
                                Ciclo Diario de Trabajo
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                                Orden operativo de principio a fin del día
                            </h2>
                            <p className="text-sm sm:text-base text-on-surface-variant">
                                Un flujo pensado para evitar errores de cobro, pérdida de mercadería
                                o descuadres en los cierres de turno.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                            {WORKFLOW_STEPS.map((item) => (
                                <div
                                    key={item.step}
                                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-5 relative flex flex-col justify-between"
                                >
                                    <div>
                                        <div className="flex items-center justify-between mb-4">
                                            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-primary text-on-primary tabular-nums">
                                                Paso {item.step}
                                            </span>
                                            <span className="material-symbols-outlined text-[24px] text-primary">
                                                {item.icon}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-bold text-on-surface mb-1.5">
                                            {item.title}
                                        </h3>
                                        <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── SECCIÓN PERFILES Y ROLES ── */}
                <section id="perfiles" className="py-16 sm:py-20 bg-surface-container-low/60 border-b border-outline-variant/30">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
                            <span className="inline-block px-3 py-1 rounded-full bg-secondary-container text-primary text-xs font-bold uppercase tracking-wider">
                                Seguridad por Roles
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-bold text-on-surface tracking-tight">
                                Cada integrante del equipo con el acceso que necesita
                            </h2>
                            <p className="text-sm sm:text-base text-on-surface-variant">
                                DespensaApp separa las funciones operativas y administrativas según
                                el rol del usuario que inicia sesión.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                            {ROLES.map((item) => (
                                <div
                                    key={item.role}
                                    className="bg-surface-container-lowest rounded-2xl border border-outline-variant/40 p-6 flex flex-col justify-between shadow-xs"
                                >
                                    <div>
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-11 h-11 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-[22px]">
                                                    {item.icon}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[11px] font-bold uppercase tracking-wider text-primary block">
                                                    {item.badge}
                                                </span>
                                                <h3 className="text-base font-bold text-on-surface">
                                                    {item.role}
                                                </h3>
                                            </div>
                                        </div>

                                        <p className="text-sm text-on-surface-variant leading-relaxed mb-4">
                                            {item.description}
                                        </p>
                                    </div>

                                    <div className="bg-surface-container-low rounded-xl p-3.5 space-y-2 border border-outline-variant/30">
                                        <p className="text-[11px] font-bold uppercase tracking-wider text-outline">
                                            Accesos habilitados
                                        </p>
                                        {item.permissions.map((perm) => (
                                            <div
                                                key={perm}
                                                className="flex items-center gap-2 text-xs font-medium text-on-surface"
                                            >
                                                <span className="material-symbols-outlined text-[15px] text-primary">
                                                    verified_user
                                                </span>
                                                <span>{perm}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ── BANNER CTA FINAL PARA INICIAR SESIÓN ── */}
                <section className="py-16 sm:py-20 bg-surface">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-primary text-on-primary rounded-3xl p-8 sm:p-12 shadow-lg relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
                            <div className="space-y-3 text-center lg:text-left max-w-xl relative z-10">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-xs font-semibold">
                                    <span className="material-symbols-outlined text-[16px]">
                                        bolt
                                    </span>
                                    Acceso Inmediato al Sistema
                                </span>
                                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                                    ¿Listo para comenzar a operar en tu comercio?
                                </h2>
                                <p className="text-sm sm:text-base text-on-primary/85 leading-relaxed">
                                    Ingresá con tus credenciales de usuario para acceder al Punto de
                                    Venta, revisar el estado de caja o consultar el tablero de
                                    métricas.
                                </p>
                            </div>

                            <div className="shrink-0 relative z-10">
                                <Link
                                    to={ctaTarget}
                                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-surface-container-lowest text-primary font-bold text-sm sm:text-base hover:bg-secondary-container transition-all shadow-md active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        login
                                    </span>
                                    <span>{ctaLabel}</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── FOOTER ── */}
            <footer className="bg-surface-container-low border-t border-outline-variant/40 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-[16px]">
                                    storefront
                                </span>
                            </div>
                            <span className="font-bold text-on-surface">DespensaApp</span>
                            <span>· Sistema ERP de Ventas, Caja e Inventario</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <a href="#funciones" className="hover:text-primary transition-colors">
                                Funciones
                            </a>
                            <a href="#flujo" className="hover:text-primary transition-colors">
                                Flujo Operativo
                            </a>
                            <Link
                                to={ctaTarget}
                                className="font-semibold text-primary hover:underline"
                            >
                                {ctaLabel}
                            </Link>
                        </div>
                    </div>

                    <div className="pt-5 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-on-surface-variant">
                        <p className="font-medium">
                            Creado por <strong className="text-on-surface font-bold">Fernando Garcia</strong>
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <a
                                href="https://github.com/fernan597"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-surface-container-lowest border border-outline-variant/50 text-on-surface font-semibold hover:border-primary hover:text-primary transition-all shadow-2xs"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    code
                                </span>
                                <span>GitHub / LinkedIn</span>
                            </a>

                            <a
                                href="https://portfolio-react-fer.netlify.app/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-primary text-on-primary font-semibold hover:bg-primary-container hover:text-on-primary-container transition-all shadow-2xs"
                            >
                                <span className="material-symbols-outlined text-[16px]">
                                    language
                                </span>
                                <span>Portfolio</span>
                            </a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

