import { Resend } from "resend";

const FROM_EMAIL = "Moonen Vochtwering <info@moonenvochtwering.nl>";

let _resend;
function getResend() {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

export async function sendEmail({ to, subject, html, text, attachments }) {
  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
    text,
    ...(Array.isArray(attachments) && attachments.length > 0
      ? { attachments }
      : {}),
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error(`Email failed: ${error.message}`);
  }

  return data;
}
