import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, email, phone, message } = data;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Naam, e-mail en bericht zijn verplicht' },
        { status: 400 }
      );
    }

    // Prepare email content
    const emailContent = `
      Nieuw contactformulier bericht:
      
      Naam: ${name}
      E-mail: ${email}
      Telefoon: ${phone || 'Niet opgegeven'}
      
      Bericht:
      ${message}
    `;

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail', // You can change this to your email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD,
      },
    });

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: 'contact@lunesu.nl',
      subject: 'Nieuw contactformulier bericht van website',
      text: emailContent,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Er is een fout opgetreden bij het verzenden van uw bericht' },
      { status: 500 }
    );
  }
} 