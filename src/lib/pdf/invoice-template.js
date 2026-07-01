import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import { getInvoiceDueDate, INVOICE_PAYMENT_TERM_LABEL } from '@/lib/utils/invoice-dates';

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
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 30,
    fontSize: 9.4,
    color: COLORS.text,
    lineHeight: 1.3,
  },
  topStripe: {
    height: 7,
    backgroundColor: COLORS.primary,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  logoWrap: {
    width: 220,
    minHeight: 44,
    justifyContent: 'center',
  },
  logoImage: {
    width: 44,
    height: 44,
    objectFit: 'contain',
  },
  logoFallback: {
    fontSize: 20,
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
    fontSize: 8.4,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.primaryDark,
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 8,
    marginBottom: 8,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
    marginBottom: 8,
  },
  detailsCard: {
    flex: 1,
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 9,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
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
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryDark,
    color: COLORS.white,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8.6,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: 'row',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8.8,
    alignItems: 'flex-start',
  },
  colDescription: {
    flex: 4.2,
    paddingRight: 8,
    lineHeight: 1.35,
  },
  lineMeta: {
    marginTop: 2,
    fontSize: 7.8,
    color: COLORS.muted,
    lineHeight: 1.3,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
  },
  totalsBox: {
    width: 235,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 8,
    backgroundColor: COLORS.white,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    fontSize: 8.8,
  },
  totalRowDiscount: {
    color: COLORS.primaryDark,
  },
  totalFinal: {
    marginTop: 3,
    paddingTop: 5,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  totalFinalLabel: {
    fontSize: 9.4,
    fontWeight: 700,
    color: COLORS.primaryDark,
  },
  totalFinalValue: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.primaryDark,
  },
  paymentBox: {
    width: 280,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    backgroundColor: COLORS.primarySoft,
    padding: 9,
  },
  paymentHeading: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
    marginBottom: 5,
  },
  paymentIban: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  paymentDetail: {
    fontSize: 8.8,
    color: COLORS.text,
    marginBottom: 2,
    lineHeight: 1.3,
  },
  notesBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 8,
  },
  notesText: {
    fontSize: 8.8,
    lineHeight: 1.3,
  },
  footer: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 6,
    fontSize: 7.8,
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

function getLineGuaranteeYears(item) {
  const parsed = Number(item?.garantie_jaren ?? item?.guarantee_years);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasPerLineGuarantee(lineItems = []) {
  return lineItems.some((item) => {
    const scope = item?.guaranteeScope ?? item?.garantie_scope ?? item?.guarantee_scope;
    return scope === 'per_line' || (scope !== 'global' && item.guaranteeYears != null);
  });
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
        guaranteeYears: getLineGuaranteeYears(item),
        guaranteeScope: item.garantie_scope ?? item.guarantee_scope ?? null,
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
      guaranteeYears: null,
      guaranteeScope: null,
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
  const issueDate = invoice?.issue_date;
  const originalQuoteNumber =
    invoice?.original_quote_number ||
    invoice?.quote_number ||
    invoice?.quotes?.quote_number ||
    null;

  // All stored prices are incl. BTW — back-calculate excl. BTW and BTW amount
  const exclBtw = roundMoney(totalIncl / btwDivisor);
  const btwAmount = roundMoney(toNumber(invoice?.btw_amount, 0) || (totalIncl - exclBtw));

  // Subtotal excl. BTW (before discount)
  const subtotalExcl = roundMoney(subtotalIncl / btwDivisor);
  // Discount excl. BTW for display
  const discountAmountExcl = roundMoney(discountAmount / btwDivisor);

  const customerCity = `${invoice?.customer_postcode || ''} ${invoice?.customer_plaatsnaam || ''}`.trim();
  const lineItems = buildLineItems(invoice);
  const perLineGuarantee = hasPerLineGuarantee(lineItems);
  const globalGuaranteeYears = perLineGuarantee
    ? null
    : lineItems.find((item) => item.guaranteeYears != null)?.guaranteeYears ?? null;

  return {
    invoiceNumber: invoice?.invoice_number || 'CONCEPT',
    originalQuoteNumber,
    issueDateLabel: formatDate(issueDate),
    dueDateLabel: formatDate(getInvoiceDueDate(issueDate)),
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
    betaling: invoice?.betaling || INVOICE_PAYMENT_TERM_LABEL,
    perLineGuarantee,
    globalGuarantee: globalGuaranteeYears != null ? `${globalGuaranteeYears} jaar` : null,
    notes: invoice?.notes || null,
    lineItems,
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

        <View style={styles.detailsRow} wrap={false}>
          {/* Invoice details card */}
          <View style={[styles.card, styles.detailsCard]}>
            <Text style={styles.cardTitle}>Factuurgegevens</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Factuurnummer</Text>
              <Text style={styles.infoValue}>{data.invoiceNumber}</Text>
            </View>
            {data.originalQuoteNumber ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Offertenummer</Text>
                <Text style={styles.infoValue}>{data.originalQuoteNumber}</Text>
              </View>
            ) : null}
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
          <View style={[styles.card, styles.detailsCard]}>
            <Text style={styles.cardTitle}>Aan</Text>
            <Text style={{ fontSize: 10, fontWeight: 700, lineHeight: 1.4, marginBottom: 2 }}>{data.customerName}</Text>
            {data.customerStreet ? <Text style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{data.customerStreet}</Text> : null}
            {data.customerCity ? <Text style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{data.customerCity}</Text> : null}
            {data.customerEmail ? <Text style={{ fontSize: 10, lineHeight: 1.4, marginBottom: 2 }}>{data.customerEmail}</Text> : null}
            {data.customerPhone ? <Text style={{ fontSize: 10, lineHeight: 1.4 }}>{data.customerPhone}</Text> : null}
          </View>
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
            <View style={styles.colDescription}>
              <Text>{item.description}</Text>
              {data.perLineGuarantee && item.guaranteeYears != null ? (
                <Text style={styles.lineMeta}>Garantie: {item.guaranteeYears} jaar</Text>
              ) : null}
            </View>
            <Text style={styles.colQty}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
          </View>
        ))}

        <View style={styles.summaryRow} wrap={false}>
          {/* Totals */}
          <View style={styles.totalsBox}>
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
          <View style={styles.paymentBox}>
            <Text style={styles.paymentHeading}>Betaling</Text>
            <Text style={styles.paymentIban}>{COMPANY.iban}</Text>
            <Text style={styles.paymentDetail}>t.n.v. {COMPANY.name}</Text>
            <Text style={styles.paymentDetail}>o.v.v. factuurnummer {data.invoiceNumber}</Text>
            <Text style={[styles.paymentDetail, { marginTop: 4 }]}>{data.betaling}</Text>
            {data.perLineGuarantee ? (
              <Text style={styles.paymentDetail}>Garantie: per regel zoals vermeld in de specificatie.</Text>
            ) : data.globalGuarantee ? (
              <Text style={styles.paymentDetail}>Garantie: {data.globalGuarantee}.</Text>
            ) : null}
          </View>
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
