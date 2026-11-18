import { pdf } from '@react-pdf/renderer';
import { TicketVentaPDF } from '../features/ventas/components/TicketVentaPDF';
import { TicketCompraPDF } from '../features/compras/components/TicketCompraPDF';

export const generarTicket = async (venta) => {
    const blob = await pdf(<TicketVentaPDF venta={venta} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
};

export const generarTicketCompra = async (compra) => {
    const blob = await pdf(<TicketCompraPDF compra={compra} />).toBlob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
}