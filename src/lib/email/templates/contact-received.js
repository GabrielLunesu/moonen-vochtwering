export function contactReceivedEmail({ name }) {
  const subject = 'Wij hebben uw bericht ontvangen | Moonen Vochtwering';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        <p style="font-size: 16px; color: #333;">Bedankt voor uw bericht. Wij hebben uw aanvraag in goede orde ontvangen.</p>
        <p style="font-size: 16px; color: #333;">Wij nemen zo snel mogelijk contact met u op, meestal binnen 24 uur op werkdagen.</p>
        <p style="font-size: 14px; color: #666; margin-top: 24px;">Heeft u dringende vragen? Bel ons gerust op <a href="tel:+31618162515" style="color: #355b23; font-weight: 600;">06 18 16 25 15</a>.</p>
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

Bedankt voor uw bericht. Wij hebben uw aanvraag in goede orde ontvangen.

Wij nemen zo snel mogelijk contact met u op, meestal binnen 24 uur op werkdagen.

Heeft u dringende vragen? Bel ons op 06 18 16 25 15.

Met vriendelijke groet,
Moonen Vochtwering
06 18 16 25 15`;

  return { subject, html, text };
}
