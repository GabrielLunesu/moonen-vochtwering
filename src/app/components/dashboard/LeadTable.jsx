'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/components/ui/table';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu';
import { PIPELINE_STAGES, PROBLEEM_TYPES } from '@/lib/utils/pipeline';
import { getStageAging, getLeadPriorityScore, isNeedsActionToday } from '@/lib/utils/lead-workflow';
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Phone, Archive, Trash2, AlertCircle } from 'lucide-react';

const COLUMNS = [
  { key: 'priority', label: '', sortable: false, width: 'w-6' },
  { key: 'name', label: 'Naam', sortable: true },
  { key: 'plaatsnaam', label: 'Stad', sortable: true },
  { key: 'phone', label: 'Telefoon', sortable: false },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'type_probleem', label: 'Probleem', sortable: true },
  { key: 'days_in_stage', label: 'Dagen in fase', sortable: true },
  { key: 'inspection_date', label: 'Inspectie', sortable: true },
  { key: 'actions', label: '', sortable: false },
];

function compareValues(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), 'nl', { sensitivity: 'base' });
}

function getSortValue(lead, key) {
  switch (key) {
    case 'name':
      return lead.name || '';
    case 'plaatsnaam':
      return lead.plaatsnaam || '';
    case 'status':
      return PIPELINE_STAGES[lead.status]?.order ?? 99;
    case 'type_probleem':
      return PROBLEEM_TYPES[lead.type_probleem] || '';
    case 'days_in_stage':
      return getStageAging(lead).daysInStage ?? 0;
    case 'inspection_date':
      return lead.inspection_date || '';
    default:
      return lead[key];
  }
}

export default function LeadTable({ leads, onStatusChange, onArchive, onDelete, busyLeadId }) {
  // Default sort: priority score desc (mirrors kanban ordering)
  const [sort, setSort] = useState({ key: 'priority', direction: 'desc' });

  const sortedLeads = useMemo(() => {
    const copy = [...leads];
    if (sort.key === 'priority') {
      copy.sort((a, b) => {
        const diff = getLeadPriorityScore(b) - getLeadPriorityScore(a);
        if (diff !== 0) return diff;
        const aTouch = new Date(a.stage_changed_at || a.updated_at || a.created_at || 0).getTime();
        const bTouch = new Date(b.stage_changed_at || b.updated_at || b.created_at || 0).getTime();
        return aTouch - bTouch;
      });
      return copy;
    }
    copy.sort((a, b) => {
      const result = compareValues(getSortValue(a, sort.key), getSortValue(b, sort.key));
      return sort.direction === 'asc' ? result : -result;
    });
    return copy;
  }, [leads, sort]);

  const toggleSort = (key) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' };
      if (prev.direction === 'asc') return { key, direction: 'desc' };
      return { key: 'priority', direction: 'desc' };
    });
  };

  const renderSortIcon = (key) => {
    if (sort.key !== key) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sort.direction === 'asc'
      ? <ArrowUp className="h-3 w-3" />
      : <ArrowDown className="h-3 w-3" />;
  };

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-muted/20 p-8 text-center text-sm text-muted-foreground">
        Geen leads gevonden voor deze zoekopdracht of filter.
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {COLUMNS.map((col) => (
              <TableHead key={col.key} className={col.width}>
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                  >
                    {col.label}
                    {renderSortIcon(col.key)}
                  </button>
                ) : (
                  col.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLeads.map((lead) => {
            const stage = PIPELINE_STAGES[lead.status];
            const aging = getStageAging(lead);
            const needsAction = isNeedsActionToday(lead);
            const afspraakLabel = lead.inspection_date
              ? `${new Date(`${lead.inspection_date}T12:00:00`).toLocaleDateString('nl-NL')}${lead.inspection_time ? ` ${lead.inspection_time.slice(0, 5)}` : ''}`
              : '—';

            return (
              <TableRow key={lead.id} className="group">
                <TableCell>
                  {needsAction && (
                    <span title="Actie nodig" className="inline-flex">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  <Link
                    href={`/dashboard/lead/${lead.id}`}
                    className="hover:underline"
                  >
                    {lead.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{lead.plaatsnaam || '—'}</TableCell>
                <TableCell>
                  <a
                    href={`tel:${lead.phone}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                  >
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </a>
                </TableCell>
                <TableCell>
                  {stage && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${stage.dotColor}`} />
                      <span className="text-xs">{stage.label}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {lead.type_probleem ? (
                    <Badge variant="outline" className="text-[11px] px-1.5 py-0">
                      {PROBLEEM_TYPES[lead.type_probleem] || lead.type_probleem}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {aging.sla !== null ? (
                    <Badge
                      variant="outline"
                      className={`text-[11px] px-1.5 py-0 ${
                        aging.urgency === 'critical'
                          ? 'border-red-300 text-red-700'
                          : aging.urgency === 'warning'
                            ? 'border-amber-300 text-amber-700'
                            : ''
                      }`}
                    >
                      {aging.daysInStage}d
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{afspraakLabel}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/lead/${lead.id}`}>Bekijk details</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/offerte/builder?lead=${lead.id}`}>
                          Maak offerte
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild disabled={busyLeadId === lead.id}>
                        <a href={`tel:${lead.phone}`}>Bel {lead.name}</a>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {Object.entries(PIPELINE_STAGES)
                        .filter(([key]) => key !== lead.status)
                        .map(([key, value]) => (
                          <DropdownMenuItem
                            key={key}
                            disabled={busyLeadId === lead.id}
                            onClick={() => onStatusChange(lead.id, key)}
                          >
                            Verplaats naar {value.label}
                          </DropdownMenuItem>
                        ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        disabled={busyLeadId === lead.id}
                        onClick={() => onArchive?.(lead)}
                      >
                        <Archive className="h-3.5 w-3.5 mr-2" />
                        Archiveren
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={busyLeadId === lead.id}
                        onClick={() => onDelete?.(lead)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Definitief verwijderen
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
