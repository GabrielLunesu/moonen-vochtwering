export function confirmationEmail({ name, date, time, overrides = {} }) {
  const subject = overrides.subject || "Bevestiging vochtinspectie | Moonen Vochtwering";

  const formattedDate = new Date(date).toLocaleDateString("nl-NL", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const greeting = overrides.greeting || "Uw vochtinspectie is bevestigd!";
  const body = overrides.body || "Onze specialist komt bij u langs om de situatie te beoordelen. De inspectie is geheel gratis en vrijblijvend.";
  const closing = overrides.closing || 'Heeft u vragen of wilt u de afspraak wijzigen? Bel ons op <a href="tel:+31618162515" style="color: #355b23;">06 18 16 25 15</a>.';
  const closingText = overrides.closing || "Heeft u vragen of wilt u de afspraak wijzigen? Bel ons op 06 18 16 25 15.";

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
        <p style="font-size: 14px; color: #666;">${closing}</p>
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
