// features/compras/components/TicketCompraPDF.jsx
// features/compras/components/TicketCompraPDF.jsx
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
    footerNote: { textAlign: 'center', marginTop: 8, fontSize: 8 },
    signatureArea: { marginTop: 24, alignItems: 'center' },
    signatureLine: { borderBottomWidth: 1, borderBottomStyle: 'dashed', width: 140, marginBottom: 4 },
    signatureLabel: { fontSize: 7, color: '#333', textAlign: 'center' },
});

const money = (n) =>
    Number(n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

const fechaHora = (f) => {
    if (!f) return '-';
    return new Date(String(f).replace(' ', 'T')).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });
};

const alto = (detalles = []) => 300 + (detalles.length * 30);

export const TicketCompraPDF = ({ compra = {} }) => {
    const esCuentaCorriente =
        compra.tipo_pago === 'CUENTA_CORRIENTE' ||
        compra.tipo_pago === 'CREDITO' ||
        Boolean(compra.pendiente_pago);

    const proveedorNombre = compra.proveedor?.razon_social ?? 'Proveedor sin identificar';
    const detalles = compra.detalles ?? [];

    return (
        <Document title={`Ticket Compra #${compra.id ?? ''}`}>
            <Page size={[226, alto(detalles)]} style={styles.page}>
                <Text style={styles.title}>DESPENSA APP</Text>
                <Text style={styles.center}>Comprobante de Compra</Text>
                <Text style={styles.small}>(Documento no válido como factura)</Text>

                <Text style={styles.bold}>
                    TICKET N°: #{String(compra.id ?? 0).padStart(6, '0')}
                </Text>
                {Boolean(compra.numero_comprobante) && (
                    <Text>Comp. Proveedor: {compra.numero_comprobante}</Text>
                )}
                <Text>Fecha: {fechaHora(compra.created_at)}</Text>
                <Text>Receptor: {compra.user?.name ?? '-'}</Text>
                <Text>Proveedor: {proveedorNombre}</Text>
                <Text>
                    Condición: {esCuentaCorriente ? 'Cuenta Corriente (A pagar)' : 'Contado'}
                </Text>

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.bold}>CANT x COSTO</Text>
                    <Text style={styles.bold}>SUBTOTAL</Text>
                </View>

                {detalles.map((d, i) => {
                    const costo = d.costo_adquisicion ?? d.costo_unitario ?? 0;
                    const subtotal = d.subtotal ?? (Number(d.cantidad || 0) * Number(costo));
                    const nombreProducto = d.producto?.nombre ?? `Producto #${d.product_id ?? d.producto_id ?? (i + 1)}`;

                    return (
                        <View key={d.id ?? i} wrap={false}>
                            <Text style={styles.itemName}>{nombreProducto}</Text>
                            <View style={styles.row}>
                                <Text>{d.cantidad} un. x {money(costo)}</Text>
                                <Text>{money(subtotal)}</Text>
                            </View>
                        </View>
                    );
                })}

                <View style={styles.divider} />

                <View style={styles.row}>
                    <Text style={styles.total}>TOTAL:</Text>
                    <Text style={styles.total}>{money(compra.total)}</Text>
                </View>

                {esCuentaCorriente && compra.proveedor?.saldo_adeudado !== undefined && (
                    <View style={[styles.row, { marginTop: 4 }]}>
                        <Text>Saldo adeudado prov.:</Text>
                        <Text style={styles.bold}>{money(compra.proveedor.saldo_adeudado)}</Text>
                    </View>
                )}

                <Text style={styles.footerNote}>Mercadería ingresada a stock</Text>

                <View style={styles.signatureArea}>
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureLabel}>Firma y aclaración de recepción</Text>
                </View>
            </Page>
        </Document>
    );
};
