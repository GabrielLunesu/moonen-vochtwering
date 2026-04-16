'use client';

import React, { useMemo, useCallback, useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { nl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Button } from '@/app/components/ui/button';
import { ChevronLeft, ChevronRight, Plus, ArrowRightLeft, X, Loader2, Send, Trash2, Lock, Unlock } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import {
  LIMBURG_PLACE_OPTIONS,
  SLOT_VISIBILITY_SCOPE_RADIUS,
  getSlotAreaSummary,
  getSlotVisibilityFormState,
} from '@/lib/utils/availability-areas';
import { toast } from 'sonner';

// Configure date-fns localizer
const locales = {
    'nl': nl,
};
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday start
    getDay,
    locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

const messages = {
    allDay: 'Hele dag',
    previous: 'Vorige',
    next: 'Volgende',
    today: 'Vandaag',
    month: 'Maand',
    week: 'Week',
    work_week: 'Werkweek',
    day: 'Dag',
    agenda: 'Agenda',
    date: 'Datum',
    time: 'Tijd',
    event: 'Gebeurtenis',
    noEventsInRange: 'Geen afspraken in deze periode.',
    showMore: total => `+ ${total} meer`,
};

function CustomToolbar({ label, onNavigate, onView, view, onNewEvent, showGoogleInspections, setShowGoogleInspections }) {
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b bg-white shrink-0">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" onClick={() => onNavigate('TODAY')}>
                    Vandaag
                </Button>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full" onClick={() => onNavigate('PREV')}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full" onClick={() => onNavigate('NEXT')}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 ml-2">{label}</h2>
            </div>
            <div className="flex items-center gap-3">
                <Button
                    variant={showGoogleInspections ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => setShowGoogleInspections(!showGoogleInspections)}
                    className="text-xs h-9"
                    title="Toon dubbele agenda afspraken van Google Calendar"
                >
                    Dubbele GCal
                </Button>
                <Select value={view} onValueChange={(v) => onView(v)}>
                    <SelectTrigger className="w-[120px] h-9 bg-white">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="month">Maand</SelectItem>
                        <SelectItem value="week">Week</SelectItem>
                        <SelectItem value="day">Dag</SelectItem>
                    </SelectContent>
                </Select>
                <Button size="sm" onClick={onNewEvent} className="bg-gray-900 text-white hover:bg-gray-800 rounded-full px-4 font-medium transition-colors">
                    <Plus className="h-4 w-4 mr-1.5" /> Nieuw
                </Button>
            </div>
        </div>
    );
}

function EventComponent({ event }) {
    const isInspection = event.type === 'inspection';

    if (isInspection) {
        const lead = event.resource;
        return (
            <div className="h-full w-full flex flex-col justify-center px-1 text-xs leading-tight font-medium overflow-hidden truncate">
                {lead.inspection_time ? lead.inspection_time.slice(0, 5) + ' ' : ''}{lead.name}
            </div>
        );
    }

    // Generic or Google Event
    return (
        <div className="h-full w-full flex flex-col justify-center px-1 text-xs leading-tight font-medium overflow-hidden truncate">
            {event.title}
        </div>
    );
}

export default function FullViewportCalendar({
    leads = [],
    events = [],
    slots = [],
    onSelectEvent,
    onSelectSlot,
    onEventDrop,
    onEventResize,
    searchQuery = '',
    onSlotsChange,
    onLeadsChange,
}) {
    const [view, setView] = React.useState('week');
    const [date, setDate] = React.useState(new Date());
    const [showGoogleInspections, setShowGoogleInspections] = React.useState(false);

    // Slot options dialog state
    const [slotDialogOpen, setSlotDialogOpen] = React.useState(false);
    const [selectedSlot, setSelectedSlot] = React.useState(null);
    const [slotActionLoading, setSlotActionLoading] = React.useState(false);
    const [slotSettings, setSlotSettings] = React.useState(() => getSlotVisibilityFormState(null));

    // Batch reschedule state
    const [pendingMoves, setPendingMoves] = React.useState([]);
    const [batchRescheduleLoading, setBatchRescheduleLoading] = React.useState(false);

    const calendarEvents = useMemo(() => {
        // Collect all Google Event IDs that are already represented as leads
        const leadGoogleEventIds = new Set(
            leads.map(lead => lead.google_event_id).filter(Boolean)
        );

        const mappedLeads = leads
            .filter((lead) => {
                if (!lead.inspection_date) return false;
                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    return lead.name?.toLowerCase().includes(q) || lead.plaatsnaam?.toLowerCase().includes(q);
                }
                return true;
            })
            .map((lead) => {
                const startStr = `${lead.inspection_date}T${lead.inspection_time || '09:00'}:00`;
                const start = new Date(startStr);
                const end = addHours(start, 1); // Inspections are generally 1hr 

                const isCompleted = ['bezocht', 'offerte_verzonden', 'akkoord'].includes(lead.status);

                return {
                    id: `lead_${lead.id}`,
                    title: `Inspectie: ${lead.name}`,
                    start,
                    end,
                    allDay: false,
                    type: 'inspection',
                    resource: lead,
                    style: {
                        backgroundColor: isCompleted ? '#ffedd5' : '#fef08a', // orange-100 or yellow-200
                        color: '#9a3412', // orange-800
                        border: 'none',
                    }
                };
            });

        const mappedEvents = events
            .filter((ev) => {
                // If this is a Google event that mirrors a CRM inspection, hide it unless toggled on
                if (!showGoogleInspections && ev.google_event_id && leadGoogleEventIds.has(ev.google_event_id)) {
                    return false;
                }
                // Fallback heuristic if google_event_id is somehow missing on the lead
                if (!showGoogleInspections && ev.summary?.toLowerCase().startsWith('inspectie:')) {
                    return false;
                }

                if (searchQuery) {
                    const q = searchQuery.toLowerCase();
                    return ev.summary?.toLowerCase().includes(q) || ev.location?.toLowerCase().includes(q);
                }
                return true;
            })
            .map((ev) => {
                let bgColor = '#e0f2fe'; // sky-100
                let color = '#0369a1'; // sky-700

                if (ev.source === 'google' || ev.google_event_id) {
                    bgColor = '#f3e8ff'; // purple-100
                    color = '#7e22ce'; // purple-700
                }

                let start = new Date(ev.start_time);
                let end = new Date(ev.end_time);

                if (ev.is_all_day) {
                    start.setHours(0, 0, 0, 0);
                    end.setHours(23, 59, 59, 999);
                }

                return {
                    id: `event_${ev.id}`,
                    title: ev.summary || '(Geen titel)',
                    start,
                    end,
                    allDay: ev.is_all_day,
                    type: 'event',
                    resource: ev,
                    style: {
                        backgroundColor: bgColor,
                        color: color,
                        border: 'none',
                    }
                };
            });

        const mappedSlots = slots
            .filter((slot) => {
                if (searchQuery) return false; // Usually don't want to show empty slots when searching
                return true;
            })
            .map((slot) => {
                const startStr = `${slot.slot_date}T${slot.slot_time || '09:00'}:00`;
                const start = new Date(startStr);
                const end = addHours(start, 1);
                const isClosed = !slot.is_open;
                const isFull = slot.booked_count >= slot.max_visits;
                const stateLabel = isClosed ? 'Gesloten' : isFull ? 'Vol' : 'Beschikbaar';
                const areaSummary = getSlotAreaSummary(slot);

                let backgroundColor = '#dcfce7';
                let color = '#166534';
                let border = '1px dashed #4ade80';

                if (isClosed) {
                    backgroundColor = '#f3f4f6';
                    color = '#6b7280';
                    border = '1px dashed #9ca3af';
                } else if (isFull) {
                    backgroundColor = '#fef3c7';
                    color = '#92400e';
                    border = '1px dashed #f59e0b';
                }

                return {
                    id: `slot_${slot.id}`,
                    title: `${stateLabel} ${slot.booked_count}/${slot.max_visits} · ${areaSummary}`,
                    start,
                    end,
                    allDay: false,
                    type: 'slot',
                    resource: slot,
                    style: {
                        backgroundColor,
                        color,
                        border,
                    }
                };
            });

        return [...mappedLeads, ...mappedEvents, ...mappedSlots];
    }, [leads, events, slots, searchQuery, showGoogleInspections]);

    const eventPropGetter = useCallback((event) => {
        // Highlight leads that are in pending moves
        if (event.type === 'inspection') {
            const isPending = pendingMoves.some(m => m.lead.id === event.resource.id);
            if (isPending) {
                return {
                    style: {
                        ...event.style,
                        backgroundColor: '#fbbf24',
                        color: '#92400e',
                        border: '2px solid #f59e0b',
                        borderRadius: '4px',
                        opacity: 0.9,
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: '500',
                        padding: '2px 4px',
                    },
                };
            }
        }
        return {
            style: {
                ...event.style,
                borderRadius: '4px',
                opacity: 0.9,
                display: 'block',
                fontSize: '12px',
                fontWeight: '500',
                padding: '2px 4px',
            },
        };
    }, [pendingMoves]);

    // Slot options dialog handlers
    const handleSlotClick = useCallback((event) => {
        if (event.type === 'slot') {
            setSelectedSlot(event.resource);
            setSlotSettings(getSlotVisibilityFormState(event.resource));
            setSlotDialogOpen(true);
        } else {
            onSelectEvent(event);
        }
    }, [onSelectEvent]);

    const toggleSlot = useCallback(async () => {
        if (!selectedSlot) return;
        setSlotActionLoading(true);
        try {
            const res = await fetch(`/api/availability/${selectedSlot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_open: !selectedSlot.is_open }),
            });
            if (!res.ok) throw new Error();
            toast.success(selectedSlot.is_open ? 'Moment gesloten' : 'Moment geopend');
            setSlotDialogOpen(false);
            if (onSlotsChange) await onSlotsChange();
        } catch {
            toast.error('Kon moment niet bijwerken');
        } finally {
            setSlotActionLoading(false);
        }
    }, [selectedSlot, onSlotsChange]);

    const deleteSlot = useCallback(async () => {
        if (!selectedSlot) return;
        setSlotActionLoading(true);
        try {
            const res = await fetch(`/api/availability/${selectedSlot.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error();
            toast.success('Moment verwijderd');
            setSlotDialogOpen(false);
            if (onSlotsChange) await onSlotsChange();
        } catch {
            toast.error('Kon moment niet verwijderen');
        } finally {
            setSlotActionLoading(false);
        }
    }, [selectedSlot, onSlotsChange]);

    const saveSlotSettings = useCallback(async () => {
        if (!selectedSlot) return;
        setSlotActionLoading(true);
        try {
            const res = await fetch(`/api/availability/${selectedSlot.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    visibility_scope: slotSettings.visibility_scope,
                    center_place_name: slotSettings.center_place_name,
                    radius_km: slotSettings.radius_km,
                }),
            });
            const body = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(body?.error || 'Kon moment niet opslaan');
            toast.success('Moment opgeslagen');
            if (onSlotsChange) await onSlotsChange();
            setSlotDialogOpen(false);
        } catch (error) {
            toast.error(error.message || 'Kon moment niet opslaan');
        } finally {
            setSlotActionLoading(false);
        }
    }, [selectedSlot, slotSettings, onSlotsChange]);

    // Batch reschedule handlers
    const addPendingMove = useCallback((move) => {
        setPendingMoves(prev => {
            const withoutExisting = prev.filter(m => m.lead.id !== move.lead.id);
            return [...withoutExisting, move];
        });
    }, []);

    const removePendingMove = useCallback((leadId) => {
        setPendingMoves(prev => prev.filter(m => m.lead.id !== leadId));
    }, []);

    const cancelAllPendingMoves = useCallback(() => {
        setPendingMoves([]);
    }, []);

    const confirmAllPendingMoves = useCallback(async () => {
        if (pendingMoves.length === 0) return;
        setBatchRescheduleLoading(true);
        let successCount = 0;
        let failCount = 0;
        const errors = [];

        for (const move of pendingMoves) {
            try {
                let slotId = move.newSlot?.id;
                if (!slotId && move.targetDateStr && move.targetHour !== undefined) {
                    const createRes = await fetch('/api/availability', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ slot_date: move.targetDateStr, slot_time: `${String(move.targetHour).padStart(2, '0')}:00`, max_visits: 1 }),
                    });
                    if (!createRes.ok) throw new Error('Kon moment niet aanmaken');
                    const created = await createRes.json();
                    slotId = Array.isArray(created) ? created[0]?.id : created?.id;
                }
                if (!slotId) throw new Error('Geen geldig moment');

                const res = await fetch(`/api/leads/${move.lead.id}/reschedule`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_slot_id: slotId }),
                });
                if (!res.ok) {
                    const body = await res.json().catch(() => ({}));
                    throw new Error(body?.error || 'Kon niet verplaatsen');
                }
                successCount++;
            } catch (err) {
                failCount++;
                errors.push(`${move.lead.name}: ${err.message}`);
            }
        }

        if (onLeadsChange) await onLeadsChange();
        if (onSlotsChange) await onSlotsChange();

        setPendingMoves([]);
        setBatchRescheduleLoading(false);

        if (failCount === 0) {
            toast.success(`${successCount} inspectie${successCount !== 1 ? 's' : ''} verplaatst`);
        } else if (successCount === 0) {
            toast.error(`Kon niet verplaatsen: ${errors.join(', ')}`);
        } else {
            toast.warning(`${successCount} verplaatst, ${failCount} mislukt: ${errors.join(', ')}`);
        }
    }, [pendingMoves, onLeadsChange, onSlotsChange]);

    const handleLocalEventDrop = useCallback((args) => {
        const { event, start } = args;
        if (event.type === 'inspection') {
            const lead = event.resource;
            const dateStr = start.toISOString().split('T')[0];
            const timeStr = start.toTimeString().slice(0, 5);
            const slot = slots.find(
                (s) =>
                    s.slot_date === dateStr &&
                    s.slot_time === timeStr &&
                    s.is_open &&
                    s.booked_count < s.max_visits
            );
            const blockedSlot = slots.find(
                (s) =>
                    s.slot_date === dateStr &&
                    s.slot_time === timeStr &&
                    (!s.is_open || s.booked_count >= s.max_visits)
            );
            const oldSlot = lead.availability_slot_id
                ? slots.find(s => s.id === lead.availability_slot_id)
                : null;
            if (blockedSlot) {
                toast.error('Dit moment is gesloten of al volgeboekt.');
                return;
            }
            addPendingMove({ lead, oldSlot, newSlot: slot || null, targetDateStr: slot ? null : dateStr, targetHour: parseInt(timeStr.split(':')[0], 10) });
            toast.info(`${lead.name} → ${formatDateShort(dateStr)} ${timeStr} (in wachtrij)`);
        } else {
            onEventDrop?.(args);
        }
    }, [slots, addPendingMove, onEventDrop, formatDateShort]);

    function formatDateShort(dateStr) {
        if (!dateStr) return '';
        return new Date(`${dateStr}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    return (
        <div className="relative h-full w-full bg-white flex flex-col overflow-hidden">
            <style dangerouslySetInnerHTML={{
                __html: `
        /* Custom tweaks to make react-big-calendar look clean and modern */
        .rbc-calendar { font-family: inherit; }
        .rbc-header { padding: 8px 0; font-weight: 500; color: #6b7280; font-size: 13px; border-bottom: 1px solid #e5e7eb; border-left: none; }
        .rbc-month-view { border: none; border-top: 1px solid #e5e7eb; }
        .rbc-day-bg + .rbc-day-bg { border-left: 1px solid #f3f4f6; }
        .rbc-month-row + .rbc-month-row { border-top: 1px solid #f3f4f6; }
        .rbc-date-cell { padding: 4px 8px; font-weight: 500; font-size: 14px; text-align: left; color: #4b5563; }
        .rbc-off-range-bg { background-color: #fafafa; }
        .rbc-today { background-color: transparent; }
        .rbc-today .rbc-date-cell { color: #111827; font-weight: 700; }
        
        .rbc-time-view { border: none; }
        .rbc-timeslot-group { border-bottom: 1px solid #f3f4f6; }
        .rbc-time-content { border-top: 1px solid #e5e7eb; }
        
        /* Make events look like tags */
        .rbc-event { box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: opacity 0.2s; }
        .rbc-event:hover { opacity: 1; z-index: 10; }
        
        /* Hide default Toolbar border to match our CustomToolbar border */
        .rbc-toolbar { display: none !important; }
      `}} />
            <DnDCalendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                culture="nl"
                messages={messages}
                views={['month', 'week', 'day']}
                view={view}
                onView={setView}
                date={date}
                onNavigate={setDate}
                selectable
                onSelectEvent={handleSlotClick}
                onSelectSlot={onSelectSlot}
                onEventDrop={handleLocalEventDrop}
                onEventResize={onEventResize}
                resizable
                eventPropGetter={eventPropGetter}
                components={{
                    toolbar: (props) => (
                        <CustomToolbar
                            {...props}
                            onNewEvent={() => onSelectSlot({ start: new Date(), end: new Date() })}
                            showGoogleInspections={showGoogleInspections}
                            setShowGoogleInspections={setShowGoogleInspections}
                        />
                    ),
                    event: EventComponent,
                }}
                className="flex-1"
            />

            {/* Pending moves banner */}
            {pendingMoves.length > 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 rounded-lg border border-blue-300 bg-blue-50 px-4 py-3 shadow-lg min-w-80 max-w-lg">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-blue-800 font-medium text-sm">
                            {pendingMoves.length} verplaatsing{pendingMoves.length !== 1 ? 'en' : ''} in de wachtrij
                        </span>
                        <button
                            type="button"
                            className="ml-auto rounded p-1 hover:bg-blue-200 text-blue-500 hover:text-blue-700"
                            onClick={cancelAllPendingMoves}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex flex-col gap-1">
                        {pendingMoves.map((move) => {
                            const fromLabel = move.oldSlot
                                ? `${formatDateShort(move.oldSlot.slot_date)} ${move.oldSlot.slot_time?.slice(0, 5)}`
                                : move.lead.inspection_date
                                    ? `${formatDateShort(move.lead.inspection_date)} ${move.lead.inspection_time?.slice(0, 5) || ''}`
                                    : 'onbekend';
                            const toLabel = move.newSlot
                                ? `${formatDateShort(move.newSlot.slot_date)} ${move.newSlot.slot_time?.slice(0, 5)}`
                                : move.targetDateStr
                                    ? `${formatDateShort(move.targetDateStr)} ${String(move.targetHour).padStart(2, '0')}:00`
                                    : 'nieuw moment';
                            return (
                                <div key={move.lead.id} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-100/60 rounded px-2 py-1">
                                    <span className="font-medium truncate">{move.lead.name}</span>
                                    <span className="text-blue-400 shrink-0">→</span>
                                    <span className="truncate">{toLabel}</span>
                                    <button
                                        type="button"
                                        className="ml-auto shrink-0 rounded p-0.5 hover:bg-blue-200 text-blue-500 hover:text-blue-700"
                                        onClick={() => removePendingMove(move.lead.id)}
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs border-blue-300 text-blue-700 hover:bg-blue-100"
                            onClick={cancelAllPendingMoves}
                        >
                            Annuleren
                        </Button>
                        <Button
                            size="sm"
                            className="flex-1 text-xs bg-blue-600 hover:bg-blue-700"
                            disabled={batchRescheduleLoading}
                            onClick={confirmAllPendingMoves}
                        >
                            {batchRescheduleLoading ? (
                                <>
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    Opslaan...
                                </>
                            ) : (
                                <>
                                    <Send className="h-3 w-3 mr-1" />
                                    Opslaan &amp; versturen
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            <datalist id="limburg-slot-centers">
                {LIMBURG_PLACE_OPTIONS.map((place) => (
                    <option key={place.key} value={place.label} />
                ))}
            </datalist>

            {/* Slot options dialog */}
            <Dialog
                open={slotDialogOpen}
                onOpenChange={(open) => {
                    setSlotDialogOpen(open);
                    if (!open) {
                        setSelectedSlot(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {selectedSlot ? `${selectedSlot.slot_time?.slice(0, 5)} - ${selectedSlot.slot_date}` : 'Moment'}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedSlot ? (
                                <>
                                    {selectedSlot.booked_count}/{selectedSlot.max_visits} geboekt
                                    {selectedSlot.is_open ? ' · Open' : ' · Gesloten'}
                                    {` · ${getSlotAreaSummary(selectedSlot)}`}
                                </>
                            ) : 'Momentinstellingen'}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedSlot && (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1.5">
                                    <Label htmlFor="slot-visibility-scope">Zichtbaarheid</Label>
                                    <Select
                                        value={slotSettings.visibility_scope}
                                        onValueChange={(value) =>
                                            setSlotSettings((current) => ({ ...current, visibility_scope: value }))
                                        }
                                    >
                                        <SelectTrigger id="slot-visibility-scope" className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Voor iedereen</SelectItem>
                                            <SelectItem value="radius">Specifiek gebied</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="slot-radius-km">Straal (km)</Label>
                                    <Input
                                        id="slot-radius-km"
                                        type="number"
                                        min="1"
                                        step="1"
                                        disabled={slotSettings.visibility_scope !== SLOT_VISIBILITY_SCOPE_RADIUS}
                                        value={slotSettings.radius_km}
                                        onChange={(event) =>
                                            setSlotSettings((current) => ({
                                                ...current,
                                                radius_km: event.target.value,
                                            }))
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="slot-center-place">Plaats in Limburg</Label>
                                <Input
                                    id="slot-center-place"
                                    list="limburg-slot-centers"
                                    disabled={slotSettings.visibility_scope !== SLOT_VISIBILITY_SCOPE_RADIUS}
                                    placeholder="Bijvoorbeeld Heerlen"
                                    value={slotSettings.center_place_name}
                                    onChange={(event) =>
                                        setSlotSettings((current) => ({
                                            ...current,
                                            center_place_name: event.target.value,
                                        }))
                                    }
                                />
                                <p className="text-xs text-muted-foreground">
                                    Alleen adressen binnen deze straal zien dit moment online.
                                </p>
                            </div>

                            <div className="flex flex-col gap-2 border-t pt-4">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    onClick={() => {
                                        setSlotDialogOpen(false);
                                        onSelectEvent({ type: 'slot', resource: selectedSlot });
                                    }}
                                    disabled={!selectedSlot.is_open || selectedSlot.booked_count >= selectedSlot.max_visits}
                                >
                                    <Plus className="h-4 w-4" />
                                    Nieuwe aanvraag
                                </Button>
                                {pendingMoves.length > 0 && selectedSlot.is_open && selectedSlot.booked_count < selectedSlot.max_visits && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full justify-start gap-2 text-blue-700"
                                        onClick={() => {
                                            const unslotted = pendingMoves.filter(m => !m.newSlot);
                                            const move = unslotted.length > 0 ? unslotted[0] : pendingMoves[pendingMoves.length - 1];
                                            addPendingMove({ ...move, newSlot: selectedSlot, targetDateStr: null, targetHour: null });
                                            toast.success(`${move.lead.name} → ${formatDateShort(selectedSlot.slot_date)} ${selectedSlot.slot_time?.slice(0, 5)}`);
                                            setSlotDialogOpen(false);
                                        }}
                                    >
                                        <ArrowRightLeft className="h-4 w-4" />
                                        Verplaats naar hier
                                    </Button>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full justify-start gap-2"
                                    disabled={slotActionLoading}
                                    onClick={toggleSlot}
                                >
                                    {slotActionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : selectedSlot.is_open ? (
                                        <Lock className="h-4 w-4" />
                                    ) : (
                                        <Unlock className="h-4 w-4" />
                                    )}
                                    {selectedSlot.is_open ? 'Moment sluiten' : 'Moment openen'}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                                    disabled={slotActionLoading}
                                    onClick={deleteSlot}
                                >
                                    {slotActionLoading ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4" />
                                    )}
                                    Verwijderen
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSlotDialogOpen(false)}>
                            Annuleren
                        </Button>
                        <Button onClick={saveSlotSettings} disabled={slotActionLoading || !selectedSlot}>
                            {slotActionLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Opslaan...
                                </>
                            ) : (
                                'Instellingen opslaan'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
