import { sendEmail } from '@/lib/email/resend';

function formatError(error) {
  if (!error) return 'Unknown error';
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function formatContext(context) {
  try {
    return JSON.stringify(context || {}, null, 2);
  } catch {
    return String(context);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendWebhookAlert({ subject, body, payload }) {
  const webhookUrl = process.env.OPS_ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subject,
      message: body,
      ...payload,
    }),
  });
}

export async function notifyOpsAlert({ source, message, error, context }) {
  const timestamp = new Date().toISOString();
  const subject = `[Moonen CRM Alert] ${source}: ${message}`;
  const errorText = formatError(error);
  const contextText = formatContext(context);
  const escapedTimestamp = escapeHtml(timestamp);
  const escapedSource = escapeHtml(source);
  const escapedMessage = escapeHtml(message);
  const escapedErrorText = escapeHtml(errorText);
  const escapedContextText = escapeHtml(contextText);
  const text = `Moonen CRM alert\n\nTime: ${timestamp}\nSource: ${source}\nMessage: ${message}\nError: ${errorText}\n\nContext:\n${contextText}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 680px; margin: 0 auto;">
      <h2 style="margin: 0 0 12px 0; color: #b91c1c;">Moonen CRM Alert</h2>
      <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${escapedTimestamp}</p>
      <p style="margin: 0 0 8px 0;"><strong>Source:</strong> ${escapedSource}</p>
      <p style="margin: 0 0 8px 0;"><strong>Message:</strong> ${escapedMessage}</p>
      <p style="margin: 0 0 8px 0;"><strong>Error:</strong> ${escapedErrorText}</p>
      <p style="margin: 12px 0 6px 0;"><strong>Context:</strong></p>
      <pre style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; white-space: pre-wrap;">${escapedContextText}</pre>
    </div>
  `;

  const to = process.env.OPS_ALERT_EMAIL || 'info@moonenvochtwering.nl';

  try {
    await sendEmail({
      to,
      subject,
      html,
      text,
    });
  } catch (emailError) {
    console.error('Ops alert email failed:', emailError);
  }

  try {
    await sendWebhookAlert({
      subject,
      body: text,
      payload: { source, message, error: errorText, context, timestamp },
    });
  } catch (webhookError) {
    console.error('Ops alert webhook failed:', webhookError);
  }
}
