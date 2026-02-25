export function quoteEmail({ name, amount, responseUrl, pdfUrl, quoteNumber, overrides = {} }) {
  const subject = overrides.subject || "Uw offerte van Moonen Vochtwering";

  const greeting = overrides.greeting || "Naar aanleiding van ons bezoek hebben wij een offerte voor u opgesteld.";
  const body = overrides.body || "In de bijlage vindt u de volledige offerte als PDF. U kunt deze ook online bekijken via onderstaande link.";
  const ctaLabel = overrides.cta_label || "Akkoord — ik ga graag met u in zee";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        <p style="font-size: 16px; color: #333; line-height: 1.6;">${greeting}</p>
        ${quoteNumber ? `<p style="font-size: 14px; color: #666; margin: 4px 0 16px;">Offertenummer: <strong>${quoteNumber}</strong></p>` : ""}
        <p style="font-size: 16px; color: #333; line-height: 1.6;">${body}</p>
        ${pdfUrl ? `
        <div style="background: #f0f7ec; padding: 16px 20px; margin: 24px 0; border-radius: 4px; text-align: center;">
          <a href="${pdfUrl}" style="color: #355b23; font-size: 16px; font-weight: 600; text-decoration: underline;">
            Bekijk de offerte (PDF)
          </a>
        </div>
        ` : ""}
        <p style="font-size: 16px; color: #333; line-height: 1.6;">
          Bent u akkoord? Dan kunt u dat direct aangeven via de knop hieronder. Heeft u vragen? Ook dat kan — wij nemen dan zo snel mogelijk contact met u op.
        </p>
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
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Met vriendelijke groet,<br/>
          Moonen Vochtwering
        </p>
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

${greeting}
${quoteNumber ? `Offertenummer: ${quoteNumber}` : ''}

${body}

${pdfUrl ? `Bekijk de offerte: ${pdfUrl}` : ''}

Bent u akkoord? Ga naar de volgende link om te reageren:
${responseUrl}

Met vriendelijke groet,
Moonen Vochtwering
06 18 16 25 15`;

  return { subject, html, text };
}
