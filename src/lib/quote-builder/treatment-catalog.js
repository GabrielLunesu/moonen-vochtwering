/**
 * Treatment catalog for the AI system prompt.
 * Contains descriptions and problem-to-treatment mappings — NO prices.
 * The AI reads this to understand what treatments exist and when to use them.
 */

export const TREATMENT_DESCRIPTIONS = {
  // Kelderafdichting
  kelderafdichting_kimnaad: {
    code: 'kelderafdichting_kimnaad',
    name: 'Kimnaad afdichten',
    description: 'Afdichten van de overgang tussen vloer en wand (kimnaad). Veelvoorkomend lekpunt in kelders.',
    unit: 'm¹',
    when: 'Bij lekkage op de vloer-wandovergang in kelders.',
  },
  kelderafdichting_muurvlak: {
    code: 'kelderafdichting_muurvlak',
    name: 'Muurvlakken waterdicht maken',
    description: 'Compleet pakket: frezen stucwerk, hechtlaag (Kiesol), aanbrandlaag (WP Sulfatex), waterdichte afwerklaag (WP DS Levell). Produceert 4 offerteregels.',
    unit: 'm²',
    when: 'Bij vochtige of lekkende keldermuren. Dit is een bundel van 4 behandelstappen.',
    isBundle: true,
  },
  kelderafdichting_pilaar: {
    code: 'kelderafdichting_pilaar',
    name: 'Pilaar waterdicht afwerken',
    description: 'Waterdicht afwerken van een pilaar in de kelder.',
    unit: 'stuk',
    when: 'Als er pilaren in de kelder staan die ook behandeld moeten worden.',
  },
  kelderafdichting_vloer: {
    code: 'kelderafdichting_vloer',
    name: 'Waterdichte keldervloer',
    description: 'Vezelversterkte waterdichte keldervloer. Heeft staffelkorting bij grotere oppervlaktes en een minimumprijs.',
    unit: 'm²',
    when: 'Bij een keldervloer die waterdicht moet worden gemaakt.',
    hasStaffel: true,
    hasMinimum: true,
  },
  kelderafdichting_afwerking: {
    code: 'kelderafdichting_afwerking',
    name: 'Afwerking stucwerk',
    description: 'Strak stuken met SP Top White (10-30mm). Laatste afwerklaag na de waterdichte behandeling.',
    unit: 'm²',
    when: 'Als nette afwerking gewenst is na de waterdichte behandeling.',
  },

  // Muurinjectie
  muurinjectie_10cm: {
    code: 'muurinjectie_10cm',
    name: 'Muurinjectie 10 cm',
    description: 'Injectie met Kiesol C in dunne muren (10 cm dikte). Stopt opstijgend vocht.',
    unit: 'm¹',
    when: 'Bij opstijgend vocht in muren van circa 10 cm dik.',
  },
  muurinjectie_20cm: {
    code: 'muurinjectie_20cm',
    name: 'Muurinjectie 20 cm',
    description: 'Injectie met Kiesol C in muren van 20 cm dikte.',
    unit: 'm¹',
    when: 'Bij opstijgend vocht in muren van circa 20 cm dik.',
  },
  muurinjectie_30cm: {
    code: 'muurinjectie_30cm',
    name: 'Muurinjectie 30 cm',
    description: 'Injectie met Kiesol C in dikke muren (30 cm). Meest voorkomende dikte bij oude woningen.',
    unit: 'm¹',
    when: 'Bij opstijgend vocht in muren van circa 30 cm dik (standaard).',
  },

  // Vochtbestendige pleister
  vochtbestendige_pleister: {
    code: 'vochtbestendige_pleister',
    name: 'Vochtbestendige pleister',
    description: 'Compleet pakket: frezen, hechtlaag, aanbrandlaag, waterdichte afwerklaag. Zelfde stappen als muurvlak. Produceert 4 offerteregels.',
    unit: 'm²',
    when: 'Bij vochtige binnenmuren (niet-kelder) die een vochtbestendige afwerking nodig hebben.',
    isBundle: true,
  },

  // Gevelimpregnatie
  gevelimpregnatie: {
    code: 'gevelimpregnatie',
    name: 'Gevelimpregnatie (Funcosil FC)',
    description: 'Hydrofoberen van de gevel om vochtdoorslag te voorkomen. Staffelkorting bij grote oppervlaktes.',
    unit: 'm²',
    when: 'Bij vochtdoorslag via de gevel / buitenmuur.',
    hasStaffel: true,
  },

  // Drainage
  drainage_buis: {
    code: 'drainage_buis',
    name: 'Drainage aanleggen',
    description: 'Drainagebuis aanleggen om grondwater af te voeren.',
    unit: 'm¹',
    when: 'Bij wateroverlast door hoog grondwater.',
  },
  drainage_grondwerk: {
    code: 'drainage_grondwerk',
    name: 'Grondwerk en afvoer (drainage)',
    description: 'Graafwerk en aansluiting op afvoer voor de drainage.',
    unit: 'stuk',
    when: 'Altijd in combinatie met drainage_buis — dit is het grondwerk.',
  },

  // Ventilatie
  ventilatie_koker: {
    code: 'ventilatie_koker',
    name: 'Renovatiekoker bijmaken',
    description: 'Extra ventilatiekoker plaatsen voor betere luchtcirculatie.',
    unit: 'stuk',
    when: 'Bij condensatieproblemen waar meer ventilatie nodig is.',
  },

  // Extra items
  leidingdoorvoer: {
    code: 'leidingdoorvoer',
    name: 'Leidingdoorvoer afdichten',
    description: 'Afdichten met Stopaq rond leidingdoorvoeren in muren.',
    unit: 'stuk',
    when: 'Bij lekkage rond leidingen die door keldermuren gaan.',
  },
  schimmel_doden: {
    code: 'schimmel_doden',
    name: 'Schimmel doden',
    description: 'Schimmeldodend middel aanbrengen op aangetaste oppervlaktes.',
    unit: 'm²',
    when: 'Bij schimmelvorming op muren, plafonds of andere oppervlaktes.',
  },
  gevel_reinigen: {
    code: 'gevel_reinigen',
    name: 'Gevel chemisch reinigen',
    description: 'Gevel reinigen met Clean FP alvorens te impregneren.',
    unit: 'm²',
    when: 'Voorafgaand aan gevelimpregnatie als de gevel vuil of verontreinigd is.',
  },
  spouwrooster: {
    code: 'spouwrooster',
    name: 'Spouwrooster plaatsen',
    description: 'Plaatsen van spouwroosters voor ventilatie van de spouwmuur.',
    unit: 'stuk',
    when: 'Bij onvoldoende ventilatie in spouwmuren.',
  },
  air70_ventilatie: {
    code: 'air70_ventilatie',
    name: 'AIR70 ventilatiesysteem',
    description: 'Montage van een AIR70 mechanisch ventilatiesysteem.',
    unit: 'stuk',
    when: 'Bij ernstige condensatie- of ventilatieproblemen die mechanische ventilatie vereisen.',
  },
  frezen_verflaag: {
    code: 'frezen_verflaag',
    name: 'Frezen verflaag',
    description: 'Verwijderen van verflagen van muren. Staffelkorting beschikbaar.',
    unit: 'm²',
    when: 'Als er een verflaag op de muur zit die eerst verwijderd moet worden.',
    hasStaffel: true,
  },
  mb2k_kiesol: {
    code: 'mb2k_kiesol',
    name: 'MB2K + Kiesol MB',
    description: 'Speciaal systeem voor instabiele vloeren (MB2K met Kiesol MB).',
    unit: 'm²',
    when: 'Bij instabiele keldervloeren die een flexibele afdichting nodig hebben.',
  },
  kim_aanhechten: {
    code: 'kim_aanhechten',
    name: 'Kim aanhechten aan bestaande vloer',
    description: 'Aanhechten van de kimafdichting aan de bestaande vloer.',
    unit: 'm²',
    when: 'Als de kimafdichting aangehecht moet worden aan een bestaande vloer.',
  },
  trap_demonteren: {
    code: 'trap_demonteren',
    name: 'Trap demonteren en terugplaatsen',
    description: 'Verwijderen van een trap voorafgaand aan de werkzaamheden, en terugplaatsen daarna.',
    unit: 'stuk',
    when: 'Als een trap in de weg staat voor de werkzaamheden.',
  },
  egaliseren_vloer: {
    code: 'egaliseren_vloer',
    name: 'Egaliseren vloer',
    description: 'Egaliseren van de keldervloer (10-20mm).',
    unit: 'm²',
    when: 'Als de keldervloer ongelijk is en geëgaliseerd moet worden.',
  },
};

/**
 * Problem-to-treatment mapping for the AI.
 */
export const PROBLEM_TREATMENT_MAP = {
  'Vochtige kelder / lekkende kelder': {
    description: 'Kelder die water doorlaat via muren, vloer of kimnaad.',
    typical: ['kelderafdichting_muurvlak', 'kelderafdichting_kimnaad', 'kelderafdichting_vloer', 'kelderafdichting_afwerking'],
    optional: ['leidingdoorvoer', 'trap_demonteren', 'egaliseren_vloer'],
    tip: 'Bereken muuroppervlak: omtrek × hoogte. Vraag altijd naar afmetingen.',
  },
  'Opstijgend vocht': {
    description: 'Vocht dat omhoog trekt via de muur vanuit de grond.',
    typical: ['muurinjectie_30cm', 'vochtbestendige_pleister'],
    optional: ['schimmel_doden', 'frezen_verflaag'],
    tip: 'Vraag naar muurdikte (10/20/30 cm) en lengte van de muur.',
  },
  'Vochtdoorslag gevel': {
    description: 'Regen die door de buitenmuur naar binnen dringt.',
    typical: ['gevelimpregnatie'],
    optional: ['gevel_reinigen', 'spouwrooster'],
    tip: 'Vraag naar geveloppervlak in m².',
  },
  'Schimmel': {
    description: 'Schimmelvorming door vochtoverlast.',
    typical: ['schimmel_doden'],
    optional: ['ventilatie_koker', 'air70_ventilatie'],
    tip: 'Schimmel doden is vaak een aanvullende behandeling. Vraag naar de oorzaak.',
  },
  'Condensatie': {
    description: 'Vochtproblemen door slechte ventilatie.',
    typical: ['ventilatie_koker'],
    optional: ['air70_ventilatie', 'spouwrooster'],
    tip: 'Vraag of er al ventilatie aanwezig is.',
  },
  'Drainage nodig': {
    description: 'Wateroverlast door hoog grondwater.',
    typical: ['drainage_buis', 'drainage_grondwerk'],
    optional: [],
    tip: 'Vraag naar de lengte van de drainagebuis.',
  },
};

/**
 * Common bundles the AI should suggest.
 */
export const BUNDLES = {
  kelder_compleet: {
    name: 'Kelder compleet waterdicht',
    description: 'Muurvlakken + kimnaad + afwerking. Meest voorkomend pakket.',
    codes: ['kelderafdichting_muurvlak', 'kelderafdichting_kimnaad', 'kelderafdichting_afwerking'],
  },
  kelder_met_vloer: {
    name: 'Kelder compleet inclusief vloer',
    description: 'Muurvlakken + kimnaad + vloer + afwerking.',
    codes: ['kelderafdichting_muurvlak', 'kelderafdichting_kimnaad', 'kelderafdichting_vloer', 'kelderafdichting_afwerking'],
  },
  injectie_met_pleister: {
    name: 'Injectie + vochtbestendige pleister',
    description: 'Muurinjectie tegen opstijgend vocht + vochtbestendige afwerking.',
    codes: ['muurinjectie_30cm', 'vochtbestendige_pleister'],
  },
};

/**
 * Build a text block for the AI system prompt with all treatment knowledge.
 */
export function buildTreatmentKnowledge() {
  let text = '## Beschikbare behandelingen\n\n';

  for (const [code, info] of Object.entries(TREATMENT_DESCRIPTIONS)) {
    text += `### ${code}\n`;
    text += `**${info.name}** — eenheid: ${info.unit}\n`;
    text += `${info.description}\n`;
    text += `Gebruik: ${info.when}\n`;
    if (info.isBundle) text += `⚠️ Dit is een bundel — produceert meerdere offerteregels.\n`;
    if (info.hasStaffel) text += `📊 Staffelkorting beschikbaar bij grotere hoeveelheden.\n`;
    if (info.hasMinimum) text += `📌 Minimumprijs van toepassing.\n`;
    text += '\n';
  }

  text += '## Veelvoorkomende combinaties (bundels)\n\n';
  for (const [key, bundle] of Object.entries(BUNDLES)) {
    text += `### ${bundle.name}\n`;
    text += `${bundle.description}\n`;
    text += `Behandelingen: ${bundle.codes.join(', ')}\n\n`;
  }

  text += '## Probleem → behandeling mapping\n\n';
  for (const [problem, mapping] of Object.entries(PROBLEM_TREATMENT_MAP)) {
    text += `### ${problem}\n`;
    text += `${mapping.description}\n`;
    text += `Standaard: ${mapping.typical.join(', ')}\n`;
    if (mapping.optional.length) {
      text += `Optioneel: ${mapping.optional.join(', ')}\n`;
    }
    text += `💡 ${mapping.tip}\n\n`;
  }

  return text;
}
