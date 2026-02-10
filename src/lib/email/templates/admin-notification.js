export function adminNotificationEmail({ lead }) {
  const subject = lead.plaatsnaam
    ? `Nieuwe lead: ${lead.name} uit ${lead.plaatsnaam}`
    : `Nieuwe lead: ${lead.name}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #355b23; padding: 16px 24px;">
        <h2 style="color: #ffffff; margin: 0;">Nieuwe lead via website</h2>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333; width: 120px;">Naam:</td>
            <td style="padding: 8px 0; color: #333;">${lead.name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">E-mail:</td>
            <td style="padding: 8px 0;"><a href="mailto:${lead.email}" style="color: #355b23;">${lead.email}</a></td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Telefoon:</td>
            <td style="padding: 8px 0;"><a href="tel:${lead.phone}" style="color: #355b23;">${lead.phone}</a></td>
          </tr>
          ${lead.plaatsnaam ? `<tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Plaatsnaam:</td>
            <td style="padding: 8px 0; color: #333;">${lead.plaatsnaam}</td>
          </tr>` : ""}
          ${lead.type_probleem ? `<tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333;">Probleem:</td>
            <td style="padding: 8px 0; color: #333;">${lead.type_probleem}</td>
          </tr>` : ""}
          ${lead.message ? `<tr>
            <td style="padding: 8px 0; font-weight: 600; color: #333; vertical-align: top;">Bericht:</td>
            <td style="padding: 8px 0; color: #333;">${lead.message}</td>
          </tr>` : ""}
        </table>
      </div>
    </div>
  `;

  const text = `Nieuwe lead via website:
Naam: ${lead.name}
E-mail: ${lead.email}
Telefoon: ${lead.phone}
${lead.plaatsnaam ? `Plaatsnaam: ${lead.plaatsnaam}` : ""}
${lead.type_probleem ? `Probleem: ${lead.type_probleem}` : ""}
${lead.message ? `Bericht: ${lead.message}` : ""}`;

  return { subject, html, text };
}
