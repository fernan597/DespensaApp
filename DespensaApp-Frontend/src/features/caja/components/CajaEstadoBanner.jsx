import { useState } from "react";
import { AbrirCajaModal } from "./AbrirCajaModal";
import { CerrarCajaModal } from "./CerrarCajaModal";

/**
 * Banner persistente que muestra el estado de la caja en la página de Punto de Venta.
 * - Si está CERRADA: muestra alerta y botón para abrir.
 * - Si está ABIERTA: muestra datos del turno y botón para cerrar.
 *
 * @param {{
 *   cajaAbierta: boolean,
 *   caja: object|null,
 *   loading: boolean,
 *   onAbrir: (saldoInicial: number) => Promise<boolean>,
 *   onCerrar: (saldoFinal: number) => Promise<object|null>
 * }} props
 */
export function CajaEstadoBanner({ cajaAbierta, caja, loading, onAbrir, onCerrar }) {
    const [showAbrirModal, setShowAbrirModal] = useState(false);
    const [showCerrarModal, setShowCerrarModal] = useState(false);

    if (loading) {
        return (
            <div className="flex items-center gap-sm p-md bg-surface-container rounded-2xl animate-pulse">
                <span className="material-symbols-outlined text-outline text-[20px]">point_of_sale</span>
                <span className="text-body-md text-on-surface-variant">Consultando estado de caja...</span>
            </div>
        );
    }

    /* ── CAJA CERRADA ── */
    if (!cajaAbierta) {
        return (
            <>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md p-md bg-error-container/30 border border-error/30 rounded-2xl">
                    <div className="flex items-center gap-sm">
                        <span className="material-symbols-outlined text-error text-[24px]">
                            lock
                        </span>
                        <div>
                            <p className="font-label-md text-label-md font-semibold text-error">
                                Caja cerrada
                            </p>
                            <p className="text-body-sm text-on-surface-variant">
                                No podés registrar ventas hasta abrir la caja.
                            </p>
                        </div>
                    </div>
                    <button
                        id="btn-abrir-caja"
                        onClick={() => setShowAbrirModal(true)}
                        className="shrink-0 flex items-center gap-xs px-lg py-sm bg-primary text-on-primary rounded-full text-label-md font-label-md hover:bg-primary/90 transition-colors"
                    >
                        <span className="material-symbols-outlined text-[18px]">lock_open</span>
                        Abrir Caja
                    </button>
                </div>

                <AbrirCajaModal
                    isOpen={showAbrirModal}
                    onClose={() => setShowAbrirModal(false)}
                    onConfirm={onAbrir}
                />
            </>
        );
    }

    /* ── CAJA ABIERTA ── */
    const fechaApertura = caja?.fecha_apertura
        ? new Date(caja.fecha_apertura).toLocaleTimeString("es-AR", {
              hour: "2-digit",
              minute: "2-digit",
          })
        : "--:--";

    return (
        <>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md p-md bg-green-500/10 border border-green-500/30 rounded-2xl">
                {/* Info del turno */}
                <div className="flex items-center gap-sm flex-1 min-w-0">
                    <span className="material-symbols-outlined text-green-600 text-[24px] shrink-0">
                        point_of_sale
                    </span>
                    <div className="min-w-0">
                        <p className="font-label-md text-label-md font-semibold text-green-700">
                            Caja abierta · Turno desde las {fechaApertura}
                        </p>
                        <p className="text-body-sm text-on-surface-variant truncate">
                            Cajero: {caja?.usuario_apertura?.name ?? "—"}
                        </p>
                    </div>
                </div>

                {/* Métricas rápidas */}
                <div className="flex items-center gap-md text-body-sm shrink-0">
                    <div className="text-center">
                        <p className="text-on-surface-variant text-label-sm">Ingresos</p>
                        <p className="font-semibold text-green-700">
                            ${(caja?.total_ingresos ?? 0).toFixed(2)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-on-surface-variant text-label-sm">Saldo esperado</p>
                        <p className="font-semibold text-on-surface">
                            ${(caja?.saldo_esperado ?? caja?.saldo_inicial ?? 0).toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Botón cerrar */}
                <button
                    id="btn-cerrar-caja"
                    onClick={() => setShowCerrarModal(true)}
                    className="shrink-0 flex items-center gap-xs px-lg py-sm bg-error text-on-error rounded-full text-label-md font-label-md hover:bg-error/90 transition-colors"
                >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    Cerrar Caja
                </button>
            </div>

            <CerrarCajaModal
                isOpen={showCerrarModal}
                onClose={() => setShowCerrarModal(false)}
                onConfirm={onCerrar}
                saldoEsperado={caja?.saldo_esperado ?? caja?.saldo_inicial ?? 0}
            />
        </>
    );
}
