import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const COLORS = {
  primary: '#8AAB4C',
  primaryDark: '#6E8E3A',
  primarySoft: '#EDF4DE',
  text: '#1F2937',
  muted: '#6B7280',
  border: '#DCE6C4',
  white: '#FFFFFF',
};

const COMPANY = {
  name: 'Moonen Vochtwering',
  street: 'Dorpstraat 25',
  city: '6441 CB Brunssum',
  phone: '06 18 16 25 15',
  email: 'info@moonenvochtwering.nl',
  kvk: '14090765',
  btw: 'NL001816013B68',
  iban: 'NL25 INGB 0631 8262 11',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 28,
    paddingHorizontal: 34,
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.35,
  },
  topStripe: {
    height: 9,
    backgroundColor: COLORS.primary,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  logoWrap: {
    width: 220,
    minHeight: 52,
    justifyContent: 'center',
  },
  logoImage: {
    width: 52,
    height: 52,
    objectFit: 'contain',
  },
  logoFallback: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.primaryDark,
  },
  companyMeta: {
    width: 190,
    alignItems: 'flex-end',
    gap: 2,
  },
  companyMetaLine: {
    color: COLORS.muted,
    fontSize: 9,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.primaryDark,
    marginBottom: 12,
    letterSpacing: 0.4,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 9,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 94,
    color: COLORS.muted,
    fontSize: 9,
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDark,
    color: COLORS.white,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 9,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 7,
    paddingHorizontal: 8,
    fontSize: 9.4,
    alignItems: 'flex-start',
  },
  colDescription: {
    flex: 4.2,
    paddingRight: 8,
    lineHeight: 1.35,
  },
  colQty: {
    flex: 1.4,
    textAlign: 'right',
    paddingRight: 6,
  },
  colPrice: {
    flex: 1.8,
    textAlign: 'right',
    paddingRight: 6,
  },
  colTotal: {
    flex: 1.9,
    textAlign: 'right',
  },
  totalsBox: {
    marginTop: 10,
    marginLeft: 'auto',
    width: 250,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 9,
    backgroundColor: COLORS.white,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    fontSize: 9.4,
  },
  totalRowDiscount: {
    color: COLORS.primaryDark,
  },
  totalFinal: {
    marginTop: 3,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalFinalLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.primaryDark,
  },
  totalFinalValue: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primaryDark,
  },
  paymentBox: {
    marginTop: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    backgroundColor: COLORS.primarySoft,
    padding: 12,
  },
  paymentHeading: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    marginBottom: 8,
  },
  paymentIban: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.primaryDark,
    marginBottom: 6,
  },
  paymentDetail: {
    fontSize: 9.4,
    color: COLORS.text,
    marginBottom: 3,
    lineHeight: 1.4,
  },
  notesBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 10,
  },
  notesText: {
    fontSize: 9.4,
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 6,
    fontSize: 8.2,
    color: COLORS.muted,
    textAlign: 'center',
  },
});

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundMoney(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(roundMoney(value));
}

function formatDate(value) {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function buildLineItems(invoice) {
  const btwPercentage = toNumber(invoice?.btw_percentage, 21);
  const btwDivisor = 1 + btwPercentage / 100;

  if (Array.isArray(invoice?.line_items) && invoice.line_items.length > 0) {
    return invoice.line_items.map((item, index) => {
      const quantity = toNumber(item.quantity, 0);
      const unitPriceIncl = toNumber(item.unit_price, 0);
      // Convert incl. BTW prices to excl. BTW for PDF display
      const unitPriceExcl = roundMoney(unitPriceIncl / btwDivisor);
      const rowTotalExcl = roundMoney(quantity * unitPriceExcl);
      return {
        id: `${index}`,
        description: item.description || 'Werkzaamheden',
        quantity,
        unit: item.unit || '',
        unitPrice: unitPriceExcl,
        total: rowTotalExcl,
      };
    });
  }

  // Fallback: single line item from totals
  const subtotalIncl = toNumber(invoice?.subtotal_incl, 0);
  const subtotalExcl = roundMoney(subtotalIncl / btwDivisor);
  return [
    {
      id: 'fallback',
      description: 'Werkzaamheden',
      quantity: 1,
      unit: 'stuk',
      unitPrice: subtotalExcl,
      total: subtotalExcl,
    },
  ];
}

function buildInvoiceData(invoice) {
  const btwPercentage = toNumber(invoice?.btw_percentage, 21);
  const btwDivisor = 1 + btwPercentage / 100;

  const subtotalIncl = roundMoney(toNumber(invoice?.subtotal_incl, 0));
  const discountAmount = roundMoney(toNumber(invoice?.discount_amount, 0));
  const discountType = invoice?.discount_type || null;
  const discountValue = toNumber(invoice?.discount_value, 0);
  const totalIncl = roundMoney(toNumber(invoice?.total_incl, 0) || (subtotalIncl - discountAmount));

  // All stored prices are incl. BTW — back-calculate excl. BTW and BTW amount
  const exclBtw = roundMoney(totalIncl / btwDivisor);
  const btwAmount = roundMoney(toNumber(invoice?.btw_amount, 0) || (totalIncl - exclBtw));

  // Subtotal excl. BTW (before discount)
  const subtotalExcl = roundMoney(subtotalIncl / btwDivisor);
  // Discount excl. BTW for display
  const discountAmountExcl = roundMoney(discountAmount / btwDivisor);

  const customerCity = `${invoice?.customer_postcode || ''} ${invoice?.customer_plaatsnaam || ''}`.trim();

  return {
    invoiceNumber: invoice?.invoice_number || 'CONCEPT',
    issueDateLabel: formatDate(invoice?.issue_date),
    dueDateLabel: formatDate(invoice?.due_date),
    customerName: invoice?.customer_name || 'Klant',
    customerStreet: invoice?.customer_straat || null,
    customerCity: customerCity || null,
    customerEmail: invoice?.customer_email || null,
    customerPhone: invoice?.customer_phone || null,
    subtotal: subtotalExcl,
    discountAmount: discountAmountExcl,
    discountType,
    discountValue,
    btwPercentage,
    btwAmount,
    totalIncl,
    betaling: invoice?.betaling || `Gelieve het totaalbedrag binnen 14 dagen over te maken op onderstaand rekeningnummer.`,
    notes: invoice?.notes || null,
    lineItems: buildLineItems(invoice),
  };
}

export function InvoiceDocument({ invoice, logoDataUri = null, fontFamily = 'Helvetica' }) {
  const data = buildInvoiceData(invoice);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily }]} wrap>
        <View style={styles.topStripe} />

        {/* Header: logo + company meta */}
        <View style={styles.headerRow}>
          <View style={styles.logoWrap}>
            {logoDataUri ? (
              <Image src={logoDataUri} style={styles.logoImage} alt="Moonen Vochtwering logo" />
            ) : (
              <Text style={styles.logoFallback}>{COMPANY.name}</Text>
            )}
          </View>
          <View style={styles.companyMeta}>
            <Text style={styles.companyMetaLine}>{COMPANY.street}</Text>
            <Text style={styles.companyMetaLine}>{COMPANY.city}</Text>
            <Text style={styles.companyMetaLine}>{COMPANY.phone}</Text>
            <Text style={styles.companyMetaLine}>{COMPANY.email}</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Factuur</Text>

        {/* Invoice details card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Factuurgegevens</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Factuurnummer</Text>
            <Text style={styles.infoValue}>{data.invoiceNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Factuurdatum</Text>
            <Text style={styles.infoValue}>{data.issueDateLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Vervaldatum</Text>
            <Text style={styles.infoValue}>{data.dueDateLabel}</Text>
          </View>
        </View>

        {/* Customer card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aan</Text>
          <Text style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.4, marginBottom: 2 }}>{data.customerName}</Text>
          {data.customerStreet ? <Text style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{data.customerStreet}</Text> : null}
          {data.customerCity ? <Text style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{data.customerCity}</Text> : null}
          {data.customerEmail ? <Text style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{data.customerEmail}</Text> : null}
          {data.customerPhone ? <Text style={{ fontSize: 10, lineHeight: 1.4 }}>{data.customerPhone}</Text> : null}
        </View>

        {/* Line items table */}
        <Text style={styles.sectionTitle}>Specificatie</Text>

        <View style={styles.tableHeader} wrap={false}>
          <Text style={styles.colDescription}>Omschrijving</Text>
          <Text style={styles.colQty}>Aantal</Text>
          <Text style={styles.colPrice}>Prijs</Text>
          <Text style={styles.colTotal}>Bedrag</Text>
        </View>

        {data.lineItems.map((item) => (
          <View key={item.id} style={styles.tableRow} wrap={false}>
            <Text style={styles.colDescription}>{item.description}</Text>
            <Text style={styles.colQty}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsBox} wrap={false}>
          <View style={styles.totalRow}>
            <Text>Subtotaal</Text>
            <Text>{formatCurrency(data.subtotal)}</Text>
          </View>
          {data.discountAmount > 0 ? (
            <View style={[styles.totalRow, styles.totalRowDiscount]}>
              <Text>
                Korting{data.discountType === 'percentage' ? ` (${data.discountValue}%)` : ''}
              </Text>
              <Text>-{formatCurrency(data.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>BTW ({data.btwPercentage}%)</Text>
            <Text>{formatCurrency(data.btwAmount)}</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>Totaal incl. BTW</Text>
            <Text style={styles.totalFinalValue}>{formatCurrency(data.totalIncl)}</Text>
          </View>
        </View>

        {/* Payment info */}
        <View style={styles.paymentBox} wrap={false}>
          <Text style={styles.paymentHeading}>Betaling</Text>
          <Text style={styles.paymentIban}>{COMPANY.iban}</Text>
          <Text style={styles.paymentDetail}>t.n.v. {COMPANY.name}</Text>
          <Text style={styles.paymentDetail}>o.v.v. factuurnummer {data.invoiceNumber}</Text>
          <Text style={[styles.paymentDetail, { marginTop: 4 }]}>{data.betaling}</Text>
        </View>

        {/* Notes (optional) */}
        {data.notes ? (
          <View style={styles.notesBox} wrap={false}>
            <Text style={styles.cardTitle}>Opmerking</Text>
            <Text style={styles.notesText}>{data.notes}</Text>
          </View>
        ) : null}

        {/* Footer */}
        <Text style={styles.footer}>
          KVK {COMPANY.kvk} | BTW {COMPANY.btw} | IBAN {COMPANY.iban}
        </Text>
      </Page>
    </Document>
  );
}
