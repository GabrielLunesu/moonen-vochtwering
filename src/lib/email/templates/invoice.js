export function invoiceEmail({ name, invoiceNumber, amount, pdfUrl, dueDate, overrides = {} }) {
  const subject = overrides.subject || `Factuur ${invoiceNumber} van Moonen Vochtwering`;

  const greeting = overrides.greeting || "Hierbij ontvangt u de factuur voor de uitgevoerde werkzaamheden.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">${greeting}</p>
        <p style="font-size: 14px; color: #666; margin: 4px 0 8px;">Factuurnummer: <strong>${invoiceNumber}</strong></p>
        <p style="font-size: 20px; color: #333; font-weight: 700; margin: 8px 0 16px;">Totaalbedrag: &euro; ${amount}</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Wij verzoeken u het bedrag voor <strong>${dueDate}</strong> over te maken.
        </p>
        ${pdfUrl ? `
        <div style="text-align: center; margin: 32px 0;">
          <a href="${pdfUrl}"
             style="background: #355b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block;">
            Bekijk de factuur (PDF)
          </a>
        </div>
        ` : ""}
        <div style="background: #f0f7ec; padding: 20px; margin: 24px 0; border-radius: 4px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 8px; font-weight: 600;">Betaalgegevens</p>
          <p style="font-size: 14px; color: #333; margin: 4px 0;">IBAN: <strong>NL25 INGB 0631 8262 11</strong></p>
          <p style="font-size: 14px; color: #333; margin: 4px 0;">T.n.v.: <strong>Moonen Vochtwering</strong></p>
          <p style="font-size: 14px; color: #333; margin: 4px 0;">Referentie: <strong>${invoiceNumber}</strong></p>
        </div>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Heeft u vragen over deze factuur? Neem gerust contact met ons op via telefoon of e-mail.
        </p>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Met vriendelijke groet,<br/>
          Moonen Vochtwering
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Dorpstraat 25, 6441 CB Brunssum | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

${greeting}

Factuurnummer: ${invoiceNumber}
Totaalbedrag: ${amount}

Wij verzoeken u het bedrag voor ${dueDate} over te maken.

${pdfUrl ? `Bekijk de factuur: ${pdfUrl}` : ''}

Betaalgegevens:
IBAN: NL25 INGB 0631 8262 11
T.n.v.: Moonen Vochtwering
Referentie: ${invoiceNumber}

Heeft u vragen over deze factuur? Neem gerust contact met ons op.

Met vriendelijke groet,
Moonen Vochtwering
06 18 16 25 15`;

  return { subject, html, text };
}
