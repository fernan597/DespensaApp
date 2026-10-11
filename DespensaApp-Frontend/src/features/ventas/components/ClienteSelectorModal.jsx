import { useState, useEffect } from "react";
import { Modal } from "../../../components/ui/Modal";
import { getClientes } from "../../../services/clienteService";

/**
 * Modal para seleccionar un cliente registrado en el sistema.
 * Filtra consultando directamente al backend mediante debounce.
 *
 * @param {{
 *   isOpen: boolean,
 *   onClose: () => void,
 *   onSelect: (cliente: object) => void,
 *   selectedClienteId?: number|null
 * }} props
 */
export function ClienteSelectorModal({
    isOpen,
    onClose,
    onSelect,
    selectedClienteId = null,
}) {
    const [clientes, setClientes] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Consulta al backend con debounce al abrir el modal o cambiar el texto de búsqueda
    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        setLoading(true);
        setError(null);

        const timer = setTimeout(async () => {
            try {
                const data = await getClientes(search);
                if (isMounted) {
                    setClientes(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (isMounted) {
                    setError("No se pudo cargar la lista de clientes.");
                    console.error("Error al cargar clientes:", err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }, 300); // 300ms de debounce para no saturar al tipear

        return () => {
            isMounted = false;
            clearTimeout(timer);
        };
    }, [isOpen, search]);

    const handleClose = () => {
        setSearch("");
        onClose();
    };

    const handleSelect = (cliente) => {
        onSelect(cliente);
        handleClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title="Seleccionar Cliente"
            maxWidth="max-w-lg"
        >
            <div className="flex flex-col gap-4">
                {/* Input de búsqueda */}
                <div className="relative">
                    <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2 border border-outline-variant/40 focus-within:border-primary transition-colors">
                        <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                            search
                        </span>
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar por nombre, apellido o teléfono..."
                            className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline focus:outline-none"
                            autoFocus
                        />
                        {search && (
                            <button
                                type="button"
                                onClick={() => setSearch("")}
                                className="text-on-surface-variant hover:text-on-surface"
                            >
                                <span className="material-symbols-outlined text-[18px]">close</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Mensaje de error si falla la carga */}
                {error && (
                    <div className="p-3 bg-error-container/30 border border-error/30 rounded-xl text-xs text-error">
                        {error}
                    </div>
                )}

                {/* Listado de clientes directo desde la respuesta del backend */}
                <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                    {loading ? (
                        <div className="py-8 text-center text-sm text-on-surface-variant flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined animate-spin text-[20px]">
                                progress_activity
                            </span>
                            Buscando clientes...
                        </div>
                    ) : clientes.length === 0 ? (
                        <div className="py-8 text-center text-sm text-on-surface-variant">
                            {search.trim()
                                ? `No se encontraron clientes para "${search}".`
                                : "No hay clientes registrados en el sistema."}
                        </div>
                    ) : (
                        clientes.map((cliente) => {
                            const isSelected = selectedClienteId === cliente.id;
                            const saldo = Number(cliente.saldo_cuenta_corriente ?? 0);
                            const tieneDeuda = saldo > 0;

                            return (
                                <div
                                    key={cliente.id}
                                    onClick={() => handleSelect(cliente)}
                                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                        isSelected
                                            ? "bg-primary-container/20 border-primary"
                                            : "bg-surface-container-low border-outline-variant/30 hover:bg-surface-container hover:border-outline-variant/60"
                                    }`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-sm text-on-surface truncate">
                                                {cliente.nombre} {cliente.apellido || ""}
                                            </span>
                                            {isSelected && (
                                                <span className="material-symbols-outlined text-primary text-[18px]">
                                                    check_circle
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-on-surface-variant mt-0.5 truncate">
                                            {cliente.telefono ? `Tel: ${cliente.telefono}` : "Sin teléfono"}
                                            {cliente.direccion ? ` · ${cliente.direccion}` : ""}
                                        </p>
                                    </div>

                                    {/* Indicador de Saldo / Deuda */}
                                    <div className="text-right shrink-0 ml-3">
                                        <span
                                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                                tieneDeuda
                                                    ? "bg-error-container text-on-error-container"
                                                    : "bg-secondary-fixed text-on-secondary-fixed"
                                            }`}
                                        >
                                            {tieneDeuda
                                                ? `Deuda: $${saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`
                                                : "Al día ($0.00)"}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer modal */}
                <div className="flex justify-end pt-2 border-t border-outline-variant/20">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-medium text-on-surface-variant hover:bg-surface-container transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </Modal>
    );
}
