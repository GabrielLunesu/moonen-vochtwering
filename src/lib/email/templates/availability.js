function formatSlotDate(slotDate) {
  return new Date(`${slotDate}T12:00:00`).toLocaleDateString('nl-NL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function availabilityEmail({ name, confirmUrl, slots = [], overrides = {} }) {
  const subject = overrides.subject || "Gratis vochtinspectie - Kies uw moment | Moonen Vochtwering";
  const greeting = overrides.greeting || "Bedankt voor uw aanvraag. Wij komen graag bij u langs voor een gratis vochtinspectie.";
  const body = overrides.body || "Klik op de knop hieronder om een geschikt moment te kiezen:";
  const ctaLabel = overrides.cta_label || "Moment kiezen";
  const closing = overrides.closing || "De inspectie duurt ongeveer 30-45 minuten en is geheel gratis en vrijblijvend.";

  const topSlots = slots.slice(0, 4);

  const slotListHtml = topSlots.length
    ? `<ul style="margin: 0; padding-left: 20px; color: #333; font-size: 15px; line-height: 1.6;">
        ${topSlots
          .map(
            (slot) =>
              `<li><strong>${formatSlotDate(slot.slot_date)}</strong> om ${slot.slot_time}</li>`
          )
          .join('')}
      </ul>`
    : '<p style="font-size: 15px; color: #333; margin: 0;">Er zijn momenteel geen momenten beschikbaar.</p>';

  const slotListText = topSlots.length
    ? topSlots.map((slot) => `- ${formatSlotDate(slot.slot_date)} om ${slot.slot_time}`).join('\n')
    : '- Er zijn momenteel geen momenten beschikbaar.';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
      <div style="background: #355b23; padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px;">Moonen Vochtwering</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #333;">Beste ${name},</p>
        <p style="font-size: 16px; color: #333;">${greeting}</p>
        <p style="font-size: 16px; color: #333;">${body}</p>
        <div style="background: #f5f5f5; border-radius: 6px; padding: 14px 16px; margin-bottom: 20px;">
          <p style="font-size: 14px; color: #666; margin: 0 0 8px 0;"><strong>Eerste 4 beschikbare momenten:</strong></p>
          ${slotListHtml}
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${confirmUrl}"
             style="background: #355b23; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 4px; font-size: 16px; font-weight: 600; display: inline-block;">
            ${ctaLabel}
          </a>
        </div>
        <p style="font-size: 14px; color: #666;">${closing}</p>
      </div>
      <div style="background: #f5f5f5; padding: 20px 24px; font-size: 13px; color: #666;">
        <p style="margin: 0;">Moonen Vochtwering | Grasbroekerweg 141, 6412BD Heerlen | 06 18 16 25 15</p>
      </div>
    </div>
  `;

  const text = `Beste ${name},

${greeting}

${body}

${confirmUrl}

Eerste 4 beschikbare momenten:
${slotListText}

${closing}

Met vriendelijke groet,
Moonen Vochtwering
06 18 16 25 15`;

  return { subject, html, text };
}
