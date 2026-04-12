'use client';

import { useState, useEffect, useCallback, useDeferredValue } from 'react';
import { toast } from 'sonner';
import FullViewportCalendar from '@/app/components/dashboard/FullViewportCalendar';
import EventDialog from '@/app/components/dashboard/EventDialog';
import InspectionDialog from '@/app/components/dashboard/InspectionDialog';
import QuickLeadDialog from '@/app/components/dashboard/QuickLeadDialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { matchesLeadSearch } from '@/lib/utils/lead-search';
import { RefreshCw, Loader2, Plus } from 'lucide-react';

export default function PlanningPage() {
  const [leads, setLeads] = useState([]);
  const [events, setEvents] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gcalSyncing, setGcalSyncing] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEventData, setSelectedEventData] = useState(null);

  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [selectedInspectionData, setSelectedInspectionData] = useState(null);

  const [quickLeadOpen, setQuickLeadOpen] = useState(false);
  const [quickLeadSlot, setQuickLeadSlot] = useState(null);

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/leads');
    if (!res.ok) throw new Error();
    const data = await res.json();
    setLeads(data.filter((lead) => lead.inspection_date && !lead.archived_at));
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      const to = new Date(today);
      to.setDate(to.getDate() + 90);
      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];
      const res = await fetch(`/api/events?from=${fromStr}&to=${toStr}`);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch {
      // fail silently
    }
  }, []);

  const fetchSlots = useCallback(async () => {
    try {
      const today = new Date();
      const from = new Date(today);
      from.setDate(from.getDate() - 30);

      const to = new Date(today);
      to.setDate(to.getDate() + 90);

      const fromStr = from.toISOString().split('T')[0];
      const toStr = to.toISOString().split('T')[0];

      const res = await fetch(`/api/availability?from_date=${fromStr}&to_date=${toStr}&limit=1000`);
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch {
      // fail silently
    }
  }, []);

  const handleGcalSync = async () => {
    setGcalSyncing(true);
    try {
      const res = await fetch('/api/gcal/sync?full=true', { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      await fetchEvents();
      toast.success(`${data.synced} items gesynchroniseerd`);
    } catch {
      toast.error('Synchronisatie mislukt');
    } finally {
      setGcalSyncing(false);
    }
  };

  useEffect(() => {
    Promise.all([fetchLeads(), fetchEvents(), fetchSlots()])
      .catch(() => toast.error('Kon planning niet laden'))
      .finally(() => setLoading(false));
  }, [fetchLeads, fetchEvents, fetchSlots]);

  const handleSelectEvent = (event) => {
    if (event.type === 'inspection') {
      setSelectedInspectionData(event.resource);
      setInspectionDialogOpen(true);
    } else if (event.type === 'slot') {
      setQuickLeadSlot(event.resource);
      setQuickLeadOpen(true);
    } else {
      setSelectedEventData(event.resource);
      setEventDialogOpen(true);
    }
  };

  const handleSelectSlot = (slotInfo) => {
    // If they drag a day, default to an all day event creation
    // If they click, we open a dialog.
    setSelectedEventData({
      start_time: slotInfo.start.toISOString(),
      end_time: slotInfo.end.toISOString(),
      is_all_day: slotInfo.action === 'select' && slotInfo.slots?.length > 1
    });
    setEventDialogOpen(true);
  };

  const handleEventDrop = async ({ event, start, end, isAllDay }) => {
    const isInspection = event.type === 'inspection';

    if (isInspection) {
      const lead = event.resource;
      const dateStr = start.toISOString().split('T')[0];
      const timeStr = start.toTimeString().slice(0, 5);

      // Open InspectionDialog with these new values instead of applying them automatically!
      setSelectedInspectionData({ ...lead, proposed_date: dateStr, proposed_time: timeStr });
      setInspectionDialogOpen(true);
    } else {
      const ev = event.resource;
      const payload = {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_all_day: !!isAllDay
      };

      try {
        const res = await fetch(`/api/events/${ev.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
        toast.success(`Gebeurtenis verplaatst`);
        fetchEvents();
      } catch {
        toast.error('Gebeurtenis verplaatsen mislukt');
      }
    }
  };

  const handleEventResize = async ({ event, start, end }) => {
    if (event.type === 'inspection') return; // Cannot resize inspections

    const ev = event.resource;
    const payload = {
      start_time: start.toISOString(),
      end_time: end.toISOString(),
    };

    try {
      const res = await fetch(`/api/events/${ev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error();
      toast.success(`Gebeurtenis duur gewijzigd`);
      fetchEvents();
    } catch {
      toast.error('Gebeurtenis wijzigen mislukt');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="border-b px-4 py-3 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-lg font-bold">Planning & Agenda</h1>
            <p className="text-xs text-muted-foreground">Volledig beheer van agenda en CRM inspecties</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center lg:justify-end">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek in agenda..."
              className="w-full sm:w-64 h-9"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGcalSync}
              disabled={gcalSyncing}
              className="gap-2 h-9"
            >
              {gcalSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              <span className="hidden sm:inline">Sync</span>
            </Button>
            <Button size="sm" onClick={() => setQuickLeadOpen(true)} variant="default" className="gap-2 h-9">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nieuwe Aanvraag</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative">
        <FullViewportCalendar
          leads={leads}
          events={events}
          slots={slots}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          searchQuery={deferredSearchQuery}
          onSlotsChange={fetchSlots}
          onLeadsChange={fetchLeads}
        />
      </div>

      <EventDialog
        isOpen={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        onSave={() => fetchEvents()}
        onDelete={() => fetchEvents()}
        eventData={selectedEventData}
      />

      <InspectionDialog
        isOpen={inspectionDialogOpen}
        onClose={() => setInspectionDialogOpen(false)}
        onSave={() => fetchLeads()}
        leadData={selectedInspectionData}
      />

      {quickLeadOpen && (
        <QuickLeadDialog
          open={quickLeadOpen}
          onOpenChange={(isOpen) => {
            setQuickLeadOpen(isOpen);
            if (!isOpen) setQuickLeadSlot(null);
          }}
          slot={quickLeadSlot}
          onCreated={() => {
            fetchLeads();
            fetchSlots();
          }}
        />
      )}
    </div>
  );
}
