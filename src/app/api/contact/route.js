import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const { name, email, phone, message } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Naam, e-mail en bericht zijn verplicht' },
        { status: 400 }
      );
    }

    // Configure mail transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Current date formatted in Dutch
    const date = new Date().toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Email content - Using a different "from" address to make it appear in inbox
    const mailOptions = {
      from: `${name} <${email}>`, // This makes it appear as from the customer
      to: process.env.EMAIL_USER || 'info@moonenvochtwering.nl',
      replyTo: email,
      subject: `Nieuw contactformulier bericht - ${name}`,
      text: `Nieuw bericht van contactformulier website:
      
Naam: ${name}
E-mail: ${email}
Telefoonnummer: ${phone || 'Niet ingevuld'}
Bericht: ${message}

Verzonden op: ${date}`,
      html: `
        <h2>Nieuw bericht van contactformulier website</h2>
        <p><strong>Naam:</strong> ${name}</p>
        <p><strong>E-mail:</strong> ${email}</p>
        <p><strong>Telefoonnummer:</strong> ${phone || 'Niet ingevuld'}</p>
        <p><strong>Bericht:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <p><small>Verzonden op: ${date}</small></p>
      `,
    };

    // Auto-reply to user
    const autoReplyOptions = {
      from: `Moonen Vochtwering <${process.env.EMAIL_USER || 'info@moonenvochtwering.nl'}>`,
      to: email,
      subject: 'Bedankt voor uw bericht - Moonen Vochtwering',
      text: `Beste ${name},

Bedankt voor uw bericht. We hebben uw aanvraag ontvangen en zullen zo spoedig mogelijk contact met u opnemen.

Met vriendelijke groet,

Moonen Vochtwering
Grasbroekerweg 141
6412BD Heerlen
Tel: 06 18 16 25 15
KVK: 14090765
www.moonenvochtwering.nl`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Beste ${name},</p>
          
          <p>Bedankt voor uw bericht. We hebben uw aanvraag ontvangen en zullen zo spoedig mogelijk contact met u opnemen.</p>
          
          <p>Met vriendelijke groet,</p>
          
          <p style="margin-bottom: 0;">Moonen Vochtwering</p>
          <p style="margin-top: 0; color: #666;">
            Grasbroekerweg 141<br>
            6412BD Heerlen<br>
            Tel: <a href="tel:+31618162515">06 18 16 25 15</a><br>
            KVK: 14090765<br>
            <a href="https://www.moonenvochtwering.nl">www.moonenvochtwering.nl</a>
          </p>
        </div>
      `,
    };

    // Send emails
    await transporter.sendMail(mailOptions);
    await transporter.sendMail(autoReplyOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het versturen van uw bericht' },
      { status: 500 }
    );
  }
} 