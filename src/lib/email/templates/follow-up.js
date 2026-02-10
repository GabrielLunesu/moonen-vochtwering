export function followUpEmail({ name, followUpCount, responseUrl, overrides = {} }) {
  const subjects = [
    overrides.subject || `Herinnering: Uw offerte van Moonen Vochtwering`,
    `Nog even over uw offerte - Moonen Vochtwering`,
    `Laatste herinnering offerte - Moonen Vochtwering`,
  ];

  const messages = [
    // Day 2 — gentle
    `<p style="font-size: 16px; color: #333;">
      Wij willen u er even aan herinneren dat u een offerte van ons heeft ontvangen.
      Heeft u nog vragen? Wij helpen u graag.
    </p>`,
    // Day 5 — helpful
    `<p style="font-size: 16px; color: #333;">
      Wij merkten dat u nog niet heeft gereageerd op onze offerte.
      Misschien heeft u nog vragen of twijfelt u? Neem gerust contact op —
      wij denken graag met u mee.
    </p>`,
    // Day 10 — last
    `<p style="font-size: 16px; color: #333;">
      Dit is onze laatste herinnering over de offerte die wij u hebben gestuurd.
      Mocht u in de toekomst alsnog hulp nodig hebben, staan wij altijd voor u klaar.
    </p>`,
  ];

  const idx = Math.min(followUpCount, 2);
  const subject = subjects[idx];
  const ctaLabel = overrides.cta_label || 'Offerte accepteren';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        ${overrides.greeting && idx === 0 ? `<p style="font-size: 16px; color: #333;">${overrides.greeting} ${overrides.body || ''}</p>` : messages[idx]}
        <div style="text-align: center; margin: 32px 0;">
          <a href="${responseUrl}&response=akkoord"
             style="background: #355b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block; margin: 0 8px 12px;">
            ${ctaLabel}
          </a>
          <a href="tel:+31618162515"
             style="background: #ffffff; color: #355b23; padding: 12px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block; border: 2px solid #355b23; margin: 0 8px 12px;">
            Bel ons
          </a>
        </div>
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

${idx === 0 ? "Wij willen u er even aan herinneren dat u een offerte van ons heeft ontvangen. Heeft u nog vragen? Wij helpen u graag." : ""}${idx === 1 ? "Wij merkten dat u nog niet heeft gereageerd op onze offerte. Misschien heeft u nog vragen of twijfelt u? Neem gerust contact op." : ""}${idx === 2 ? "Dit is onze laatste herinnering over de offerte die wij u hebben gestuurd. Mocht u in de toekomst alsnog hulp nodig hebben, staan wij altijd voor u klaar." : ""}

Reageer via: ${responseUrl}

Of bel ons: 06 18 16 25 15

Met vriendelijke groet,
Moonen Vochtwering`;

  return { subject, html, text };
}
