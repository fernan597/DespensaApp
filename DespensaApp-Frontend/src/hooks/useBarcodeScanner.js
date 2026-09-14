import { useEffect, useRef } from "react";

/**
 * Custom Hook para capturar eventos de pistola lectora de código de barras.
 * Las pistolas lectoras emulan un teclado USB enviando caracteres a alta velocidad (< 50ms)
 * y finalizando habitualmente con la tecla "Enter".
 *
 * @param {Function} onScan - Callback ejecutado con el código escaneado: (barcode: string) => void
 * @param {Object} options - Opciones de configuración
 * @param {number} [options.minChars=3] - Longitud mínima del código para considerarlo válido
 * @param {number} [options.maxInterval=60] - Intervalo máximo (en ms) entre pulsaciones para considerarlo escáner
 * @param {boolean} [options.enabled=true] - Permite activar o desactivar la escucha
 * @param {boolean} [options.preventDefault=true] - Prevenir el comportamiento por defecto de Enter si es un escaneo
 */
export function useBarcodeScanner(onScan, options = {}) {
    const {
        minChars = 3,
        maxInterval = 60,
        enabled = true,
        preventDefault = true,
    } = options;

    const bufferRef = useRef("");
    const lastKeyTimeRef = useRef(0);
    const timeoutRef = useRef(null);
    const onScanRef = useRef(onScan);

    // Mantener la referencia más reciente de onScan sin provocar re-renders ni re-suscripciones
    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e) => {
            // Ignorar teclas modificadoras
            if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab"].includes(e.key)) {
                return;
            }

            const currentTime = Date.now();
            const timeDiff = currentTime - lastKeyTimeRef.current;
            lastKeyTimeRef.current = currentTime;

            // Si pasó más tiempo que el umbral y ya había caracteres acumulados,
            // se descarta el buffer previo (ya que probablemente fue escritura manual)
            if (timeDiff > maxInterval && bufferRef.current.length > 0) {
                bufferRef.current = "";
            }

            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            // Al presionar Enter, verificar si lo acumulado cumple con el patrón de código de barras
            if (e.key === "Enter") {
                const scannedCode = bufferRef.current.trim();
                if (scannedCode.length >= minChars) {
                    if (preventDefault) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    if (onScanRef.current) {
                        onScanRef.current(scannedCode);
                    }
                }
                bufferRef.current = "";
                return;
            }

            // Acumular caracteres imprimibles simples
            if (e.key.length === 1) {
                bufferRef.current += e.key;

                // Limpieza automática por timeout si la secuencia queda incompleta
                timeoutRef.current = setTimeout(() => {
                    bufferRef.current = "";
                }, maxInterval * 3);
            }
        };

        window.addEventListener("keydown", handleKeyDown, true);

        return () => {
            window.removeEventListener("keydown", handleKeyDown, true);
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [enabled, minChars, maxInterval, preventDefault]);
}
