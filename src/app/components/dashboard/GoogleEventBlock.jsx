'use client';

import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { useState } from 'react';

/**
 * Renders a Google Calendar event block inside the WeekCalendar grid.
 * Display-only — these events cannot be modified from the CRM.
 */
export default function GoogleEventBlock({ event }) {
  const [open, setOpen] = useState(false);

  const startDate = new Date(event.start_time);
  const timeLabel = event.is_all_day
    ? 'Hele dag'
    : startDate.toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });

  const truncatedSummary = event.summary.length > 20
    ? event.summary.slice(0, 18) + '...'
    : event.summary;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="block w-full text-left rounded px-1 py-0.5 text-[10px] leading-tight truncate bg-purple-200 text-purple-800 border border-purple-300 hover:bg-purple-300 transition-colors mb-0.5 relative z-10"
          title={`${event.summary} (${timeLabel})`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {timeLabel} {truncatedSummary}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" side="right" align="start">
        <div className="space-y-2">
          <div>
            <p className="font-medium text-sm">{event.summary}</p>
            <p className="text-xs text-muted-foreground">{timeLabel}</p>
            {event.location && (
              <p className="text-xs text-muted-foreground mt-1">{event.location}</p>
            )}
            {event.description && (
              <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line line-clamp-4">
                {event.description}
              </p>
            )}
          </div>
          <div className="pt-1 border-t">
            <p className="text-[10px] text-purple-600 font-medium">Google Agenda</p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
