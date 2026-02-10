export function confirmationEmail({ name, date, time, siteUrl, token, overrides = {} }) {
  const subject = overrides.subject || "Bevestiging vochtinspectie | Moonen Vochtwering";

  const formattedDate = new Date(date).toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = overrides.greeting || "Uw vochtinspectie is bevestigd!";
  const body = overrides.body || "Onze specialist komt bij u langs om de situatie te beoordelen. De inspectie is geheel gratis en vrijblijvend.";

  const manageUrl = siteUrl && token ? `${siteUrl}/afspraak?token=${token}` : null;

  const manageLinkHtml = manageUrl
    ? `<div style="text-align: center; margin: 24px 0;">
        <a href="${manageUrl}"
           style="color: #355b23; font-size: 14px; text-decoration: underline;">
          Afspraak verzetten of annuleren
        </a>
      </div>
      <p style="font-size: 14px; color: #666;">Of bel ons op <a href="tel:+31618162515" style="color: #355b23;">06 18 16 25 15</a>.</p>`
    : `<p style="font-size: 14px; color: #666;">Heeft u vragen of wilt u de afspraak wijzigen? Bel ons op <a href="tel:+31618162515" style="color: #355b23;">06 18 16 25 15</a>.</p>`;

  const manageLinkText = manageUrl
    ? `Afspraak verzetten of annuleren: ${manageUrl}\nOf bel ons op 06 18 16 25 15.`
    : "Heeft u vragen of wilt u de afspraak wijzigen? Bel ons op 06 18 16 25 15.";

  const closing = overrides.closing ? `<p style="font-size: 14px; color: #666;">${overrides.closing}</p>` : manageLinkHtml;
  const closingText = overrides.closing || manageLinkText;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        <p style="font-size: 16px; color: #333;">${greeting}</p>
        <div style="background: #f0f7ec; border-left: 4px solid #355b23; padding: 16px 20px; margin: 24px 0; border-radius: 0 4px 4px 0;">
          <p style="margin: 0 0 8px 0; font-weight: 600; color: #333;">Datum: ${formattedDate}</p>
          <p style="margin: 0; font-weight: 600; color: #333;">Tijd: ${time}</p>
        </div>
        <p style="font-size: 16px; color: #333;">${body}</p>
        ${closing}
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

${greeting}

Datum: ${formattedDate}
Tijd: ${time}

${body}

${closingText}

Met vriendelijke groet,
Moonen Vochtwering`;

  return { subject, html, text };
}
