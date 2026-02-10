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
    width: 210,
    height: 48,
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
  },
  intro: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 1.45,
  },
  summaryWrap: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  summaryLeft: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    backgroundColor: COLORS.primarySoft,
    padding: 10,
  },
  summaryHeading: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.primaryDark,
    marginBottom: 7,
    textTransform: 'uppercase',
    letterSpacing: 0.35,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  summaryLabel: {
    width: 92,
    color: COLORS.muted,
    fontSize: 9,
  },
  summaryValue: {
    flex: 1,
    fontSize: 9.5,
    lineHeight: 1.35,
  },
  summaryRight: {
    width: 170,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    padding: 10,
    backgroundColor: COLORS.white,
  },
  moneyMeta: {
    fontSize: 8.5,
    color: COLORS.muted,
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  moneyValue: {
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.primaryDark,
    textAlign: 'right',
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
  photosSection: {
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
    height: 118,
    borderWidth: 1,
    borderColor: COLORS.border,
    objectFit: 'cover',
  },
  photoCaption: {
    fontSize: 8.5,
    color: COLORS.muted,
    marginTop: 4,
  },
  termsBox: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 3,
    backgroundColor: COLORS.primarySoft,
    padding: 10,
    marginBottom: 12,
  },
  term: {
    fontSize: 9.2,
    marginBottom: 4,
    lineHeight: 1.35,
  },
  closing: {
    fontSize: 9.5,
    lineHeight: 1.45,
    marginBottom: 2,
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
  const quoteNumber = lead?.quote_number || `MV-${issueDate.getFullYear()}-${fallbackQuoteSuffix}`;

  return {
    quoteNumber,
    issueDateLabel: formatDate(issueDate),
    validUntilLabel: formatDate(validUntil),
    customerName: lead?.name || 'Klant',
    customerAddress: `${lead?.plaatsnaam || ''} ${lead?.postcode || ''}`.trim(),
    customerEmail: lead?.email || null,
    customerPhone: lead?.phone || null,
    diagnosis: inspectionData?.diagnose || lead?.diagnose || 'n.v.t.',
    diagnosisDetails: inspectionData?.diagnose_details || null,
    solution: inspectionData?.oplossing || lead?.oplossing || 'n.v.t.',
    areaLabel:
      lead?.oppervlakte_m2 || inspectionData?.oppervlakte_m2
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

export function QuoteDocument({ lead, logoDataUri = null, fontFamily = 'Helvetica' }) {
  const quote = buildQuoteData(lead);

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily }]}>
        <View style={styles.topStripe} />

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

        <Text style={styles.title}>Offerte</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Offertegegevens</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Offertenummer</Text>
            <Text style={styles.infoValue}>{quote.quoteNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Datum</Text>
            <Text style={styles.infoValue}>{quote.issueDateLabel}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Geldig tot</Text>
            <Text style={styles.infoValue}>{quote.validUntilLabel}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Aan</Text>
          <Text style={styles.infoValue}>{quote.customerName}</Text>
          <Text>{quote.customerAddress}</Text>
          {quote.customerEmail ? <Text>{quote.customerEmail}</Text> : null}
          {quote.customerPhone ? <Text>{quote.customerPhone}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Betreft</Text>
          <Text style={styles.infoValue}>{quote.solution}</Text>
          <Text style={styles.intro}>
            Naar aanleiding van onze inspectie bieden wij u onderstaande werkzaamheden aan voor een
            duurzame oplossing tegen vochtproblemen.
          </Text>
        </View>

        <View style={styles.summaryWrap}>
          <View style={styles.summaryLeft}>
            <Text style={styles.summaryHeading}>Samenvatting</Text>
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
          </View>

          <View style={styles.summaryRight}>
            <Text style={styles.moneyMeta}>Totaal incl. BTW</Text>
            <Text style={styles.moneyValue}>{formatCurrency(quote.totalIncl)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          KVK {COMPANY.kvk} | BTW {COMPANY.btw} | IBAN {COMPANY.iban}
        </Text>
      </Page>

      <Page size="A4" style={[styles.page, { fontFamily }]}>
        <View style={styles.topStripe} />
        <Text style={styles.sectionTitle}>Prijsopgave</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.colDescription}>Omschrijving</Text>
          <Text style={styles.colQty}>Aantal</Text>
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

        <View style={styles.totalsBox}>
          <View style={styles.totalRow}>
            <Text>Subtotaal</Text>
            <Text>{formatCurrency(quote.subtotal)}</Text>
          </View>
          {quote.discountAmount > 0 ? (
            <View style={[styles.totalRow, styles.totalRowDiscount]}>
              <Text>
                Korting{quote.discountType === 'percentage' ? ` (${quote.discountValue}%)` : ''}
              </Text>
              <Text>-{formatCurrency(quote.discountAmount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text>BTW ({quote.btwPercentage}%)</Text>
            <Text>{formatCurrency(quote.btwAmount)}</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>Totaal incl. BTW</Text>
            <Text style={styles.totalFinalValue}>{formatCurrency(quote.totalIncl)}</Text>
          </View>
        </View>

        {quote.photos.length > 0 ? (
          <View style={styles.photosSection}>
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
        <View style={styles.termsBox}>
          <Text style={styles.term}>- Prijzen zijn vast en all-inclusive.</Text>
          <Text style={styles.term}>- Geen meerwerk zonder voorafgaand overleg.</Text>
          <Text style={styles.term}>- Betaling: {quote.paymentTerms}.</Text>
          <Text style={styles.term}>- Start werkzaamheden in overleg, doorgaans binnen 2-4 weken.</Text>
          <Text style={styles.term}>- Garantie: {quote.guarantee} op waterdichtheid.</Text>
        </View>

        <Text style={styles.closing}>
          Wij hopen u een passend aanbod te hebben gedaan en lichten dit graag toe bij vragen.
        </Text>
        <Text style={styles.closing}>Met vriendelijke groet,</Text>
        <Text style={styles.closing}>Moonen Vochtwering</Text>
        {quote.notes ? <Text style={[styles.closing, { marginTop: 8 }]}>Notitie: {quote.notes}</Text> : null}

        <Text style={styles.footer}>
          {COMPANY.name} | {COMPANY.street}, {COMPANY.city} | {COMPANY.phone} | {COMPANY.email}
        </Text>
      </Page>
    </Document>
  );
}
