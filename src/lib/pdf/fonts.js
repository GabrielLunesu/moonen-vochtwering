import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Font } from '@react-pdf/renderer';

let cachedFontFamily;

export async function getQuoteFontFamily() {
  if (cachedFontFamily) {
    return cachedFontFamily;
  }

  const regular = path.join(process.cwd(), 'public', 'fonts', 'SF-Pro-Display-Regular.otf');
  const medium = path.join(process.cwd(), 'public', 'fonts', 'SF-Pro-Display-Medium.otf');
  const bold = path.join(process.cwd(), 'public', 'fonts', 'SF-Pro-Display-Bold.otf');

  try {
    await Promise.all([fs.access(regular), fs.access(medium), fs.access(bold)]);

    Font.register({
      family: 'SF Pro Display',
      fonts: [
        { src: regular, fontWeight: 400 },
        { src: medium, fontWeight: 500 },
        { src: bold, fontWeight: 700 },
      ],
    });

    cachedFontFamily = 'SF Pro Display';
    return cachedFontFamily;
  } catch {
    cachedFontFamily = 'Helvetica';
    return cachedFontFamily;
  }
}
