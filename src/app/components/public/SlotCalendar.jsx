'use client';

import { useState, useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  addDays,
  format,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
} from 'date-fns';
import { nl } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const DAY_NAMES = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'];

export default function SlotCalendar({ slots = [], selectedSlotId, onSelectSlot }) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState(null);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const map = {};
    for (const slot of slots) {
      if (!map[slot.slot_date]) map[slot.slot_date] = [];
      map[slot.slot_date].push(slot);
    }
    // Sort times within each date
    for (const date of Object.keys(map)) {
      map[date].sort((a, b) => a.slot_time.localeCompare(b.slot_time));
    }
    return map;
  }, [slots]);

  // Build calendar grid days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = gridStart;
    while (day <= gridEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Time slots for selected date
  const timeSlotsForDate = useMemo(() => {
    if (!selectedDate) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return slotsByDate[dateStr] || [];
  }, [selectedDate, slotsByDate]);

  const canGoBack = !isSameMonth(currentMonth, today);
  const monthLabel = format(currentMonth, 'MMMM yyyy', { locale: nl });

  const handlePrevMonth = () => {
    if (canGoBack) setCurrentMonth(addMonths(currentMonth, -1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayClick = (day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const hasSlots = slotsByDate[dateStr]?.length > 0;
    const isPast = isBefore(day, today);

    if (!hasSlots || isPast) return;
    setSelectedDate(day);
    // Clear slot selection when changing date
    if (onSelectSlot) onSelectSlot(null);
  };

  const handleTimeClick = (slot) => {
    if (onSelectSlot) onSelectSlot(slot.id);
  };

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handlePrevMonth}
          disabled={!canGoBack}
          className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Vorige maand"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold capitalize">{monthLabel}</span>
        <button
          type="button"
          onClick={handleNextMonth}
          className="p-2 rounded-md hover:bg-gray-100"
          aria-label="Volgende maand"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day name headers */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs font-medium text-gray-500 py-1">
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, currentMonth);
          const isPast = isBefore(day, today);
          const isToday = isSameDay(day, today);
          const hasSlots = slotsByDate[dateStr]?.length > 0;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const clickable = inMonth && !isPast && hasSlots;

          return (
            <button
              key={dateStr}
              type="button"
              disabled={!clickable}
              onClick={() => handleDayClick(day)}
              className={`
                relative flex flex-col items-center justify-center rounded-lg
                min-h-[44px] min-w-[44px] text-sm transition-colors
                ${!inMonth ? 'text-gray-300' : ''}
                ${inMonth && isPast ? 'text-gray-400' : ''}
                ${inMonth && !isPast && !hasSlots ? 'text-gray-400' : ''}
                ${clickable ? 'cursor-pointer hover:bg-green-50' : 'cursor-default'}
                ${isSelected ? 'bg-[#355b23] text-white hover:bg-[#355b23]' : ''}
                ${isToday && !isSelected ? 'font-bold ring-1 ring-[#355b23]' : ''}
              `}
            >
              <span>{format(day, 'd')}</span>
              {/* Green dot for available days */}
              {inMonth && hasSlots && !isPast && (
                <span
                  className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-[#8aab4c]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Time slot pills for selected date */}
      {selectedDate && (
        <div className="pt-2 border-t">
          <p className="text-sm text-gray-600 mb-2">
            {format(selectedDate, 'EEEE d MMMM', { locale: nl })}
          </p>
          {timeSlotsForDate.length === 0 ? (
            <p className="text-sm text-gray-400">Geen momenten beschikbaar</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {timeSlotsForDate.map((slot) => {
                const isActive = selectedSlotId === slot.id;
                return (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleTimeClick(slot)}
                    className={`
                      px-4 py-2 rounded-full text-sm font-medium transition-colors
                      min-h-[44px] min-w-[44px]
                      ${
                        isActive
                          ? 'bg-[#355b23] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-[#355b23]'
                      }
                    `}
                  >
                    {slot.slot_time.slice(0, 5)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
