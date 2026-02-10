import React from 'react';
import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const COLORS = {
  primary: '#1A2B3C',
  accent: '#D4793A',
  lightBg: '#F5F0EB',
  text: '#2C2C2C',
  muted: '#6B7280',
  border: '#E5E2DD',
  white: '#FFFFFF',
};

const COMPANY = {
  name: 'Moonen Vochtwering',
  street: 'Grasbroekerweg 141',
  city: '6412 BD Heerlen',
  phone: '06 18 16 25 15',
  email: 'info@moonenvochtwering.nl',
  kvk: '14090765',
  btw: 'NL001816013B68',
  iban: 'NL25 INGB 0631 8262 11',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 36,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
  },
  topBar: {
    height: 8,
    backgroundColor: COLORS.primary,
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  logoWrap: {
    width: 180,
    minHeight: 48,
    justifyContent: 'center',
  },
  logoImage: {
    width: 170,
    height: 44,
    objectFit: 'contain',
  },
  logoFallback: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.primary,
  },
  companyInfo: {
    width: 190,
    alignItems: 'flex-end',
    gap: 1,
  },
  companyLine: {
    color: COLORS.muted,
    fontSize: 9,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: COLORS.primary,
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  block: {
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    marginBottom: 10,
  },
  blockTitle: {
    fontSize: 9,
    color: COLORS.muted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoGrid: {
    flexDirection: 'row',
  },
  infoCol: {
    flex: 1,
    paddingRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 88,
    color: COLORS.muted,
    fontSize: 9,
  },
  value: {
    flex: 1,
    fontSize: 10,
    fontWeight: 600,
  },
  introText: {
    lineHeight: 1.4,
    marginBottom: 10,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightBg,
    padding: 12,
    marginTop: 8,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryRow: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  summaryLabel: {
    width: 95,
    color: COLORS.muted,
    fontSize: 9,
  },
  summaryValue: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.4,
  },
  totalBox: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.accent,
    backgroundColor: COLORS.white,
    padding: 8,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 9,
    color: COLORS.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 700,
    color: COLORS.accent,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
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
    fontSize: 9.5,
    alignItems: 'center',
  },
  colDescription: { flex: 3.2, paddingRight: 8 },
  colQty: { flex: 1.1, textAlign: 'right', paddingRight: 6 },
  colPrice: { flex: 1.3, textAlign: 'right', paddingRight: 6 },
  colTotal: { flex: 1.4, textAlign: 'right' },
  totalsWrap: {
    marginTop: 10,
    marginLeft: 250,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalsFinal: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderColor: COLORS.border,
  },
  totalsFinalLabel: {
    color: COLORS.primary,
    fontWeight: 700,
    fontSize: 10,
  },
  totalsFinalValue: {
    color: COLORS.accent,
    fontWeight: 700,
    fontSize: 12,
  },
  photosWrap: {
    marginTop: 14,
    marginBottom: 12,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  photoCard: {
    width: '50%',
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  photoImage: {
    width: '100%',
    height: 126,
    borderWidth: 1,
    borderColor: COLORS.border,
    objectFit: 'cover',
  },
  photoCaption: {
    fontSize: 8.5,
    color: COLORS.muted,
    marginTop: 4,
  },
  termsWrap: {
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.lightBg,
    padding: 10,
    marginBottom: 12,
  },
  termItem: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  closingText: {
    fontSize: 9.5,
    lineHeight: 1.45,
    marginBottom: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    paddingTop: 6,
    fontSize: 8,
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

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function buildLineItems(lead, inspectionData, subtotal) {
  if (Array.isArray(inspectionData?.line_items) && inspectionData.line_items.length > 0) {
    return inspectionData.line_items.map((item, index) => {
      const quantity = toNumber(item.quantity, 0);
      const unitPrice = toNumber(item.unit_price, 0);
      const rowTotal = roundMoney(item.total ?? quantity * unitPrice);
      return {
        id: `${index}`,
        description: item.description || 'Werkzaamheden',
        quantity,
        unit: item.unit || '',
        unitPrice,
        total: rowTotal,
      };
    });
  }

  return [
    {
      id: 'fallback',
      description: lead?.oplossing || 'Vochtwering werkzaamheden',
      quantity: toNumber(lead?.oppervlakte_m2, 1),
      unit: lead?.oppervlakte_m2 ? 'm²' : 'stuk',
      unitPrice: roundMoney(subtotal / Math.max(1, toNumber(lead?.oppervlakte_m2, 1))),
      total: roundMoney(subtotal),
    },
  ];
}

function buildPhotoRows(lead, inspectionData) {
  const source = Array.isArray(lead?.photos) ? lead.photos : [];
  const captions = Array.isArray(inspectionData?.photo_captions) ? inspectionData.photo_captions : [];

  return source
    .filter((url) => typeof url === 'string' && /^https?:\/\//i.test(url))
    .slice(0, 4)
    .map((url, index) => ({
      url,
      caption: captions[index] || `Inspectiefoto ${index + 1}`,
    }));
}

function buildQuoteData(lead) {
  const inspectionData = lead?.inspection_data_v2 || {};
  const subtotal = roundMoney(inspectionData?.subtotal ?? lead?.quote_amount ?? 0);
  const discountAmount = roundMoney(toNumber(inspectionData?.discount_amount, 0));
  const discountType = inspectionData?.discount_type || null;
  const discountValue = toNumber(inspectionData?.discount_value, 0);
  const discountedSubtotal = roundMoney(subtotal - discountAmount);
  const btwPercentage = toNumber(inspectionData?.btw_percentage, 21);
  const btwAmount = roundMoney(inspectionData?.btw_amount ?? (discountedSubtotal * btwPercentage) / 100);
  const totalIncl = roundMoney(inspectionData?.total_incl_btw ?? discountedSubtotal + btwAmount);
  const issueDate = lead?.quote_sent_at ? new Date(lead.quote_sent_at) : new Date();
  const validityDays = Math.max(1, Math.trunc(toNumber(inspectionData?.geldigheid_dagen, 30)));
  const validUntil = addDays(issueDate, validityDays);
  const fallbackQuoteSuffix = (lead?.id || '').replaceAll('-', '').slice(0, 4).toUpperCase() || '0001';
  const quoteNumber =
    lead?.quote_number ||
    `MV-${issueDate.getFullYear()}-${fallbackQuoteSuffix}`;

  return {
    quoteNumber,
    issueDateLabel: formatDate(issueDate),
    validUntilLabel: formatDate(validUntil),
    customerName: lead?.name || 'Klant',
    customerAddress: `${lead?.plaatsnaam || ''} ${lead?.postcode || ''}`.trim(),
    diagnosis: inspectionData?.diagnose || lead?.diagnose || 'n.v.t.',
    diagnosisDetails: inspectionData?.diagnose_details || null,
    solution: inspectionData?.oplossing || lead?.oplossing || 'n.v.t.',
    areaLabel: lead?.oppervlakte_m2 || inspectionData?.oppervlakte_m2
      ? `${toNumber(lead?.oppervlakte_m2 ?? inspectionData?.oppervlakte_m2, 0)} m²`
      : 'n.v.t.',
    timeline: inspectionData?.doorlooptijd || '3 werkdagen',
    guarantee: `${toNumber(inspectionData?.garantie_jaren, 5)} jaar`,
    paymentTerms: inspectionData?.betaling || '40% bij opdracht, 60% na oplevering',
    subtotal,
    discountAmount,
    discountType,
    discountValue,
    btwPercentage,
    btwAmount,
    totalIncl,
    notes: inspectionData?.notes || lead?.inspection_notes || null,
    lineItems: buildLineItems(lead, inspectionData, subtotal),
    photos: buildPhotoRows(lead, inspectionData),
  };
}

export function QuoteDocument({ lead, logoDataUri = null }) {
  const quote = buildQuoteData(lead);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />

        <View style={styles.headerRow}>
          <View style={styles.logoWrap}>
            {logoDataUri ? (
              <Image src={logoDataUri} style={styles.logoImage} alt="Moonen Vochtwering logo" />
            ) : (
              <Text style={styles.logoFallback}>{COMPANY.name}</Text>
            )}
          </View>
          <View style={styles.companyInfo}>
            <Text style={styles.companyLine}>{COMPANY.street}</Text>
            <Text style={styles.companyLine}>{COMPANY.city}</Text>
            <Text style={styles.companyLine}>{COMPANY.phone}</Text>
            <Text style={styles.companyLine}>{COMPANY.email}</Text>
          </View>
        </View>

        <Text style={styles.title}>OFFERTE</Text>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Offertegegevens</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoCol}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Offertenummer</Text>
                <Text style={styles.value}>{quote.quoteNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Datum</Text>
                <Text style={styles.value}>{quote.issueDateLabel}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Geldig tot</Text>
                <Text style={styles.value}>{quote.validUntilLabel}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Aan</Text>
          <Text style={styles.value}>{quote.customerName}</Text>
          <Text>{quote.customerAddress}</Text>
          {lead?.email ? <Text>{lead.email}</Text> : null}
          {lead?.phone ? <Text>{lead.phone}</Text> : null}
        </View>

        <View style={styles.block}>
          <Text style={styles.blockTitle}>Betreft</Text>
          <Text style={styles.value}>{quote.solution}</Text>
          <Text style={styles.introText}>
            Naar aanleiding van onze inspectie bieden wij u hieronder de werkzaamheden aan voor een
            duurzame vochtoplossing.
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Samenvatting</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Diagnose</Text>
            <Text style={styles.summaryValue}>{quote.diagnosis}</Text>
          </View>
          {quote.diagnosisDetails ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Details</Text>
              <Text style={styles.summaryValue}>{quote.diagnosisDetails}</Text>
            </View>
          ) : null}
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Oplossing</Text>
            <Text style={styles.summaryValue}>{quote.solution}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Oppervlakte</Text>
            <Text style={styles.summaryValue}>{quote.areaLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Doorlooptijd</Text>
            <Text style={styles.summaryValue}>{quote.timeline}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Garantie</Text>
            <Text style={styles.summaryValue}>{quote.guarantee}</Text>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Totaal incl. BTW</Text>
            <Text style={styles.totalValue}>{formatCurrency(quote.totalIncl)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          KVK {COMPANY.kvk} | BTW {COMPANY.btw} | IBAN {COMPANY.iban}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <View style={styles.topBar} />
        <Text style={styles.sectionTitle}>Prijsopgave</Text>

        <View style={styles.tableHead}>
          <Text style={styles.colDescription}>Omschrijving</Text>
          <Text style={styles.colQty}>Hvl</Text>
          <Text style={styles.colPrice}>Prijs</Text>
          <Text style={styles.colTotal}>Bedrag</Text>
        </View>

        {quote.lineItems.map((item) => (
          <View key={item.id} style={styles.tableRow}>
            <Text style={styles.colDescription}>{item.description}</Text>
            <Text style={styles.colQty}>
              {item.quantity} {item.unit}
            </Text>
            <Text style={styles.colPrice}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.colTotal}>{formatCurrency(item.total)}</Text>
          </View>
        ))}

        <View style={styles.totalsWrap}>
          <View style={styles.totalsRow}>
            <Text>Subtotaal</Text>
            <Text>{formatCurrency(quote.subtotal)}</Text>
          </View>
          {quote.discountAmount > 0 ? (
            <View style={styles.totalsRow}>
              <Text>Korting{quote.discountType === 'percentage' ? ` (${quote.discountValue}%)` : ''}</Text>
              <Text>-{formatCurrency(quote.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalsRow}>
            <Text>BTW ({quote.btwPercentage}%)</Text>
            <Text>{formatCurrency(quote.btwAmount)}</Text>
          </View>
          <View style={[styles.totalsRow, styles.totalsFinal]}>
            <Text style={styles.totalsFinalLabel}>Totaal incl. BTW</Text>
            <Text style={styles.totalsFinalValue}>{formatCurrency(quote.totalIncl)}</Text>
          </View>
        </View>

        {quote.photos.length > 0 ? (
          <View style={styles.photosWrap}>
            <Text style={styles.sectionTitle}>Inspectiefoto&apos;s</Text>
            <View style={styles.photosGrid}>
              {quote.photos.map((photo) => (
                <View key={photo.url} style={styles.photoCard}>
                  <Image src={photo.url} style={styles.photoImage} alt={photo.caption} />
                  <Text style={styles.photoCaption}>{photo.caption}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Voorwaarden</Text>
        <View style={styles.termsWrap}>
          <Text style={styles.termItem}>• Prijzen zijn vast en all-inclusive.</Text>
          <Text style={styles.termItem}>• Geen meerwerk zonder voorafgaand overleg.</Text>
          <Text style={styles.termItem}>• Betaling: {quote.paymentTerms}.</Text>
          <Text style={styles.termItem}>• Start werkzaamheden in overleg, doorgaans binnen 2-4 weken.</Text>
          <Text style={styles.termItem}>• Garantie: {quote.guarantee} op waterdichtheid.</Text>
        </View>

        <Text style={styles.closingText}>
          Wij hopen u een passend aanbod te hebben gedaan en lichten dit graag toe bij vragen.
        </Text>
        <Text style={styles.closingText}>Met vriendelijke groet,</Text>
        <Text style={styles.closingText}>Moonen Vochtwering</Text>
        {quote.notes ? <Text style={[styles.closingText, { marginTop: 8 }]}>Notitie: {quote.notes}</Text> : null}

        <Text style={styles.footer}>
          {COMPANY.name} | {COMPANY.street}, {COMPANY.city} | {COMPANY.phone} | {COMPANY.email}
        </Text>
      </Page>
    </Document>
  );
}
