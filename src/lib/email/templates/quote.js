export function quoteEmail({ name, amount, responseUrl, pdfUrl, quoteNumber, overrides = {} }) {
  const subject = overrides.subject || "Uw offerte van Moonen Vochtwering";

  const formattedAmount = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(amount);

  const greeting = overrides.greeting || "Naar aanleiding van onze inspectie hebben wij een offerte voor u opgesteld.";
  const body = overrides.body || "Wat wilt u doen?";
  const ctaLabel = overrides.cta_label || "Akkoord";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        <p style="font-size: 16px; color: #333;">${greeting}</p>
        ${quoteNumber ? `<p style="font-size: 14px; color: #666; margin: 0;">Offertenummer: <strong>${quoteNumber}</strong></p>` : ""}
        <div style="background: #f0f7ec; border-left: 4px solid #355b23; padding: 16px 20px; margin: 24px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0 0 4px 0; font-size: 14px; color: #666;">Offertebedrag (excl. BTW):</p>
          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #355b23;">${formattedAmount}</p>
        </div>
        ${pdfUrl ? `<p style="font-size: 14px; color: #666; margin-bottom: 24px;">
          <a href="${pdfUrl}" style="color: #355b23;">Download de volledige offerte als PDF</a>
        </p>` : ""}
        <p style="font-size: 16px; color: #333; margin-bottom: 24px;">${body}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${responseUrl}&response=akkoord"
             style="background: #355b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block; margin: 0 8px 12px;">
            ${ctaLabel}
          </a>
          <a href="${responseUrl}&response=vraag"
             style="background: #ffffff; color: #355b23; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block; border: 2px solid #355b23; margin: 0 8px 12px;">
            Ik heb een vraag
          </a>
        </div>
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

${greeting}

Offertebedrag (excl. BTW): ${formattedAmount}
${quoteNumber ? `Offertenummer: ${quoteNumber}` : ''}

Ga naar de volgende link om te reageren:
${responseUrl}

Met vriendelijke groet,
Moonen Vochtwering
06 18 16 25 15`;

  return { subject, html, text };
}
