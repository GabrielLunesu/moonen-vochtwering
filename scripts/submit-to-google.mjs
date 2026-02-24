#!/usr/bin/env node

/**
 * Submit all sitemap URLs to Google Indexing API
 *
 * Usage:
 *   node scripts/submit-to-google.mjs
 *
 * Prerequisites:
 *   1. google-service-account.json in project root
 *   2. "Web Search Indexing API" enabled in Google Cloud Console
 *   3. Service account email added as owner in Google Search Console
 */

import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ── Config ──────────────────────────────────────────────────────────
const BASE_URL = 'https://moonenvochtwering.nl';
const KEY_FILE = resolve(ROOT, 'google-service-account.json');

// ── Build URL list (mirrors src/app/sitemap.js) ─────────────────────
function getAllUrls() {
  const cities = [
    'maastricht', 'heerlen', 'sittard-geleen', 'kerkrade',
    'valkenburg', 'meerssen', 'brunssum', 'echt-susteren',
  ];

  const services = [
    'kelderafdichting', 'opstijgend-vocht', 'schimmelbestrijding',
    'gevelimpregnatie', 'vochtwerend-stucwerk',
  ];

  const urls = [
    // Static pages
    BASE_URL,
    `${BASE_URL}/gratis-inspectie`,
    `${BASE_URL}/werkwijze`,
    `${BASE_URL}/over-ons`,
    `${BASE_URL}/veelgestelde-vragen`,

    // Service pages
    ...services.map(s => `${BASE_URL}/diensten/${s}`),

    // City pages
    ...cities.map(c => `${BASE_URL}/vochtbestrijding/${c}`),

    // City + service combo pages
    ...cities.flatMap(c => services.map(s => `${BASE_URL}/vochtbestrijding/${c}/${s}`)),
  ];

  return urls;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  // Verify key file exists
  try {
    readFileSync(KEY_FILE);
  } catch {
    console.error('[ERROR] google-service-account.json not found in project root');
    console.error('Place your service account JSON file at:', KEY_FILE);
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: ['https://www.googleapis.com/auth/indexing'],
  });

  const indexing = google.indexing({ version: 'v3', auth });
  const urls = getAllUrls();

  console.log(`\nSubmitting ${urls.length} URLs to Google Indexing API...\n`);

  let success = 0;
  let failed = 0;
  const errors = [];

  for (const url of urls) {
    try {
      await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: 'URL_UPDATED',
        },
      });
      success++;
      console.log(`  ✓ ${url}`);
    } catch (err) {
      failed++;
      const msg = err?.errors?.[0]?.message || err.message || 'Unknown error';
      errors.push({ url, error: msg });
      console.error(`  ✗ ${url} — ${msg}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`Done! ${success} submitted, ${failed} failed, ${urls.length} total`);

  if (errors.length > 0) {
    console.log('\nFailed URLs:');
    for (const { url, error } of errors) {
      console.log(`  - ${url}: ${error}`);
    }
  }

  console.log();
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
