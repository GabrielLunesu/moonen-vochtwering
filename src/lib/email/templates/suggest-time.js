export function suggestTimeEmail({ name, date, time, siteUrl, token, overrides }) {
    const customGreeting = overrides?.greeting || `Beste ${name.split(' ')[0]},`;
    const subjectStr = overrides?.subject || 'Voorstel nieuw moment voor uw inspectie';

    const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    const body1 = overrides?.body || 'We willen graag een nieuw moment voorstellen voor uw gratis vochtinspectie. Schikt het volgende moment?';
    const body2 = overrides?.body2 || 'U kunt hieronder direct akkoord gaan, of een ander moment kiezen in onze agenda.';
    const signOff = overrides?.signOff || 'Met vriendelijke groet,\nMoonen Vochtwering';

    const confirmUrl = `${siteUrl}/voorstel?token=${token}&date=${date}&time=${time}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subjectStr}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0;">
    <div style="max-w-width: 600px; margin: 0 auto; padding: 20px;">
        <p>${customGreeting}</p>

        <p>${body1}</p>

        <div style="background-color: #f0f7ec; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #355b23;">
            <p style="margin: 0; font-size: 16px;">
                <strong>Datum:</strong> <span style="text-transform: capitalize;">${dateLabel}</span><br>
                <strong>Tijd:</strong> ${time} uur
            </p>
        </div>

        <p>${body2}</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmUrl}" style="background-color: #355b23; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
                Bekijk voorstel
            </a>
        </div>

        <p style="white-space: pre-line; color: #666;">${signOff}</p>
    </div>
</body>
</html>
  `;

    return {
        subject: subjectStr,
        text: `${customGreeting}\n\n${body1}\n\nDatum: ${dateLabel}\nTijd: ${time} uur\n\nBekijk en bevestig via deze link: ${confirmUrl}\n\n${signOff}`,
        html,
    };
}
