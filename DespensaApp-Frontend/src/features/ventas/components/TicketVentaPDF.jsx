// features/ventas/components/TicketVentaPDF.jsx
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: { padding: 14, fontSize: 9, fontFamily: 'Helvetica' },
    center: { textAlign: 'center' },
    title: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
    small: { fontSize: 7, textAlign: 'center', marginBottom: 6 },
    bold: { fontFamily: 'Helvetica-Bold' },
    divider: { borderBottomWidth: 1, borderBottomStyle: 'dashed', marginVertical: 6 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    itemName: { fontFamily: 'Helvetica-Bold', marginTop: 3 },
    total: { fontSize: 11, fontFamily: 'Helvetica-Bold' },
    thanks: { textAlign: 'center', marginTop: 10 },
});

const money = (n) =>
    Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

// Laravel manda "2026-11-15 21:08:00": lo paso a formato ISO para que todos los navegadores lo lean igual
const fechaHora = (f) =>
    new Date(String(f).replace(' ', 'T')).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

const alto = (detalles = []) => 260 + detalles.length * 30;

export const TicketVentaPDF = ({ venta }) => {
    const esCredito = venta.tipo_venta === 'CUENTA_CORRIENTE';
    const cliente = venta.cliente
        ? `${venta.cliente.nombre} ${venta.cliente.apellido ?? ''}`.trim()
        : 'Consumidor Final';

    return (
        <Document title={`Ticket ${venta.id}`}>
            <Page size={[226, alto(venta.detalles)]} style={styles.page}>
                <Text style={styles.title}>DESPENSA APP</Text>
                <Text style={styles.center}>Comprobante de Venta</Text>
                <Text style={styles.small}>(Documento no válido como factura)</Text>

                <Text style={styles.bold}>
                    TICKET N°: #{String(venta.id).padStart(6, '0')}
                </Text>
                <Text>Fecha: {fechaHora(venta.created_at)}</Text>
                <Text>Vendedor: {venta.user?.name ?? '-'}</Text>
                <Text>Cliente: {cliente}</Text>
                <Text>
                    Condición: {esCredito ? 'Crédito (Cuenta Corriente)' : `Contado (${venta.medio_pago})`}
                </Text>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.bold}>CANT x PRECIO</Text>
                    <Text style={styles.bold}>SUBTOTAL</Text>
                </View>

                {(venta.detalles ?? []).map((d, i) => (
                    <View key={d.id ?? i} wrap={false}>
                        <Text style={styles.itemName}>{d.producto?.nombre ?? `Producto #${d.product_id}`}</Text>
                        <View style={styles.row}>
                            <Text>{d.cantidad} un. x {money(d.precio_unitario)}</Text>
                            <Text>{money(d.subtotal)}</Text>
                        </View>
                    </View>
                ))}

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.total}>TOTAL:</Text>
                    <Text style={styles.total}>{money(venta.total)}</Text>
                </View>

                {esCredito && venta.cliente?.saldo_cuenta_corriente !== undefined && (
                    <View style={[styles.row, { marginTop: 4 }]}>
                        <Text>Saldo Cta. Cte.:</Text>
                        <Text style={styles.bold}>{money(venta.cliente.saldo_cuenta_corriente)}</Text>
                    </View>
                )}

                <Text style={styles.thanks}>¡Gracias por su compra!</Text>
            </Page>
        </Document>
    );
};