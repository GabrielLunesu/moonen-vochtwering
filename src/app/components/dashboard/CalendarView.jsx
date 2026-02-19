'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import Link from 'next/link';
import { Clock, MapPin } from 'lucide-react';

export default function CalendarView({ leads }) {
  // Group leads by date
  const byDate = {};
  leads.forEach(lead => {
    if (!lead.inspection_date) return;
    const key = lead.inspection_date;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(lead);
  });

  const sortedDates = Object.keys(byDate).sort();

  if (sortedDates.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Geen geplande inspecties
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {sortedDates.map(date => (
        <Card key={date}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {new Date(date).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {byDate[date]
              .sort((a, b) => (a.inspection_time || '').localeCompare(b.inspection_time || ''))
              .map(lead => (
                <Link
                  key={lead.id}
                  href={`/dashboard/lead/${lead.id}`}
                  className="flex items-center justify-between p-3 rounded-md border hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-sm">{lead.name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      {lead.inspection_time && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {lead.inspection_time}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {lead.plaatsnaam}
                      </span>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {lead.status}
                  </Badge>
                </Link>
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
