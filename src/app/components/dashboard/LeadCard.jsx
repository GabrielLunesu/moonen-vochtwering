'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Button } from '@/app/components/ui/button';
import { PIPELINE_STAGES, PROBLEEM_TYPES } from '@/lib/utils/pipeline';
import { getStageAging } from '@/lib/utils/lead-workflow';
import { MoreHorizontal, Phone, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function LeadCard({ lead, onStatusChange, provided }) {
  const stageAging = getStageAging(lead);

  const afspraakLabel = lead.inspection_date
    ? `${new Date(`${lead.inspection_date}T12:00:00`).toLocaleDateString('nl-NL')}${lead.inspection_time ? ` om ${lead.inspection_time.slice(0, 5)}` : ''}`
    : null;

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
    >
      <Card className="mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-1.5">
            <Link
              href={`/dashboard/lead/${lead.id}`}
              className="font-medium text-sm hover:underline truncate mr-2"
            >
              {lead.name}
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/lead/${lead.id}`}>
                    Bekijk details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/offerte/builder?lead=${lead.id}`}>
                    Maak offerte
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={`tel:${lead.phone}`}>
                    Bel {lead.name}
                  </a>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {Object.entries(PIPELINE_STAGES)
                  .filter(([key]) => key !== lead.status)
                  .map(([key, value]) => (
                    <DropdownMenuItem
                      key={key}
                      onClick={() => onStatusChange(lead.id, key)}
                    >
                      Verplaats naar {value.label}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="space-y-0.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{lead.plaatsnaam || '—'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3 shrink-0" />
              <span>{lead.phone}</span>
            </div>
            {afspraakLabel && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>{afspraakLabel}</span>
              </div>
            )}
          </div>

          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {lead.type_probleem && (
              <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                {PROBLEEM_TYPES[lead.type_probleem] || lead.type_probleem}
              </Badge>
            )}
            {stageAging.sla !== null && (
              <Badge
                variant="outline"
                className={`text-[11px] px-1.5 py-0 ${
                  stageAging.urgency === 'critical'
                    ? 'border-red-300 text-red-700'
                    : stageAging.urgency === 'warning'
                      ? 'border-amber-300 text-amber-700'
                      : ''
                }`}
              >
                {stageAging.daysInStage}d
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
