import { promises as fs } from 'node:fs';
import path from 'node:path';

let cachedLogoDataUri;

export async function getLogoDataUri() {
  if (cachedLogoDataUri !== undefined) {
    return cachedLogoDataUri;
  }

  const logoPath = path.join(process.cwd(), 'public', 'logo', 'logo.svg');

  try {
    const svg = await fs.readFile(logoPath, 'utf8');
    cachedLogoDataUri = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
    return cachedLogoDataUri;
  } catch {
    cachedLogoDataUri = null;
    return null;
  }
}
