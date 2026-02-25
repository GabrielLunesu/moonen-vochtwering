/**
 * Vercel AI SDK tool definitions for the quote builder.
 * Uses jsonSchema (not zod) to avoid zod v3/v4 compatibility issues.
 * Each tool's execute() calls the pricing engine server-side.
 * Results include an `action` field for client-side state dispatch.
 */

import { tool, jsonSchema } from 'ai';
import {
  calculatePrice,
  getTreatmentInfo,
  suggestTreatmentsForProblem,
  getAllTreatmentCodes,
  calculateWallArea,
  calculateFloorArea,
} from './pricing-engine';

export function createTools() {
  return {
    add_treatment: tool({
      description: `Voeg een behandeling toe aan de offerte. Gebruik een behandelingscode uit de catalogus.
Bundels (bijv. kelderafdichting_muurvlak) produceren meerdere offerteregels.
De pricing engine berekent alle prijzen — geef alleen de code en hoeveelheid.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          treatment_code: { type: 'string', description: 'Behandelingscode uit de catalogus (bijv. kelderafdichting_muurvlak, muurinjectie_30cm)' },
          quantity: { type: 'number', description: 'Hoeveelheid in de bijbehorende eenheid (m², m¹, stuk)' },
        },
        required: ['treatment_code', 'quantity'],
      }),
      execute: async ({ treatment_code, quantity }) => {
        const info = getTreatmentInfo(treatment_code);
        if (!info) {
          return {
            action: 'error',
            message: `Onbekende behandelingscode: ${treatment_code}. Beschikbaar: ${getAllTreatmentCodes().join(', ')}`,
          };
        }

        const lines = calculatePrice(treatment_code, quantity);
        if (!lines.length) {
          return {
            action: 'error',
            message: `Geen prijzen gevonden voor ${treatment_code}.`,
          };
        }

        const total = lines.reduce((sum, l) => sum + l.line_total, 0);

        return {
          action: 'add_lines',
          treatment_code,
          treatment_label: info.label,
          lines,
          total: Math.round(total * 100) / 100,
          quantity,
          unit: info.unit,
        };
      },
    }),

    update_line: tool({
      description: `Wijzig de hoeveelheid van een bestaande offerteregel. Gebruik het regelnummer (1-based index in de huidige offerte).`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          line_index: { type: 'integer', minimum: 1, description: 'Regelnummer in de offerte (begint bij 1)' },
          new_quantity: { type: 'number', description: 'Nieuwe hoeveelheid' },
        },
        required: ['line_index', 'new_quantity'],
      }),
      execute: async ({ line_index, new_quantity }) => {
        return {
          action: 'update_line',
          line_index: line_index - 1,
          new_quantity,
        };
      },
    }),

    remove_line: tool({
      description: `Verwijder een offerteregel. Gebruik het regelnummer (1-based index).`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          line_index: { type: 'integer', minimum: 1, description: 'Regelnummer om te verwijderen (begint bij 1)' },
        },
        required: ['line_index'],
      }),
      execute: async ({ line_index }) => {
        return {
          action: 'remove_line',
          line_index: line_index - 1,
        };
      },
    }),

    set_customer: tool({
      description: `Stel klantgegevens in op de offerte. Alle velden zijn optioneel — geef alleen wat je weet.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Volledige naam van de klant' },
          email: { type: 'string', description: 'E-mailadres' },
          phone: { type: 'string', description: 'Telefoonnummer' },
          straat: { type: 'string', description: 'Straatnaam + huisnummer' },
          postcode: { type: 'string', description: 'Postcode' },
          plaatsnaam: { type: 'string', description: 'Stad / dorp' },
        },
        required: [],
      }),
      execute: async (params) => {
        const customer = {};
        for (const [key, val] of Object.entries(params)) {
          if (val !== undefined) customer[key] = val;
        }
        return {
          action: 'set_customer',
          customer,
        };
      },
    }),

    set_discount: tool({
      description: `Stel een korting in op de offerte. Percentage of vast bedrag.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['percentage', 'amount'], description: 'percentage = % korting, amount = vast bedrag in €' },
          value: { type: 'number', description: 'Kortingswaarde (bijv. 10 voor 10% of 200 voor €200)' },
        },
        required: ['type', 'value'],
      }),
      execute: async ({ type, value }) => {
        return {
          action: 'set_discount',
          discount: { type, value },
        };
      },
    }),

    add_note: tool({
      description: `Voeg een notitie toe aan de offerte of werk de bestaande notitie bij.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          note: { type: 'string', description: 'De notitie of opmerking' },
        },
        required: ['note'],
      }),
      execute: async ({ note }) => {
        return {
          action: 'add_note',
          note,
        };
      },
    }),

    suggest_treatments: tool({
      description: `Geef behandelsuggesties op basis van een probleemomschrijving. Gebruik dit als de klant een probleem beschrijft en je wilt adviseren.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          problem: { type: 'string', description: 'Beschrijving van het vochtprobleem (bijv. "lekkende kelder", "opstijgend vocht")' },
        },
        required: ['problem'],
      }),
      execute: async ({ problem }) => {
        const suggestions = suggestTreatmentsForProblem(problem);
        const details = suggestions.map((code) => {
          const info = getTreatmentInfo(code);
          return info ? { code, label: info.label, unit: info.unit, isBundle: info.isBundle || false } : null;
        }).filter(Boolean);

        return {
          action: 'suggestions',
          problem,
          treatments: details,
        };
      },
    }),

    calculate_area: tool({
      description: `Bereken oppervlakte van keldermuren of vloer op basis van afmetingen. Gebruik dit als de klant afmetingen geeft (bijv. "kelder 4x5, 2.5m hoog").`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          length: { type: 'number', description: 'Lengte in meters' },
          width: { type: 'number', description: 'Breedte in meters' },
          height: { type: 'number', description: 'Hoogte in meters (optioneel, alleen voor muuroppervlak)' },
          type: { type: 'string', enum: ['walls', 'floor', 'both'], description: 'Wat moet berekend worden: walls (muren), floor (vloer), of both (beide)' },
        },
        required: ['length', 'width', 'type'],
      }),
      execute: async ({ length, width, height, type }) => {
        const result = { action: 'area_calculated' };

        if (type === 'walls' || type === 'both') {
          if (!height) {
            return { action: 'error', message: 'Hoogte is nodig om muuroppervlak te berekenen.' };
          }
          result.wall_area = calculateWallArea(length, width, height);
          result.wall_perimeter = Math.round(2 * (length + width) * 10) / 10;
        }

        if (type === 'floor' || type === 'both') {
          result.floor_area = calculateFloorArea(length, width);
        }

        result.dimensions = { length, width, height: height || null };
        return result;
      },
    }),

    set_quote_details: tool({
      description: `Stel offertegegevens in zoals oplossing, diagnose, oppervlakte, doorlooptijd en garantie. Roep dit aan NA het toevoegen van behandelingen. Alle velden zijn optioneel — geef alleen wat je weet.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          oplossingen: { type: 'array', items: { type: 'string' }, description: 'Type oplossing(en), bijv. ["Kelderafdichting"] of ["Muurinjectie", "Keldervloer coating"]' },
          diagnose: { type: 'array', items: { type: 'string' }, description: 'Geconstateerde problemen, bijv. ["Vochtige kelder", "Doorslag muurvlak"]' },
          diagnose_details: { type: 'string', description: 'Vrije tekst diagnose details, bijv. "Doorslag bij hevige regen op het muurvlak"' },
          oppervlakte_m2: { type: 'number', description: 'Totale oppervlakte in m²' },
          doorlooptijd: { type: 'string', description: 'Geschatte doorlooptijd, bijv. "3 werkdagen"' },
          garantie_jaren: { type: 'integer', description: 'Garantie in jaren, bijv. 5' },
          offerte_inleiding: { type: 'string', description: 'Aangepaste inleidingstekst voor de offerte' },
          betaling: { type: 'string', description: 'Aangepaste betalingsvoorwaarden' },
        },
        required: [],
      }),
      execute: async (params) => {
        const result = { action: 'set_quote_details' };
        for (const [key, val] of Object.entries(params)) {
          if (val !== undefined) result[key] = val;
        }
        return result;
      },
    }),

    add_custom_line: tool({
      description: `Voeg een vrije offerteregel toe die niet in de behandelingscatalogus staat. Gebruik dit alleen als er geen passende behandelingscode is.`,
      inputSchema: jsonSchema({
        type: 'object',
        properties: {
          description: { type: 'string', description: 'Omschrijving van de werkzaamheden' },
          quantity: { type: 'number', description: 'Hoeveelheid' },
          unit: { type: 'string', description: 'Eenheid (m², m¹, stuk, etc.)' },
          unit_price: { type: 'number', description: 'Prijs per eenheid incl. BTW' },
        },
        required: ['description', 'quantity', 'unit', 'unit_price'],
      }),
      execute: async ({ description, quantity, unit, unit_price }) => {
        const line_total = Math.round(unit_price * quantity * 100) / 100;
        return {
          action: 'add_lines',
          treatment_code: 'custom',
          treatment_label: description,
          lines: [{
            description,
            unit,
            unit_price,
            quantity,
            line_total,
            tier_applied: null,
            minimum_applied: false,
          }],
          total: line_total,
          quantity,
          unit,
        };
      },
    }),
  };
}
