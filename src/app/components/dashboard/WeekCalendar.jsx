'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { startOfWeek, endOfWeek, addWeeks, addDays, format, isToday } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { Badge } from '@/app/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2, Trash2, Lock, Unlock } from 'lucide-react';
import { toast } from 'sonner';

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16];

function timeToRow(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (h < 9 || h > 16) return null;
  return (h - 9) * 2 + (m >= 30 ? 1 : 0);
}

function formatTime(timeStr) {
  return timeStr ? timeStr.slice(0, 5) : '';
}

function hourFromRow(rowIdx) {
  return 9 + Math.floor(rowIdx / 2);
}

function formatHour(hour) {
  return `${String(hour).padStart(2, '0')}:00`;
}

export default function WeekCalendar({ leads = [], slots = [], onSlotsChange, interactive = true }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Drag-to-create state
  const [dragStart, setDragStart] = useState(null); // { dayIdx, rowIdx }
  const [dragEnd, setDragEnd] = useState(null); // { dayIdx, rowIdx }
  const isDragging = useRef(false);

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

  // Per-cell slot map: key = "yyyy-MM-dd|HH:00" → slot object
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

  // Summary for header dots
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

  // --- Drag-to-create handlers ---

  const handleMouseDown = useCallback((dayIdx, rowIdx, dateStr, hour) => {
    if (!interactive || creating) return;
    const slot = getSlotForCell(dateStr, hour);
    if (slot) return; // Don't start drag on existing slots
    isDragging.current = true;
    setDragStart({ dayIdx, rowIdx: Math.floor(rowIdx / 2) });
    setDragEnd({ dayIdx, rowIdx: Math.floor(rowIdx / 2) });
  }, [interactive, creating, slotMap]);

  const handleMouseEnter = useCallback((dayIdx, rowIdx) => {
    if (!isDragging.current || !dragStart) return;
    // Clamp to same day column
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

  // Check if a cell is in the current drag selection
  function isCellInDragSelection(dayIdx, rowIdx) {
    if (!dragStart || !dragEnd) return false;
    if (dayIdx !== dragStart.dayIdx) return false;
    const hourIdx = Math.floor(rowIdx / 2);
    const minRow = Math.min(dragStart.rowIdx, dragEnd.rowIdx);
    const maxRow = Math.max(dragStart.rowIdx, dragEnd.rowIdx);
    return hourIdx >= minRow && hourIdx <= maxRow;
  }

  // Global mouseup listener for drag
  // We rely on the grid's onMouseUp, but also catch mouseup outside
  // by using onMouseLeave on the grid container

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Weekoverzicht</CardTitle>
          <div className="flex items-center gap-2">
            {creating && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWeekOffset(0)}
              className="text-xs"
            >
              Vandaag
            </Button>
            <Button variant="outline" size="sm" onClick={() => setWeekOffset((p) => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {format(weekStart, 'd MMM', { locale: nl })} – {format(weekEnd, 'd MMM yyyy', { locale: nl })}
        </p>
        <div className="flex items-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className={`inline-block w-2 h-2 rounded-full ${statusDot.open}`} /> Open</span>
          <span className="flex items-center gap-1"><span className={`inline-block w-2 h-2 rounded-full ${statusDot.full}`} /> Vol</span>
          <span className="flex items-center gap-1"><span className={`inline-block w-2 h-2 rounded-full ${statusDot.closed}`} /> Gesloten</span>
          {interactive && <span className="text-muted-foreground ml-2">Klik om moment toe te voegen · Sleep om meerdere aan te maken</span>}
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div
          className="grid min-w-[700px] select-none"
          style={{
            gridTemplateColumns: '60px repeat(7, 1fr)',
            gridTemplateRows: `auto repeat(${HOURS.length * 2}, minmax(28px, 1fr))`,
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            if (isDragging.current) {
              isDragging.current = false;
              setDragStart(null);
              setDragEnd(null);
            }
          }}
        >
          {/* Header row */}
          <div className="border-b border-r p-2" />
          {days.map((day) => {
            const today = isToday(day);
            const status = getDayStatus(day);
            return (
              <div
                key={day.toISOString()}
                className={`border-b border-r p-2 text-center text-xs font-medium ${today ? 'bg-blue-50' : ''}`}
              >
                <div className={today ? 'text-blue-700 font-bold' : 'text-muted-foreground'}>
                  {format(day, 'EEE', { locale: nl })}
                </div>
                <div className={`text-sm ${today ? 'text-blue-700 font-bold' : ''}`}>
                  {format(day, 'd')}
                </div>
                <span className={`inline-block w-2 h-2 rounded-full mt-1 ${statusDot[status]}`} />
              </div>
            );
          })}

          {/* Time slots grid */}
          {HOURS.map((hour) => [0, 30].map((min, halfIdx) => {
            const rowIdx = (hour - 9) * 2 + halfIdx;
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
                const slot = isTopHalf ? getSlotForCell(dateStr, hour) : getSlotForCell(dateStr, hour);
                const slotStatus = getCellSlotStatus(slot);
                const inDragSelection = isCellInDragSelection(dayIdx, rowIdx);

                // Find leads booked at this exact half-hour
                const dayLeads = leadsByDay[dateStr] || [];
                const cellLeads = dayLeads.filter((lead) => {
                  const leadRow = timeToRow(lead.inspection_time);
                  return leadRow === rowIdx;
                });

                // For top-half of hour: show slot block content
                const showSlotContent = isTopHalf && slot;
                // For bottom-half: slot continues but no content
                const isSlotBottomHalf = !isTopHalf && getSlotForCell(dateStr, hour);

                const isEmpty = slotStatus === 'empty';
                const canClick = interactive && !creating;

                return (
                  <div
                    key={`cell-${dateStr}-${hour}-${min}`}
                    className={`
                      border-r border-b relative px-0.5
                      ${today ? 'bg-blue-50/30' : ''}
                      ${isTopHalf ? 'border-t border-t-gray-200' : ''}
                      ${!isEmpty ? cellBg[slotStatus] : ''}
                      ${inDragSelection && isEmpty ? 'bg-green-200/50' : ''}
                      ${canClick && isEmpty && !inDragSelection ? 'hover:bg-green-100/40 cursor-pointer' : ''}
                      ${canClick && !isEmpty ? 'cursor-pointer' : ''}
                    `}
                    style={{ gridRow: rowIdx + 2, gridColumn: dayIdx + 2 }}
                    onMouseDown={() => {
                      if (canClick && isEmpty) {
                        handleMouseDown(dayIdx, rowIdx, dateStr, hour);
                      }
                    }}
                    onMouseEnter={() => handleMouseEnter(dayIdx, rowIdx)}
                  >
                    {/* Slot content in top half */}
                    {showSlotContent && (
                      <SlotCell
                        slot={slot}
                        interactive={interactive}
                        loading={actionLoading === slot.id}
                        onToggle={() => toggleSlot(slot)}
                        onDelete={() => deleteSlot(slot)}
                      />
                    )}

                    {/* Lead blocks */}
                    {cellLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/dashboard/lead/${lead.id}`}
                        className="block rounded px-1 py-0.5 text-[10px] leading-tight truncate bg-blue-600 text-white hover:bg-blue-700 transition-colors mb-0.5 relative z-10"
                        title={`${lead.name} - ${lead.plaatsnaam} (${formatTime(lead.inspection_time)})`}
                      >
                        {formatTime(lead.inspection_time)} {lead.name}
                      </Link>
                    ))}
                  </div>
                );
              }),
            ];
          })).flat(2)}
        </div>
      </CardContent>
    </Card>
  );
}

// Slot cell with popover for managing
function SlotCell({ slot, interactive, loading, onToggle, onDelete }) {
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

  if (!interactive) {
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
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" side="right" align="start">
        <div className="space-y-3">
          <div>
            <p className="font-medium text-sm">{formatTime(slot.slot_time)}</p>
            <p className="text-xs text-muted-foreground">
              {slot.booked_count}/{slot.max_visits} geboekt
            </p>
          </div>
          <div className="flex flex-col gap-2">
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
              disabled={loading || slot.booked_count > 0}
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
            {slot.booked_count > 0 && (
              <p className="text-[10px] text-muted-foreground">
                Kan niet verwijderen: er zijn boekingen
              </p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
