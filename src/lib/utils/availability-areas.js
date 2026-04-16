import { LIMBURG_PLACE_OPTIONS, LIMBURG_PLACE_NAMES } from '@/lib/data/limburg-places';

export const SLOT_VISIBILITY_SCOPE_ALL = 'all';
export const SLOT_VISIBILITY_SCOPE_RADIUS = 'radius';

const GEOCODE_USER_AGENT = 'MoonenVochtwering-CRM/1.0';
const geocodeCache =
  globalThis.__moonenAvailabilityGeocodeCache ||
  (globalThis.__moonenAvailabilityGeocodeCache = new Map());

function normalizeString(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function normalizePostcode(value) {
  return String(value || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .trim();
}

export function isRadiusRestrictedSlot(slot) {
  return (
    slot?.visibility_scope === SLOT_VISIBILITY_SCOPE_RADIUS &&
    Number.isFinite(Number(slot?.center_lat)) &&
    Number.isFinite(Number(slot?.center_lng)) &&
    Number(slot?.radius_km) > 0
  );
}

export function getSlotAreaSummary(slot) {
  if (!isRadiusRestrictedSlot(slot)) {
    return 'Voor iedereen zichtbaar';
  }

  const radius = Number(slot.radius_km);
  const radiusLabel = Number.isInteger(radius) ? String(radius) : radius.toFixed(1);
  return `${slot.center_place_name} · ${radiusLabel} km`;
}

export function getSlotVisibilityFormState(slot) {
  return {
    visibility_scope: isRadiusRestrictedSlot(slot)
      ? SLOT_VISIBILITY_SCOPE_RADIUS
      : SLOT_VISIBILITY_SCOPE_ALL,
    center_place_name: slot?.center_place_name || '',
    radius_km: slot?.radius_km ? String(slot.radius_km) : '15',
  };
}

export function findLimburgPlace(query) {
  const normalizedQuery = normalizeString(query);

  if (!normalizedQuery) {
    return null;
  }

  const byLabel =
    LIMBURG_PLACE_OPTIONS.find((place) => normalizeString(place.label) === normalizedQuery) ||
    LIMBURG_PLACE_OPTIONS.find((place) => normalizeString(place.searchLabel) === normalizedQuery);

  if (byLabel) {
    return byLabel;
  }

  const exactNameMatches = LIMBURG_PLACE_OPTIONS.filter(
    (place) => normalizeString(place.name) === normalizedQuery
  );

  if (exactNameMatches.length === 1) {
    return exactNameMatches[0];
  }

  return exactNameMatches.find((place) => normalizeString(place.municipality) === normalizedQuery) || exactNameMatches[0] || null;
}

async function geocodeQuery(query) {
  const cacheKey = normalizeString(query);

  if (!cacheKey) {
    return null;
  }

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': GEOCODE_USER_AGENT,
        },
      }
    );

    if (!res.ok) {
      geocodeCache.set(cacheKey, null);
      return null;
    }

    const data = await res.json();
    const first = Array.isArray(data) ? data[0] : null;

    const coordinates =
      first?.lat && first?.lon
        ? {
            lat: Number(first.lat),
            lng: Number(first.lon),
            display_name: first.display_name || query,
          }
        : null;

    geocodeCache.set(cacheKey, coordinates);
    return coordinates;
  } catch {
    geocodeCache.set(cacheKey, null);
    return null;
  }
}

export async function resolveAddressCoordinates({ plaatsnaam, postcode } = {}) {
  const normalizedPlace = normalizeString(plaatsnaam);
  const normalizedPostcode = normalizePostcode(postcode);

  if (!normalizedPlace && !normalizedPostcode) {
    return null;
  }

  if (normalizedPostcode) {
    const geocoded = await geocodeQuery(
      `${normalizedPostcode} ${plaatsnaam || ''}, Limburg, Nederland`
    );

    if (geocoded) {
      return geocoded;
    }
  }

  const limburgPlace = findLimburgPlace(plaatsnaam);
  if (limburgPlace) {
    return {
      lat: limburgPlace.lat,
      lng: limburgPlace.lng,
      display_name: limburgPlace.label,
    };
  }

  if (normalizedPlace) {
    return geocodeQuery(`${plaatsnaam}, Limburg, Nederland`);
  }

  return null;
}

export async function buildSlotVisibilityPayload(input = {}) {
  const scope =
    input.visibility_scope === SLOT_VISIBILITY_SCOPE_RADIUS
      ? SLOT_VISIBILITY_SCOPE_RADIUS
      : SLOT_VISIBILITY_SCOPE_ALL;

  if (scope === SLOT_VISIBILITY_SCOPE_ALL) {
    return {
      visibility_scope: SLOT_VISIBILITY_SCOPE_ALL,
      center_place_name: null,
      center_lat: null,
      center_lng: null,
      radius_km: null,
    };
  }

  const centerPlaceName = String(input.center_place_name || '').trim();
  const radiusKm = Number(input.radius_km);

  if (!centerPlaceName) {
    throw new Error('Kies een plaats in Limburg voor deze zone.');
  }

  if (!Number.isFinite(radiusKm) || radiusKm <= 0) {
    throw new Error('De straal in kilometers moet groter zijn dan 0.');
  }

  const limburgPlace = findLimburgPlace(centerPlaceName);
  const resolvedCenter =
    limburgPlace ||
    (await geocodeQuery(
      `${centerPlaceName.replace(/\s*\(.+\)\s*$/, '')}, Limburg, Nederland`
    ));

  if (!resolvedCenter) {
    throw new Error('Deze plaats kon niet worden gevonden.');
  }

  return {
    visibility_scope: SLOT_VISIBILITY_SCOPE_RADIUS,
    center_place_name: limburgPlace?.label || centerPlaceName,
    center_lat: Number(resolvedCenter.lat),
    center_lng: Number(resolvedCenter.lng),
    radius_km: Number(radiusKm.toFixed(1)),
  };
}

export function haversineDistanceKm(a, b) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const haversine =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

export function slotMatchesCoordinates(slot, coordinates) {
  if (!isRadiusRestrictedSlot(slot)) {
    return true;
  }

  if (!coordinates) {
    return false;
  }

  return (
    haversineDistanceKm(
      { lat: Number(slot.center_lat), lng: Number(slot.center_lng) },
      coordinates
    ) <= Number(slot.radius_km)
  );
}

export function filterSlotsForCoordinates(slots, coordinates) {
  return (slots || []).filter((slot) => slotMatchesCoordinates(slot, coordinates));
}

export { LIMBURG_PLACE_NAMES, LIMBURG_PLACE_OPTIONS };
