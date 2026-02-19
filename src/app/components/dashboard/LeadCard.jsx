'use client';

import { Card, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/app/components/ui/dropdown-menu';
import { Button } from '@/app/components/ui/button';
import { PIPELINE_STAGES, PROBLEEM_TYPES } from '@/lib/utils/pipeline';
import {
  getLastContactAt,
  getLeadRiskLevel,
  getLeadWarnings,
  getNextActionSummary,
  getStageAging,
} from '@/lib/utils/lead-workflow';
import { MoreHorizontal, Phone, MapPin, Calendar, MessageSquareText, ArrowRightCircle } from 'lucide-react';
import Link from 'next/link';

export default function LeadCard({ lead, onStatusChange, provided }) {
  const stageAging = getStageAging(lead);
  const warning = getLeadWarnings(lead);
  const riskLevel = getLeadRiskLevel(lead);
  const lastContactAt = getLastContactAt(lead);
  const nextAction = getNextActionSummary(lead);

  const riskClass = {
    laag: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    midden: 'bg-amber-50 text-amber-800 border-amber-200',
    hoog: 'bg-red-50 text-red-800 border-red-200',
  }[riskLevel];

  const warningClass =
    warning.level === 'critical'
      ? 'bg-red-100 text-red-800'
      : warning.level === 'warning'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-700';

  const afspraakLabel = lead.inspection_date
    ? `${new Date(`${lead.inspection_date}T12:00:00`).toLocaleDateString('nl-NL')}${lead.inspection_time ? ` om ${lead.inspection_time.slice(0, 5)}` : ''}`
    : 'Nog niet gepland';

  return (
    <div
      ref={provided?.innerRef}
      {...provided?.draggableProps}
      {...provided?.dragHandleProps}
    >
      <Card className="mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
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
                  <Link href={`/dashboard/offerte/nieuw?lead=${lead.id}`}>
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

          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3" />
              <span>{lead.plaatsnaam || 'Onbekende locatie'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3 w-3" />
              <span>{lead.phone}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MessageSquareText className="h-3 w-3" />
              <span>
                Laatste contact:{' '}
                {lastContactAt
                  ? lastContactAt.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
                  : 'Onbekend'}
              </span>
            </div>
            <div className="flex items-start gap-1.5">
              <ArrowRightCircle className="h-3 w-3 mt-0.5 shrink-0" />
              <span>
                Volgende stap: {nextAction.label}
                {nextAction.dueAt ? ` (uiterlijk ${nextAction.dueAt.toLocaleDateString('nl-NL')})` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3 w-3" />
              <span>Afspraak: {afspraakLabel}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
            {lead.type_probleem && (
              <Badge variant="outline" className="text-xs">
                {PROBLEEM_TYPES[lead.type_probleem] || lead.type_probleem}
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${riskClass}`}>
              Risico: {riskLevel}
            </Badge>
            {warning.level !== 'none' && (
              <Badge className={`text-xs ${warningClass}`}>
                {warning.level === 'critical' ? 'Kritiek' : 'Waarschuwing'}
              </Badge>
            )}
          </div>

          {stageAging.sla !== null && (
            <Badge
              className={`mt-2 text-xs ${
                stageAging.urgency === 'critical'
                  ? 'bg-red-100 text-red-800'
                  : stageAging.urgency === 'warning'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-700'
              }`}
            >
              {stageAging.daysInStage}d in fase
            </Badge>
          )}

          {warning.reasons.length > 0 && (
            <p
              className={`mt-2 rounded-md px-2 py-1 text-[11px] ${
                warning.level === 'critical'
                  ? 'bg-red-50 text-red-800'
                  : 'bg-amber-50 text-amber-800'
              }`}
            >
              {warning.reasons[0].message}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
