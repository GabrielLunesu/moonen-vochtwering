export function planInspectionEmail({ name, siteUrl, token, overrides = {} }) {
  const confirmUrl = `${siteUrl}/bevestig?token=${token}`;

  const subject = overrides.subject || "Plan uw gratis vochtinspectie | Moonen Vochtwering";
  const greeting = overrides.greeting || "Bedankt voor uw aanvraag.";
  const body = overrides.body || "Klik hieronder om direct een moment te kiezen voor uw gratis vochtinspectie. Onze specialist komt persoonlijk bij u langs om de situatie te beoordelen.";
  const ctaLabel = overrides.cta_label || "Inspectie inplannen";
  const closing = overrides.closing || "De inspectie duurt ongeveer 30-45 minuten en is geheel gratis en vrijblijvend. U zit nergens aan vast.";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        <p style="font-size: 16px; color: #333;">${greeting}</p>
        <p style="font-size: 16px; color: #333;">${body}</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}"
             style="background: #355b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block;">
            ${ctaLabel}
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">${closing}</p>
        <p style="font-size: 13px; color: #999; margin-top: 24px;">Lukt het niet via de knop? Kopieer dan deze link:<br><a href="${confirmUrl}" style="color: #355b23; word-break: break-all;">${confirmUrl}</a></p>
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

${greeting}

${body}

Plan uw inspectie via deze link:
${confirmUrl}

${closing}

Met vriendelijke groet,
Moonen Vochtwering
06 18 16 25 15`;

  return { subject, html, text };
}
