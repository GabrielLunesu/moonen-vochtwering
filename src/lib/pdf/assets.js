import { promises as fs } from 'node:fs';
import path from 'node:path';

let cachedLogoDataUri;

export async function getLogoDataUri() {
  if (cachedLogoDataUri !== undefined) {
    return cachedLogoDataUri;
  }

  const logoDir = path.join(process.cwd(), 'public', 'logo');

  // Try PNG first (small, works reliably with @react-pdf)
  try {
    const png = await fs.readFile(path.join(logoDir, 'logo.png'));
    cachedLogoDataUri = `data:image/png;base64,${png.toString('base64')}`;
    return cachedLogoDataUri;
  } catch {
    // PNG not found, try SVG fallback
  }

  try {
    const svg = await fs.readFile(path.join(logoDir, 'logo.svg'), 'utf8');
    cachedLogoDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return cachedLogoDataUri;
  } catch {
    cachedLogoDataUri = null;
    return null;
  }
}
