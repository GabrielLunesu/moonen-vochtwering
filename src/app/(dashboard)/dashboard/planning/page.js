'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import WeekCalendar from '@/app/components/dashboard/WeekCalendar';
import MapView from '@/app/components/dashboard/MapView';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { createWhatsAppLink, createRouteMessage } from '@/lib/utils/whatsapp';
import { MessageSquare, Route, Save, Clock, GripVertical, RefreshCw, Loader2 } from 'lucide-react';

function todayString() {
  return new Date().toISOString().split('T')[0];
}

function safeRoutePosition(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortRouteLeads(items) {
  return [...items].sort((a, b) => {
    const posA = safeRoutePosition(a.route_position);
    const posB = safeRoutePosition(b.route_position);

    if (posA !== null || posB !== null) {
      if (posA === null) return 1;
      if (posB === null) return -1;
      if (posA !== posB) return posA - posB;
    }

    return (a.inspection_time || '').localeCompare(b.inspection_time || '');
  });
}

function addMinutes(time, minutesToAdd) {
  const [hourRaw, minuteRaw] = String(time || '09:00').split(':');
  const hour = Number(hourRaw);
  const minute = Number(minuteRaw);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return '09:00';

  const total = hour * 60 + minute + minutesToAdd;
  const normalized = ((total % 1440) + 1440) % 1440;
  const outHour = String(Math.floor(normalized / 60)).padStart(2, '0');
  const outMinute = String(normalized % 60).padStart(2, '0');
  return `${outHour}:${outMinute}`;
}

function reorder(list, startIndex, endIndex) {
  const out = [...list];
  const [removed] = out.splice(startIndex, 1);
  out.splice(endIndex, 0, removed);
  return out;
}

export default function PlanningPage() {
  const [leads, setLeads] = useState([]);
  const [slots, setSlots] = useState([]);
  const [googleEvents, setGoogleEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gcalSyncing, setGcalSyncing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [routeLeads, setRouteLeads] = useState([]);
  const [routePath, setRoutePath] = useState([]);
  const [routeStats, setRouteStats] = useState(null);
  const [optimizingRoute, setOptimizingRoute] = useState(false);
  const [savingRoute, setSavingRoute] = useState(false);
  const [savingRouteOrder, setSavingRouteOrder] = useState(false);
  const [startTime, setStartTime] = useState('09:00');

  const fetchSlots = useCallback(async () => {
    const today = todayString();
    const res = await fetch(`/api/availability?from_date=${today}&limit=120`);
    if (!res.ok) throw new Error();
    const data = await res.json();
    setSlots(data);
  }, []);

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/leads');
    if (!res.ok) throw new Error();
    const data = await res.json();

    setLeads(data.filter((lead) => lead.inspection_date && ['bevestigd', 'bezocht', 'offerte_verzonden'].includes(lead.status)));
  }, []);

  const fetchGoogleEvents = useCallback(async () => {
    try {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      const to = new Date(today);
      to.setDate(to.getDate() + 60);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      const res = await fetch(`/api/gcal/events?from=${fromStr}&to=${toStr}`);
      if (res.ok) {
        const data = await res.json();
        setGoogleEvents(data);
      }
    } catch {
      // Google Calendar is optional — fail silently
    }
  }, []);

  const handleGcalSync = async () => {
    setGcalSyncing(true);
    try {
      const res = await fetch('/api/gcal/sync?full=true', { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await fetchGoogleEvents();
      toast.success(`${data.synced} items gesynchroniseerd`);
    } catch {
      toast.error('Synchronisatie mislukt');
    } finally {
      setGcalSyncing(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchLeads(), fetchSlots(), fetchGoogleEvents()])
      .catch(() => toast.error('Kon planning niet laden'))
      .finally(() => setLoading(false));
  }, [fetchLeads, fetchSlots, fetchGoogleEvents]);

  useEffect(() => {
    const dayLeads = sortRouteLeads(leads.filter((lead) => lead.inspection_date === selectedDate));
    setRouteLeads(dayLeads);
    setRoutePath([]);
    setRouteStats(null);
  }, [leads, selectedDate]);

  const geocodedRouteLeads = routeLeads.filter((lead) => Number.isFinite(Number(lead.lat)) && Number.isFinite(Number(lead.lng)));

  const persistRouteOrder = useCallback(
    async (orderedLeads, { showToast = true } = {}) => {
      if (!orderedLeads.length) return;

      setSavingRouteOrder(true);
      try {
        await Promise.all(
          orderedLeads.map(async (lead, index) => {
            const res = await fetch(`/api/leads/${lead.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ route_position: index + 1 }),
            });

            if (!res.ok) {
              throw new Error(`Kon volgorde niet opslaan voor ${lead.name}`);
            }
          })
        );

        setLeads((prev) =>
          prev.map((lead) => {
            const idx = orderedLeads.findIndex((item) => item.id === lead.id);
            if (idx === -1) return lead;
            return { ...lead, route_position: idx + 1 };
          })
        );
        setRouteLeads((prev) =>
          prev.map((lead) => {
            const idx = orderedLeads.findIndex((item) => item.id === lead.id);
            if (idx === -1) return lead;
            return { ...lead, route_position: idx + 1 };
          })
        );

        if (showToast) {
          toast.success('Routevolgorde opgeslagen');
        }
      } catch (error) {
        toast.error(error?.message || 'Routevolgorde opslaan mislukt');
        await fetchLeads();
      } finally {
        setSavingRouteOrder(false);
      }
    },
    [fetchLeads]
  );

  const sendRouteToWhatsApp = () => {
    if (routeLeads.length === 0) {
      toast.info('Geen inspecties op deze dag');
      return;
    }

    const dateLabel = new Date(`${selectedDate}T12:00:00`).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });

    const message = createRouteMessage(routeLeads, dateLabel);
    const link = createWhatsAppLink('0618162515', message);
    window.open(link, '_blank');
  };

  const optimizeRoute = async () => {
    if (geocodedRouteLeads.length < 2) {
      toast.info('Minimaal 2 leads met locatie nodig om te optimaliseren');
      return;
    }

    setOptimizingRoute(true);
    try {
      const res = await fetch('/api/route/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stops: geocodedRouteLeads.map((lead) => ({
            id: lead.id,
            name: lead.name,
            plaatsnaam: lead.plaatsnaam,
            inspection_time: lead.inspection_time,
            lat: lead.lat,
            lng: lead.lng,
          })),
        }),
      });

      if (!res.ok) throw new Error();
      const payload = await res.json();

      const byId = new Map(routeLeads.map((lead) => [lead.id, lead]));
      const orderedGeo = (payload.orderedStops || [])
        .map((stop) => byId.get(stop.id))
        .filter(Boolean);

      const orderedGeoIds = new Set(orderedGeo.map((lead) => lead.id));
      const remaining = routeLeads.filter((lead) => !orderedGeoIds.has(lead.id));
      const merged = [...orderedGeo, ...remaining];

      setRouteLeads(merged);

      const fallbackPath = orderedGeo.map((lead) => [Number(lead.lat), Number(lead.lng)]);
      setRoutePath(Array.isArray(payload.path) && payload.path.length > 1 ? payload.path : fallbackPath);
      setRouteStats({
        totalDistanceKm: payload.totalDistanceKm || 0,
        totalDurationMin: payload.totalDurationMin || 0,
        provider: payload.provider || 'unknown',
      });

      toast.success(payload.provider === 'osrm' ? 'Route geoptimaliseerd' : 'Route benaderd (fallback)');
    } catch {
      toast.error('Route optimaliseren mislukt');
    } finally {
      setOptimizingRoute(false);
    }
  };

  const handleRouteDragEnd = async (result) => {
    const { source, destination } = result;
    if (!destination) return;
    if (source.index === destination.index) return;

    const next = reorder(routeLeads, source.index, destination.index);
    setRouteLeads(next);

    const manualPath = next
      .filter((lead) => Number.isFinite(Number(lead.lat)) && Number.isFinite(Number(lead.lng)))
      .map((lead) => [Number(lead.lat), Number(lead.lng)]);
    setRoutePath(manualPath);

    await persistRouteOrder(next);
  };

  const assignHourlyTimes = () => {
    setRouteLeads((prev) =>
      prev.map((lead, index) => ({
        ...lead,
        inspection_time: addMinutes(startTime, index * 60),
      }))
    );
    toast.success('Tijden ingevuld (1 per uur)');
  };

  const saveRoutePlan = async () => {
    if (routeLeads.length === 0) {
      toast.info('Geen leads om op te slaan');
      return;
    }

    setSavingRoute(true);

    try {
      const updates = await Promise.all(
        routeLeads.map(async (lead, index) => {
          const inspectionTime = lead.inspection_time || addMinutes(startTime, index * 60);
          const res = await fetch(`/api/leads/${lead.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              route_position: index + 1,
              inspection_time: inspectionTime,
            }),
          });

          if (!res.ok) {
            throw new Error(`Kon ${lead.name} niet opslaan`);
          }

          const updated = await res.json();
          return updated;
        })
      );

      const updatesById = new Map(updates.map((lead) => [lead.id, lead]));
      setLeads((prev) => prev.map((lead) => updatesById.get(lead.id) || lead));
      setRouteLeads((prev) => prev.map((lead) => updatesById.get(lead.id) || lead));

      toast.success('Routevolgorde en tijden opgeslagen');
    } catch (error) {
      toast.error(error?.message || 'Route opslaan mislukt');
    } finally {
      setSavingRoute(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-bold">Planning</h1>
          <p className="text-xs text-muted-foreground">Inspecties, routes en beschikbaarheid</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGcalSync}
            disabled={gcalSyncing}
            className="gap-2"
          >
            {gcalSyncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Synchroniseer</span>
          </Button>
          {routeLeads.length > 0 && (
            <Button onClick={sendRouteToWhatsApp} variant="outline" size="sm" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Stuur naar papa</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 p-2 sm:p-4">
        <WeekCalendar leads={leads} slots={slots} googleEvents={googleEvents} onSlotsChange={fetchSlots} onLeadsChange={fetchLeads} />
      </div>
    </div>
  );
}
