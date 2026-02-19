import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyOpsAlert } from '@/lib/ops/alerts';

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function haversineKm(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

function fallbackNearestNeighbor(stops) {
  if (stops.length <= 1) {
    return {
      orderedStops: stops,
      path: stops.map((s) => [s.lat, s.lng]),
      totalDistanceKm: 0,
      totalDurationMin: 0,
      provider: 'nearest',
      legDurationsMin: [],
    };
  }

  const remaining = [...stops];
  const ordered = [remaining.shift()];

  while (remaining.length) {
    const last = ordered[ordered.length - 1];
    let nearestIdx = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < remaining.length; i += 1) {
      const candidate = remaining[i];
      const distance = haversineKm(last, candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        nearestIdx = i;
      }
    }

    ordered.push(remaining.splice(nearestIdx, 1)[0]);
  }

  let totalDistanceKm = 0;
  const legDurationsMin = [];

  for (let i = 0; i < ordered.length - 1; i += 1) {
    const segmentKm = haversineKm(ordered[i], ordered[i + 1]);
    totalDistanceKm += segmentKm;
    legDurationsMin.push(Math.max(5, Math.round((segmentKm / 45) * 60)));
  }

  return {
    orderedStops: ordered,
    path: ordered.map((s) => [s.lat, s.lng]),
    totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    totalDurationMin: legDurationsMin.reduce((sum, value) => sum + value, 0),
    provider: 'nearest',
    legDurationsMin,
  };
}

async function optimizeWithOsrm(stops) {
  const coordinates = stops.map((stop) => `${stop.lng},${stop.lat}`).join(';');
  const url = `https://router.project-osrm.org/trip/v1/driving/${coordinates}?source=first&destination=last&roundtrip=false&overview=full&geometries=geojson&steps=false`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);

    const payload = await res.json();
    if (payload.code !== 'Ok' || !payload.trips?.length || !payload.waypoints?.length) {
      throw new Error('OSRM response invalid');
    }

    const trip = payload.trips[0];
    const orderedStops = stops
      .map((stop, inputIndex) => ({
        ...stop,
        route_index: payload.waypoints[inputIndex]?.waypoint_index ?? inputIndex,
      }))
      .sort((a, b) => a.route_index - b.route_index)
      .map((stop) => ({
        id: stop.id,
        name: stop.name,
        plaatsnaam: stop.plaatsnaam,
        inspection_time: stop.inspection_time || null,
        lat: stop.lat,
        lng: stop.lng,
      }));

    return {
      orderedStops,
      path: (trip.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]),
      totalDistanceKm: Number(((trip.distance || 0) / 1000).toFixed(1)),
      totalDurationMin: Math.round((trip.duration || 0) / 60),
      provider: 'osrm',
      legDurationsMin: (trip.legs || []).map((leg) => Math.max(1, Math.round((leg.duration || 0) / 60))),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const incomingStops = Array.isArray(body?.stops) ? body.stops : [];

    if (incomingStops.length < 2) {
      return NextResponse.json({
        orderedStops: incomingStops,
        path: incomingStops.map((s) => [Number(s.lat), Number(s.lng)]).filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng)),
        totalDistanceKm: 0,
        totalDurationMin: 0,
        provider: 'none',
        legDurationsMin: [],
      });
    }

    const stops = incomingStops
      .map((stop) => ({
        id: stop.id,
        name: stop.name || '',
        plaatsnaam: stop.plaatsnaam || '',
        inspection_time: stop.inspection_time || null,
        lat: toNumber(stop.lat),
        lng: toNumber(stop.lng),
      }))
      .filter((stop) => stop.id && stop.lat !== null && stop.lng !== null);

    if (stops.length < 2) {
      return NextResponse.json({
        orderedStops: incomingStops,
        path: [],
        totalDistanceKm: 0,
        totalDurationMin: 0,
        provider: 'none',
        legDurationsMin: [],
      });
    }

    try {
      const osrmResult = await optimizeWithOsrm(stops);
      return NextResponse.json(osrmResult);
    } catch (osrmError) {
      const fallback = fallbackNearestNeighbor(stops);
      await notifyOpsAlert({
        source: '/api/route/optimize',
        message: 'OSRM unavailable, nearest-neighbor fallback used',
        error: osrmError,
        context: { stop_count: stops.length },
      });
      return NextResponse.json(fallback);
    }
  } catch (error) {
    await notifyOpsAlert({
      source: '/api/route/optimize',
      message: 'Route optimization request failed',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
