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
import { MessageSquare, RefreshCw, Route, Save, Clock, GripVertical } from 'lucide-react';

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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [updatingSlotId, setUpdatingSlotId] = useState(null);

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

  useEffect(() => {
    Promise.all([fetchLeads(), fetchSlots()])
      .catch(() => toast.error('Kon planning niet laden'))
      .finally(() => setLoading(false));
  }, [fetchLeads, fetchSlots]);

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

  const generateSlots = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/availability/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeks: 4, max_visits: 1 }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await fetchSlots();
      toast.success(`${data.inserted || 0} momenten toegevoegd`);
    } catch {
      toast.error('Kon beschikbaarheid niet genereren');
    } finally {
      setGenerating(false);
    }
  };

  const toggleSlot = async (slot) => {
    setUpdatingSlotId(slot.id);
    try {
      const res = await fetch(`/api/availability/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !slot.is_open }),
      });
      if (!res.ok) throw new Error();
      await fetchSlots();
    } catch {
      toast.error('Kon moment niet bijwerken');
    } finally {
      setUpdatingSlotId(null);
    }
  };

  return (
    <div>
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Planning</h1>
          <p className="text-sm text-muted-foreground">Inspecties, routes en beschikbaarheid</p>
        </div>
        {routeLeads.length > 0 && (
          <Button onClick={sendRouteToWhatsApp} variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Stuur dagroute naar papa
          </Button>
        )}
      </div>

      <div className="p-6 grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Routeplanner</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Datum</p>
                <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Starttijd</p>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <Button variant="outline" onClick={optimizeRoute} disabled={optimizingRoute || geocodedRouteLeads.length < 2}>
                <Route className="h-4 w-4 mr-2" />
                {optimizingRoute ? 'Optimaliseren...' : 'Optimaliseer route'}
              </Button>
              <Button variant="outline" onClick={assignHourlyTimes} disabled={routeLeads.length === 0}>
                <Clock className="h-4 w-4 mr-2" />
                1 per uur plannen
              </Button>
            </div>

            {routeStats && (
              <div className="rounded-md border px-3 py-2 text-sm">
                <span className="font-medium">Route:</span>{' '}
                {routeStats.totalDistanceKm} km, circa {routeStats.totalDurationMin} min rijden ({routeStats.provider})
              </div>
            )}

            {routeLeads.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geen inspecties op deze dag.</p>
            ) : (
              <DragDropContext onDragEnd={handleRouteDragEnd}>
                <Droppable droppableId="day-route">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                      {routeLeads.map((lead, index) => {
                        const hasGeo = Number.isFinite(Number(lead.lat)) && Number.isFinite(Number(lead.lng));
                        return (
                          <Draggable key={lead.id} draggableId={lead.id} index={index}>
                            {(dragProvided) => (
                              <div
                                ref={dragProvided.innerRef}
                                {...dragProvided.draggableProps}
                                className="flex items-center justify-between gap-3 rounded-md border p-3 bg-background"
                              >
                                <div className="flex items-center gap-2 text-sm">
                                  <button
                                    type="button"
                                    aria-label="Versleep volgorde"
                                    className="cursor-grab active:cursor-grabbing text-muted-foreground"
                                    {...dragProvided.dragHandleProps}
                                  >
                                    <GripVertical className="h-4 w-4" />
                                  </button>
                                  <div>
                                    <p className="font-medium">{index + 1}. {lead.name}</p>
                                    <p className="text-muted-foreground">{lead.plaatsnaam}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {!hasGeo && <Badge variant="secondary">Geen locatie</Badge>}
                                  <Input
                                    type="time"
                                    className="w-28"
                                    value={lead.inspection_time || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setRouteLeads((prev) =>
                                        prev.map((item) =>
                                          item.id === lead.id ? { ...item, inspection_time: value } : item
                                        )
                                      );
                                    }}
                                  />
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            )}

            <div className="flex justify-end">
              <Button onClick={saveRoutePlan} disabled={savingRoute || savingRouteOrder || routeLeads.length === 0}>
                <Save className="h-4 w-4 mr-2" />
                {savingRoute ? 'Opslaan...' : 'Route opslaan'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sleep regels om de routevolgorde te wijzigen. Volgorde wordt direct opgeslagen.
            </p>
          </CardContent>
        </Card>

        <WeekCalendar leads={leads} slots={slots} />

        <div className="grid grid-cols-1 gap-6">
          <MapView leads={routeLeads} routePath={routePath} routeStats={routeStats} />
        </div>
      </div>

      <div className="px-6 pb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Beschikbaarheid</CardTitle>
              <p className="text-sm text-muted-foreground">Email gebruikt automatisch de eerste 4 open momenten.</p>
            </div>
            <Button onClick={generateSlots} disabled={generating} variant="outline" className="gap-2">
              <RefreshCw className={`h-4 w-4 ${generating ? 'animate-spin' : ''}`} />
              Genereer 4 weken
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">Laden...</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Geen momenten gevonden. Klik op &quot;Genereer 4 weken&quot; om te starten.
              </p>
            ) : (
              <div className="space-y-2">
                {slots.slice(0, 40).map((slot) => {
                  const remaining = slot.max_visits - slot.booked_count;
                  return (
                    <div key={slot.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <div className="text-sm">
                        <span className="font-medium">
                          {new Date(`${slot.slot_date}T12:00:00`).toLocaleDateString('nl-NL', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="ml-2">{slot.slot_time}</span>
                        <span className="ml-3 text-muted-foreground">
                          {slot.booked_count}/{slot.max_visits} bezet
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={slot.is_open && remaining > 0 ? 'default' : 'secondary'}>
                          {slot.is_open ? (remaining > 0 ? 'Open' : 'Vol') : 'Gesloten'}
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingSlotId === slot.id}
                          onClick={() => toggleSlot(slot)}
                        >
                          {slot.is_open ? 'Sluit' : 'Open'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
