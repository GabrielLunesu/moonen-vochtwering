'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { startOfWeek, endOfWeek, addWeeks, addDays, format, isSameDay, isToday, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function WeekCalendar({ leads = [], slots = [] }) {
  const [weekOffset, setWeekOffset] = useState(0);

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

  const slotsByDay = useMemo(() => {
    const map = {};
    for (const slot of slots) {
      const dateStr = slot.slot_date;
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(slot);
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

  const getSlotStatus = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const daySlots = slotsByDay[dateStr] || [];
    if (daySlots.length === 0) return 'none';

    const open = daySlots.filter((s) => s.is_open);
    if (open.length === 0) return 'closed';

    const hasCapacity = open.some((s) => s.booked_count < s.max_visits);
    return hasCapacity ? 'open' : 'full';
  };

  const statusColors = {
    open: 'bg-green-50 border-green-200',
    full: 'bg-amber-50 border-amber-200',
    closed: 'bg-red-50 border-red-200',
    none: '',
  };

  const statusDot = {
    open: 'bg-green-500',
    full: 'bg-amber-500',
    closed: 'bg-red-500',
    none: 'bg-gray-300',
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Weekoverzicht</CardTitle>
          <div className="flex items-center gap-2">
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
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        <div
          className="grid min-w-[700px]"
          style={{
            gridTemplateColumns: '60px repeat(7, 1fr)',
            gridTemplateRows: `auto repeat(${HOURS.length * 2}, minmax(28px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="border-b border-r p-2" />
          {days.map((day) => {
            const today = isToday(day);
            const status = getSlotStatus(day);
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
                const status = getSlotStatus(day);
                const today = isToday(day);

                // Find leads booked at this exact half-hour
                const dayLeads = leadsByDay[dateStr] || [];
                const cellLeads = dayLeads.filter((lead) => {
                  const leadRow = timeToRow(lead.inspection_time);
                  return leadRow === rowIdx;
                });

                return (
                  <div
                    key={`cell-${dateStr}-${hour}-${min}`}
                    className={`border-r border-b relative px-0.5 ${today ? 'bg-blue-50/30' : ''} ${min === 0 ? 'border-t border-t-gray-200' : ''} ${statusColors[status]}`}
                    style={{ gridRow: rowIdx + 2, gridColumn: dayIdx + 2 }}
                  >
                    {cellLeads.map((lead) => (
                      <Link
                        key={lead.id}
                        href={`/dashboard/lead/${lead.id}`}
                        className="block rounded px-1 py-0.5 text-[10px] leading-tight truncate bg-blue-600 text-white hover:bg-blue-700 transition-colors mb-0.5"
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
