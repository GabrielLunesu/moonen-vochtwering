'use client';

import React, { useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import { format, parse, startOfWeek, getDay, addHours } from 'date-fns';
import { nl } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Button } from '@/app/components/ui/button';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';

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
}) {
    const [view, setView] = React.useState('week');
    const [date, setDate] = React.useState(new Date());
    const [showGoogleInspections, setShowGoogleInspections] = React.useState(false);

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
                if (!slot.is_open) return false;
                if (slot.booked_count >= slot.max_visits) return false; // Fully booked
                if (searchQuery) return false; // Usually don't want to show empty slots when searching
                return true;
            })
            .map((slot) => {
                const startStr = `${slot.slot_date}T${slot.slot_time || '09:00'}:00`;
                const start = new Date(startStr);
                const end = addHours(start, 1);

                return {
                    id: `slot_${slot.id}`,
                    title: `Beschikbaar ${slot.booked_count}/${slot.max_visits}`,
                    start,
                    end,
                    allDay: false,
                    type: 'slot',
                    resource: slot,
                    style: {
                        backgroundColor: '#dcfce7', // green-100
                        color: '#166534', // green-800
                        border: '1px dashed #4ade80', // green-400
                    }
                };
            });

        return [...mappedLeads, ...mappedEvents, ...mappedSlots];
    }, [leads, events, slots, searchQuery, showGoogleInspections]);

    const eventPropGetter = useCallback((event) => {
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
    }, []);

    return (
        <div className="h-full w-full bg-white flex flex-col overflow-hidden">
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
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                onEventDrop={onEventDrop}
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
        </div>
    );
}
