'use client';

import { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import Link from 'next/link';
import { startOfWeek, endOfWeek, addWeeks, addDays, format, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Popover, PopoverContent, PopoverAnchor } from '@/app/components/ui/popover';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/app/components/ui/alert-dialog';
import { Badge } from '@/app/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2, Trash2, Lock, Unlock, MoveRight, ExternalLink, Plus, X, Copy, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import QuickLeadDialog from './QuickLeadDialog';
import GoogleEventBlock from './GoogleEventBlock';

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const FIRST_HOUR = HOURS[0];
const DRAG_THRESHOLD = 3;

function timeToRow(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (h < FIRST_HOUR || h > HOURS[HOURS.length - 1]) return null;
  return (h - FIRST_HOUR) * 2 + (m >= 30 ? 1 : 0);
}

function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : '';
}

function hourFromRow(rowIdx) {
  return FIRST_HOUR + Math.floor(rowIdx / 2);
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function WeekCalendar({ leads = [], slots = [], googleEvents = [], onSlotsChange, onLeadsChange, interactive = true }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Drag-to-create state
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const isDragging = useRef(false);

  // Reschedule mode state (click-based flow)
  const [rescheduleMode, setRescheduleMode] = useState(null);
  const [rescheduleConfirm, setRescheduleConfirm] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Lead drag-to-reschedule state
  const [leadDrag, setLeadDrag] = useState(null);           // { lead } when actively dragging
  const [leadDragTarget, setLeadDragTarget] = useState(null); // { dayIdx, rowIdx, dateStr, hour, slot }
  const leadDragStartPos = useRef(null);  // { x, y, lead }
  const leadDragActive = useRef(false);
  const leadDragJustEnded = useRef(false);
  const ghostRef = useRef(null);
  const gridRef = useRef(null);

  // Quick lead dialog state
  const [quickLeadSlot, setQuickLeadSlot] = useState(null);
  const [quickLeadOpen, setQuickLeadOpen] = useState(false);

  const weekStart = useMemo(
    () => startOfWeek(addWeeks(new Date(), weekOffset), { weekStartsOn: 1 }),
    [weekOffset]
  );
  const weekEnd = useMemo(() => endOfWeek(weekStart, { weekStartsOn: 1 }), [weekStart]);

  const days = useMemo(() => {
    const result = [];
    for (let i = 0; i < 7; i++) {
      result.push(addDays(weekStart, i));
    }
    return result;
  }, [weekStart]);

  const slotMap = useMemo(() => {
    const map = {};
    for (const slot of slots) {
      const key = `${slot.slot_date}|${slot.slot_time}`;
      map[key] = slot;
    }
    return map;
  }, [slots]);

  const leadsByDay = useMemo(() => {
    const map = {};
    for (const lead of leads) {
      if (!lead.inspection_date) continue;
      const dateStr = lead.inspection_date;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(lead);
    }
    return map;
  }, [leads]);

  // Map Google Calendar events by day and half-hour row
  const googleEventsByDayRow = useMemo(() => {
    const map = {};
    for (const ev of googleEvents) {
      if (!ev.start_time) continue;
      const start = new Date(ev.start_time);
      const dateStr = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      const h = start.getHours();
      const m = start.getMinutes();
      if (h < FIRST_HOUR || h > HOURS[HOURS.length - 1]) continue;
      const rowIdx = (h - FIRST_HOUR) * 2 + (m >= 30 ? 1 : 0);
      const key = `${dateStr}|${rowIdx}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);
    }
    return map;
  }, [googleEvents]);

  const getDayStatus = useCallback((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySlots = slots.filter(s => s.slot_date === dateStr);
    if (daySlots.length === 0) return 'none';
    const open = daySlots.filter(s => s.is_open);
    if (open.length === 0) return 'closed';
    return open.some(s => s.booked_count < s.max_visits) ? 'open' : 'full';
  }, [slots]);

  function getSlotForCell(dateStr, hour) {
    const timeStr = formatHour(hour);
    return slotMap[`${dateStr}|${timeStr}`] || null;
  }

  function getCellSlotStatus(slot) {
    if (!slot) return 'empty';
    if (!slot.is_open) return 'closed';
    return slot.booked_count < slot.max_visits ? 'open' : 'full';
  }

  const cellBg = {
    empty: '',
    open: 'bg-green-100/70 border-green-300',
    full: 'bg-amber-100/70 border-amber-300',
    closed: 'bg-red-100/70 border-red-300',
  };

  const statusDot = {
    open: 'bg-green-500',
    full: 'bg-amber-500',
    closed: 'bg-red-500',
    none: 'bg-gray-300',
  };

  // --- Slot CRUD ---

  const createSlot = useCallback(async (dateStr, hour) => {
    if (!interactive || !onSlotsChange) return;
    setCreating(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_date: dateStr, slot_time: formatHour(hour), max_visits: 1 }),
      });
      if (!res.ok) throw new Error();
      await onSlotsChange();
    } catch {
      toast.error('Kon moment niet aanmaken');
    } finally {
      setCreating(false);
    }
  }, [interactive, onSlotsChange]);

  const createSlotRange = useCallback(async (dateStr, startHour, endHour) => {
    if (!interactive || !onSlotsChange) return;
    const minH = Math.min(startHour, endHour);
    const maxH = Math.max(startHour, endHour);
    const slotsToCreate = [];
    for (let h = minH; h <= maxH; h++) {
      const existing = getSlotForCell(dateStr, h);
      if (!existing) {
        slotsToCreate.push({ slot_date: dateStr, slot_time: formatHour(h), max_visits: 1 });
      }
    }
    if (slotsToCreate.length === 0) return;

    setCreating(true);
    try {
      const res = await fetch('/api/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slots: slotsToCreate }),
      });
      if (!res.ok) throw new Error();
      await onSlotsChange();
      toast.success(`${slotsToCreate.length} moment${slotsToCreate.length > 1 ? 'en' : ''} aangemaakt`);
    } catch {
      toast.error('Kon momenten niet aanmaken');
    } finally {
      setCreating(false);
    }
  }, [interactive, onSlotsChange, slotMap]);

  const toggleSlot = useCallback(async (slot) => {
    if (!interactive || !onSlotsChange) return;
    setActionLoading(slot.id);
    try {
      const res = await fetch(`/api/availability/${slot.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_open: !slot.is_open }),
      });
      if (!res.ok) throw new Error();
      await onSlotsChange();
    } catch {
      toast.error('Kon moment niet bijwerken');
    } finally {
      setActionLoading(null);
    }
  }, [interactive, onSlotsChange]);

  const deleteSlot = useCallback(async (slot) => {
    if (!interactive || !onSlotsChange) return;
    setActionLoading(slot.id);
    try {
      const res = await fetch(`/api/availability/${slot.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await onSlotsChange();
      toast.success('Moment verwijderd');
    } catch {
      toast.error('Kon moment niet verwijderen');
    } finally {
      setActionLoading(null);
    }
  }, [interactive, onSlotsChange]);

  // --- Click-based reschedule ---

  const startReschedule = useCallback((lead) => {
    const oldSlot = lead.availability_slot_id
      ? slots.find((s) => s.id === lead.availability_slot_id)
      : null;
    setRescheduleMode({ lead, oldSlot });
  }, [slots]);

  const cancelReschedule = useCallback(() => {
    setRescheduleMode(null);
    setRescheduleConfirm(null);
  }, []);

  const handleRescheduleTargetClick = useCallback((slot) => {
    if (!rescheduleMode) return;
    const isOpen = slot.is_open && slot.booked_count < slot.max_visits;
    if (!isOpen) return;
    setRescheduleConfirm({
      lead: rescheduleMode.lead,
      oldSlot: rescheduleMode.oldSlot,
      newSlot: slot,
    });
  }, [rescheduleMode]);

  const confirmReschedule = useCallback(async () => {
    if (!rescheduleConfirm) return;
    const { lead, newSlot, targetDateStr, targetHour } = rescheduleConfirm;

    setRescheduleLoading(true);
    try {
      let slotId = newSlot?.id;

      // Auto-create slot if dropping on empty cell
      if (!slotId && targetDateStr && targetHour !== undefined) {
        const createRes = await fetch('/api/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slot_date: targetDateStr, slot_time: formatHour(targetHour), max_visits: 1 }),
        });
        if (!createRes.ok) throw new Error('Kon moment niet aanmaken');
        const created = await createRes.json();
        slotId = Array.isArray(created) ? created[0]?.id : created?.id;
        if (onSlotsChange) await onSlotsChange();
      }

      if (!slotId) throw new Error('Geen geldig moment');

      const res = await fetch(`/api/leads/${lead.id}/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_slot_id: slotId }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error || 'Kon niet verplaatsen');
        return;
      }

      toast.success(`${lead.name} verplaatst`);
      setRescheduleMode(null);
      setRescheduleConfirm(null);

      if (onLeadsChange) await onLeadsChange();
      if (onSlotsChange) await onSlotsChange();
    } catch (err) {
      toast.error(err?.message || 'Er ging iets mis bij het verplaatsen');
    } finally {
      setRescheduleLoading(false);
    }
  }, [rescheduleConfirm, onLeadsChange, onSlotsChange]);

  // --- Lead drag-to-reschedule ---

  const initLeadDrag = useCallback((e, lead) => {
    if (!interactive || rescheduleMode) return;
    leadDragStartPos.current = { x: e.clientX, y: e.clientY, lead };
    leadDragActive.current = false;
  }, [interactive, rescheduleMode]);

  const handleLeadDrop = useCallback(() => {
    const target = leadDragTarget;
    const dragInfo = leadDragStartPos.current;
    if (!target || !dragInfo) return;

    const { lead } = dragInfo;
    const { dateStr, hour, slot } = target;

    const oldSlot = lead.availability_slot_id
      ? slots.find(s => s.id === lead.availability_slot_id)
      : null;

    // Same slot — no-op
    if (oldSlot && slot && oldSlot.id === slot.id) return;

    if (slot) {
      const status = getCellSlotStatus(slot);
      if (status === 'open') {
        setRescheduleConfirm({ lead, oldSlot, newSlot: slot });
      } else {
        toast.info('Dit moment is niet beschikbaar');
      }
    } else {
      // Empty cell — will auto-create slot on confirm
      setRescheduleConfirm({ lead, oldSlot, newSlot: null, targetDateStr: dateStr, targetHour: hour });
    }
  }, [leadDragTarget, slots]);

  const clearLeadDrag = useCallback(() => {
    leadDragStartPos.current = null;
    leadDragActive.current = false;
    setLeadDrag(null);
    setLeadDragTarget(null);
    // Prevent popover from opening right after drag
    leadDragJustEnded.current = true;
    requestAnimationFrame(() => { leadDragJustEnded.current = false; });
  }, []);

  // Document-level mousemove/mouseup for lead drag (needed when cursor leaves grid)
  useEffect(() => {
    function onMouseMove(e) {
      if (!leadDragStartPos.current) return;

      const { x, y } = leadDragStartPos.current;
      const dx = e.clientX - x;
      const dy = e.clientY - y;

      // Update ghost position
      if (ghostRef.current) {
        ghostRef.current.style.left = `${e.clientX + 12}px`;
        ghostRef.current.style.top = `${e.clientY - 10}px`;
      }

      // Check threshold to activate drag
      if (!leadDragActive.current && Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
        leadDragActive.current = true;
        setLeadDrag({ lead: leadDragStartPos.current.lead });
      }

      // During touch/mouse drag, find cell under pointer via data attributes
      if (leadDragActive.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const cell = el?.closest?.('[data-cal-cell]');
        if (cell) {
          const dayIdx = parseInt(cell.dataset.dayIdx, 10);
          const rowIdx = parseInt(cell.dataset.rowIdx, 10);
          const dateStr = cell.dataset.dateStr;
          const hour = parseInt(cell.dataset.hour, 10);
          const slot = getSlotForCell(dateStr, hour);
          setLeadDragTarget({ dayIdx, rowIdx, dateStr, hour, slot });
        } else {
          setLeadDragTarget(null);
        }
      }
    }

    function onMouseUp() {
      if (!leadDragStartPos.current) return;
      if (leadDragActive.current) {
        handleLeadDrop();
      }
      clearLeadDrag();
    }

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleLeadDrop, clearLeadDrag]);

  // Touch handlers for lead drag
  const handleLeadTouchStart = useCallback((e, lead) => {
    if (!interactive || rescheduleMode) return;
    const touch = e.touches[0];
    leadDragStartPos.current = { x: touch.clientX, y: touch.clientY, lead };
    leadDragActive.current = false;
  }, [interactive, rescheduleMode]);

  useEffect(() => {
    function onTouchMove(e) {
      if (!leadDragStartPos.current) return;
      const touch = e.touches[0];
      const { x, y } = leadDragStartPos.current;
      const dx = touch.clientX - x;
      const dy = touch.clientY - y;

      if (!leadDragActive.current && Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) {
        leadDragActive.current = true;
        setLeadDrag({ lead: leadDragStartPos.current.lead });
      }

      if (leadDragActive.current) {
        e.preventDefault(); // Prevent scroll during drag

        if (ghostRef.current) {
          ghostRef.current.style.left = `${touch.clientX + 12}px`;
          ghostRef.current.style.top = `${touch.clientY - 10}px`;
        }

        const el = document.elementFromPoint(touch.clientX, touch.clientY);
        const cell = el?.closest?.('[data-cal-cell]');
        if (cell) {
          const dayIdx = parseInt(cell.dataset.dayIdx, 10);
          const rowIdx = parseInt(cell.dataset.rowIdx, 10);
          const dateStr = cell.dataset.dateStr;
          const hour = parseInt(cell.dataset.hour, 10);
          const slot = getSlotForCell(dateStr, hour);
          setLeadDragTarget({ dayIdx, rowIdx, dateStr, hour, slot });
        } else {
          setLeadDragTarget(null);
        }
      }
    }

    function onTouchEnd() {
      if (!leadDragStartPos.current) return;
      if (leadDragActive.current) {
        handleLeadDrop();
      }
      clearLeadDrag();
    }

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd);
    return () => {
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [handleLeadDrop, clearLeadDrag]);

  // --- Drag-to-create handlers ---

  const handleMouseDown = useCallback((dayIdx, rowIdx, dateStr, hour) => {
    if (!interactive || creating || rescheduleMode || leadDragStartPos.current) return;
    const slot = getSlotForCell(dateStr, hour);
    if (slot) return;
    isDragging.current = true;
    setDragStart({ dayIdx, rowIdx: Math.floor(rowIdx / 2) });
    setDragEnd({ dayIdx, rowIdx: Math.floor(rowIdx / 2) });
  }, [interactive, creating, slotMap, rescheduleMode]);

  const handleMouseEnter = useCallback((dayIdx, rowIdx) => {
    if (!isDragging.current || !dragStart) return;
    if (dayIdx !== dragStart.dayIdx) return;
    setDragEnd({ dayIdx, rowIdx: Math.floor(rowIdx / 2) });
  }, [dragStart]);

  const handleMouseUp = useCallback(async () => {
    if (!isDragging.current || !dragStart || !dragEnd) {
      isDragging.current = false;
      setDragStart(null);
      setDragEnd(null);
      return;
    }
    isDragging.current = false;

    const dayIdx = dragStart.dayIdx;
    const dateStr = format(days[dayIdx], 'yyyy-MM-dd');
    const startHour = hourFromRow(dragStart.rowIdx * 2);
    const endHour = hourFromRow(dragEnd.rowIdx * 2);

    setDragStart(null);
    setDragEnd(null);

    if (startHour === endHour) {
      await createSlot(dateStr, startHour);
    } else {
      await createSlotRange(dateStr, startHour, endHour);
    }
  }, [dragStart, dragEnd, days, createSlot, createSlotRange]);

  function isCellInDragSelection(dayIdx, rowIdx) {
    if (!dragStart || !dragEnd) return false;
    if (dayIdx !== dragStart.dayIdx) return false;
    const hourIdx = Math.floor(rowIdx / 2);
    const minRow = Math.min(dragStart.rowIdx, dragEnd.rowIdx);
    const maxRow = Math.max(dragStart.rowIdx, dragEnd.rowIdx);
    return hourIdx >= minRow && hourIdx <= maxRow;
  }

  // Check if a slot is a valid reschedule target (click-based mode)
  function isRescheduleTarget(slot) {
    if (!rescheduleMode || !slot) return false;
    return slot.is_open && slot.booked_count < slot.max_visits;
  }

  // Check lead drag target validity
  function getLeadDragCellHighlight(dayIdx, rowIdx, dateStr, hour) {
    if (!leadDrag || !leadDragTarget) return '';
    if (leadDragTarget.dayIdx !== dayIdx || leadDragTarget.rowIdx !== rowIdx) return '';

    const slot = getSlotForCell(dateStr, hour);
    if (!slot) return 'ring-2 ring-inset ring-blue-400'; // Empty cell — valid (will auto-create)
    const status = getCellSlotStatus(slot);
    if (status === 'open') return 'ring-2 ring-inset ring-blue-400';
    return 'ring-2 ring-inset ring-red-300 bg-red-50/50';
  }

  // Format reschedule confirmation strings
  const oldLabel = rescheduleConfirm?.oldSlot
    ? `${new Date(`${rescheduleConfirm.oldSlot.slot_date}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} ${rescheduleConfirm.oldSlot.slot_time.slice(0, 5)}`
    : rescheduleConfirm?.lead?.inspection_date
      ? `${new Date(`${rescheduleConfirm.lead.inspection_date}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} ${rescheduleConfirm.lead.inspection_time?.slice(0, 5) || ''}`
      : 'onbekend';

  const newLabel = rescheduleConfirm?.newSlot
    ? `${new Date(`${rescheduleConfirm.newSlot.slot_date}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} ${rescheduleConfirm.newSlot.slot_time.slice(0, 5)}`
    : rescheduleConfirm?.targetDateStr
      ? `${new Date(`${rescheduleConfirm.targetDateStr}T12:00:00`).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })} ${formatHour(rescheduleConfirm.targetHour)}`
      : '';

  return (
    <>
      <Card className="flex flex-col h-full overflow-hidden">
        <CardHeader className="pb-2 pt-3 px-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm">Weekoverzicht</CardTitle>
              <span className="text-xs text-muted-foreground">
                {format(weekStart, 'd MMM', { locale: nl })} – {format(weekEnd, 'd MMM yyyy', { locale: nl })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {creating && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((p) => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
                className="text-xs h-7 px-2"
              >
                Vandaag
              </Button>
              <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setWeekOffset((p) => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] flex-wrap">
            <span className="flex items-center gap-1"><span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot.open}`} /> Open</span>
            <span className="flex items-center gap-1"><span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot.full}`} /> Vol</span>
            <span className="flex items-center gap-1"><span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot.closed}`} /> Gesloten</span>
            {googleEvents.length > 0 && <span className="flex items-center gap-1"><span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400" /> Google Agenda</span>}
          </div>

          {/* Reschedule mode banner */}
          {rescheduleMode && (
            <div className="mt-1 flex items-center gap-2 rounded-md border border-blue-300 bg-blue-50 px-2 py-1.5 text-xs">
              <MoveRight className="h-3.5 w-3.5 text-blue-600 shrink-0" />
              <span className="text-blue-800">
                Klik op een open moment om <strong>{rescheduleMode.lead.name}</strong> te verplaatsen
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="ml-auto h-6 px-2 text-xs text-blue-600 hover:text-blue-800"
                onClick={cancelReschedule}
              >
                <X className="h-3 w-3 mr-1" />
                Annuleren
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0 flex-1 min-h-0 overflow-auto overscroll-contain scroll-smooth touch-pan-y [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div
            ref={gridRef}
            className={`grid min-w-[600px] select-none ${leadDrag ? 'cursor-grabbing' : ''}`}
            style={{
              gridTemplateColumns: '40px repeat(7, 1fr)',
              gridTemplateRows: `auto repeat(${HOURS.length * 2}, minmax(20px, 1fr))`,
            }}
            onMouseUp={() => {
              // Handle slot-creation drag release (lead drag handled by document listener)
              if (isDragging.current) {
                handleMouseUp();
              }
            }}
            onMouseLeave={() => {
              if (isDragging.current) {
                isDragging.current = false;
                setDragStart(null);
                setDragEnd(null);
              }
            }}
          >
            {/* Header row — sticky */}
            <div className="border-b border-r p-1 sticky top-0 bg-background z-20" />
            {days.map((day) => {
              const today = isToday(day);
              const status = getDayStatus(day);
              return (
                <div
                  key={day.toISOString()}
                  className={`border-b border-r px-1 py-1 text-center text-[11px] font-medium sticky top-0 z-20 ${today ? 'bg-blue-50' : 'bg-background'}`}
                >
                  <div className={today ? 'text-blue-700 font-bold' : 'text-muted-foreground'}>
                    {format(day, 'EEE', { locale: nl })}
                  </div>
                  <div className={`text-xs ${today ? 'text-blue-700 font-bold' : ''}`}>
                    {format(day, 'd')}
                  </div>
                  <span className={`inline-block w-1.5 h-1.5 rounded-full ${statusDot[status]}`} />
                </div>
              );
            })}

            {/* Time slots grid */}
            {HOURS.map((hour) => [0, 30].map((min, halfIdx) => {
              const rowIdx = (hour - FIRST_HOUR) * 2 + halfIdx;
              const label = min === 0 ? `${String(hour).padStart(2, '0')}:00` : '';

              return [
                // Time label column
                <div
                  key={`label-${hour}-${min}`}
                  className="border-r px-1 py-0 flex items-start justify-end text-[10px] text-muted-foreground"
                  style={{ gridRow: rowIdx + 2, gridColumn: 1 }}
                >
                  {label}
                </div>,

                // Day columns
                ...days.map((day, dayIdx) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const today = isToday(day);
                  const isTopHalf = min === 0;
                  const slot = getSlotForCell(dateStr, hour);
                  const slotStatus = getCellSlotStatus(slot);
                  const inDragSelection = isCellInDragSelection(dayIdx, rowIdx);
                  const isTarget = rescheduleMode && isRescheduleTarget(slot);
                  const leadDragHighlight = getLeadDragCellHighlight(dayIdx, rowIdx, dateStr, hour);

                  // Find leads booked at this exact half-hour
                  const dayLeads = leadsByDay[dateStr] || [];
                  const cellLeads = dayLeads.filter((lead) => {
                    const leadRow = timeToRow(lead.inspection_time);
                    return leadRow === rowIdx;
                  });

                  const showSlotContent = isTopHalf && slot;
                  const isEmpty = slotStatus === 'empty';
                  const canClick = interactive && !creating;

                  return (
                    <div
                      key={`cell-${dateStr}-${hour}-${min}`}
                      data-cal-cell=""
                      data-day-idx={dayIdx}
                      data-row-idx={rowIdx}
                      data-date-str={dateStr}
                      data-hour={hour}
                      className={`
                        border-r border-b relative px-0.5
                        ${today ? 'bg-blue-50/30' : ''}
                        ${isTopHalf ? 'border-t border-t-gray-200' : ''}
                        ${!isEmpty ? cellBg[slotStatus] : ''}
                        ${inDragSelection && isEmpty ? 'bg-green-200/50' : ''}
                        ${canClick && isEmpty && !inDragSelection && !rescheduleMode && !leadDrag ? 'hover:bg-green-100/40 cursor-pointer' : ''}
                        ${canClick && !isEmpty && !rescheduleMode && !leadDrag ? 'cursor-pointer' : ''}
                        ${isTarget ? 'ring-2 ring-inset ring-blue-400 cursor-pointer animate-pulse' : ''}
                        ${leadDragHighlight}
                      `}
                      style={{ gridRow: rowIdx + 2, gridColumn: dayIdx + 2 }}
                      onMouseDown={() => {
                        if (canClick && isEmpty && !rescheduleMode && !leadDragStartPos.current) {
                          handleMouseDown(dayIdx, rowIdx, dateStr, hour);
                        }
                      }}
                      onMouseEnter={() => handleMouseEnter(dayIdx, rowIdx)}
                      onClick={() => {
                        // In reschedule mode, clicking an open slot triggers reschedule
                        if (rescheduleMode && isTarget && isTopHalf) {
                          handleRescheduleTargetClick(slot);
                        }
                      }}
                    >
                      {/* Slot content in top half */}
                      {showSlotContent && (
                        <SlotCell
                          slot={slot}
                          interactive={interactive && !rescheduleMode && !leadDrag}
                          loading={actionLoading === slot.id}
                          onToggle={() => toggleSlot(slot)}
                          onDelete={() => deleteSlot(slot)}
                          onNewLead={() => {
                            setQuickLeadSlot(slot);
                            setQuickLeadOpen(true);
                          }}
                          rescheduleMode={!!rescheduleMode || !!leadDrag}
                        />
                      )}

                      {/* Lead blocks */}
                      {cellLeads.map((lead) => (
                        <LeadBlock
                          key={lead.id}
                          lead={lead}
                          interactive={interactive}
                          rescheduleMode={!!rescheduleMode}
                          onReschedule={() => startReschedule(lead)}
                          onDragInit={initLeadDrag}
                          onTouchDragInit={handleLeadTouchStart}
                          isDragging={leadDrag?.lead?.id === lead.id}
                          leadDragJustEnded={leadDragJustEnded}
                        />
                      ))}

                      {/* Google Calendar events */}
                      {(googleEventsByDayRow[`${dateStr}|${rowIdx}`] || []).map((ev) => (
                        <GoogleEventBlock key={ev.google_event_id} event={ev} />
                      ))}
                    </div>
                  );
                }),
              ];
            })).flat(2)}
          </div>
        </CardContent>
      </Card>

      {/* Drag ghost */}
      {leadDrag && (
        <div
          ref={ghostRef}
          className="fixed pointer-events-none z-50 rounded-md px-2.5 py-1.5 text-xs bg-blue-600 text-white shadow-lg opacity-90"
          style={{ left: -9999, top: -9999 }}
        >
          <div className="font-semibold">{leadDrag.lead.name}</div>
          {(leadDrag.lead.straat || leadDrag.lead.plaatsnaam) && (
            <div className="text-[10px] text-blue-100">
              {[leadDrag.lead.straat, leadDrag.lead.plaatsnaam].filter(Boolean).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Reschedule confirmation dialog */}
      <AlertDialog open={!!rescheduleConfirm} onOpenChange={(open) => { if (!open) setRescheduleConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Inspectie verplaatsen</AlertDialogTitle>
            <AlertDialogDescription>
              Verplaats <strong>{rescheduleConfirm?.lead?.name}</strong> van{' '}
              <strong>{oldLabel}</strong> naar <strong>{newLabel}</strong>?
              <br /><br />
              Er wordt automatisch een bevestigingsmail verstuurd naar de klant.
              {rescheduleConfirm && !rescheduleConfirm.newSlot && rescheduleConfirm.targetDateStr && (
                <>
                  <br />
                  <span className="text-muted-foreground text-xs">Er wordt automatisch een nieuw moment aangemaakt.</span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rescheduleLoading} onClick={() => setRescheduleConfirm(null)}>
              Annuleren
            </AlertDialogCancel>
            <AlertDialogAction disabled={rescheduleLoading} onClick={confirmReschedule}>
              {rescheduleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verplaatsen...
                </>
              ) : (
                'Verplaatsen'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick lead dialog */}
      <QuickLeadDialog
        open={quickLeadOpen}
        onOpenChange={setQuickLeadOpen}
        slot={quickLeadSlot}
        onCreated={async () => {
          if (onLeadsChange) await onLeadsChange();
          if (onSlotsChange) await onSlotsChange();
        }}
      />
    </>
  );
}

// Lead block with popover for reschedule + drag support
function LeadBlock({ lead, interactive, rescheduleMode, onReschedule, onDragInit, onTouchDragInit, isDragging, leadDragJustEnded }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const mouseDownPos = useRef(null);

  const address = [lead.straat, [lead.plaatsnaam, lead.postcode].filter(Boolean).join(' ')].filter(Boolean).join(', ');

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      toast.success('Adres gekopieerd');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kon adres niet kopiëren');
    }
  };

  if (!interactive || rescheduleMode) {
    return (
      <div
        className="block rounded-md px-1.5 py-1 text-[10px] leading-snug bg-blue-600 text-white mb-0.5 relative z-10"
        title={`${lead.name} - ${address} (${formatTime(lead.inspection_time)})`}
      >
        <div className="font-semibold truncate">{formatTime(lead.inspection_time)} {lead.name}</div>
        {address && <div className="truncate text-blue-100 text-[9px]">{address}</div>}
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCopied(false); }}>
      <PopoverAnchor asChild>
        <button
          type="button"
          className={`block w-full text-left rounded-md px-1.5 py-1 text-[10px] leading-snug bg-blue-600 text-white hover:bg-blue-700 transition-colors mb-0.5 relative z-10 cursor-grab active:cursor-grabbing touch-none ${isDragging ? 'opacity-40' : ''}`}
          title={`${lead.name} - ${address} (${formatTime(lead.inspection_time)})`}
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            e.stopPropagation();
            mouseDownPos.current = { x: e.clientX, y: e.clientY };
            onDragInit?.(e, lead);
          }}
          onTouchStart={(e) => {
            const touch = e.touches[0];
            mouseDownPos.current = { x: touch.clientX, y: touch.clientY };
            onTouchDragInit?.(e, lead);
          }}
          onClick={(e) => {
            e.stopPropagation();
            // Don't open popover if this was a drag or just ended one
            if (leadDragJustEnded?.current) return;
            if (mouseDownPos.current) {
              const dx = e.clientX - mouseDownPos.current.x;
              const dy = e.clientY - mouseDownPos.current.y;
              mouseDownPos.current = null;
              if (Math.sqrt(dx * dx + dy * dy) >= DRAG_THRESHOLD) return;
            }
            setOpen(true);
          }}
        >
          <div className="font-semibold truncate">{formatTime(lead.inspection_time)} {lead.name}</div>
          {address && <div className="truncate text-blue-100 text-[9px]">{address}</div>}
        </button>
      </PopoverAnchor>
      <PopoverContent className="w-72 p-3" side="right" align="start">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-sm">{lead.name}</p>
            <p className="text-xs text-muted-foreground">
              {formatTime(lead.inspection_time)}
            </p>
            {address && (
              <div className="flex items-center gap-1.5 mt-1.5 rounded-md bg-muted/50 px-2 py-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs flex-1">{address}</p>
                <button
                  type="button"
                  onClick={copyAddress}
                  className="shrink-0 rounded p-0.5 hover:bg-muted transition-colors"
                  title="Kopieer adres"
                >
                  <Copy className={`h-3 w-3 ${copied ? 'text-green-600' : 'text-muted-foreground'}`} />
                </button>
              </div>
            )}
            {lead.phone && (
              <p className="text-xs text-muted-foreground mt-1">{lead.phone}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2"
              asChild
            >
              <Link href={`/dashboard/lead/${lead.id}`}>
                <ExternalLink className="h-3.5 w-3.5" />
                Open lead
              </Link>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => {
                setOpen(false);
                onReschedule();
              }}
            >
              <MoveRight className="h-3.5 w-3.5" />
              Verplaatsen
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Slot cell with popover for managing
function SlotCell({ slot, interactive, loading, onToggle, onDelete, onNewLead, rescheduleMode }) {
  const [open, setOpen] = useState(false);
  const remaining = slot.max_visits - slot.booked_count;
  const status = !slot.is_open ? 'closed' : remaining > 0 ? 'open' : 'full';

  const statusLabel = {
    open: 'Open',
    full: 'Vol',
    closed: 'Gesloten',
  };

  const badgeVariant = {
    open: 'default',
    full: 'secondary',
    closed: 'destructive',
  };

  if (!interactive || rescheduleMode) {
    return (
      <div className="text-[10px] leading-tight px-0.5 py-0.5">
        <span className="font-medium">{formatTime(slot.slot_time)}</span>
        <Badge variant={badgeVariant[status]} className="ml-1 text-[8px] px-1 py-0 h-3.5">
          {statusLabel[status]}
        </Badge>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <button
          type="button"
          className="w-full text-left text-[10px] leading-tight px-0.5 py-0.5 rounded hover:ring-1 hover:ring-primary/30"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <span className="font-medium">{formatTime(slot.slot_time)}</span>
          <Badge variant={badgeVariant[status]} className="ml-1 text-[8px] px-1 py-0 h-3.5">
            {statusLabel[status]}
          </Badge>
        </button>
      </PopoverAnchor>
      <PopoverContent className="w-56 p-3" side="right" align="start">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-sm">{formatTime(slot.slot_time)}</p>
            <p className="text-xs text-muted-foreground">
              {slot.booked_count}/{slot.max_visits} geboekt
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {status === 'open' && (
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => {
                  setOpen(false);
                  onNewLead();
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                Nieuwe aanvraag
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2"
              disabled={loading}
              onClick={() => {
                onToggle();
                setOpen(false);
              }}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : slot.is_open ? (
                <Lock className="h-3.5 w-3.5" />
              ) : (
                <Unlock className="h-3.5 w-3.5" />
              )}
              {slot.is_open ? 'Sluiten' : 'Openen'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start gap-2 text-destructive hover:text-destructive"
              disabled={loading}
              onClick={() => {
                onDelete();
                setOpen(false);
              }}
            >
              {loading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              Verwijderen
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
