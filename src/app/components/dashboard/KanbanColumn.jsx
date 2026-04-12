'use client';

import { useState } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/utils/pipeline';
import LeadCard from './LeadCard';

// Columns with more than this many leads collapse to top N + "Toon alle" button.
// This keeps "Bevestigd" (often 50+) from dominating the board.
const COLLAPSE_THRESHOLD = 6;

export default function KanbanColumn({ stageKey, leads, onStatusChange, onArchive, onDelete, busyLeadId }) {
  const stage = PIPELINE_STAGES[stageKey];
  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = leads.length > COLLAPSE_THRESHOLD && !expanded;
  const visibleLeads = shouldCollapse ? leads.slice(0, COLLAPSE_THRESHOLD) : leads;
  const hiddenCount = leads.length - visibleLeads.length;

  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px] bg-muted/50 rounded-lg">
      <div className="flex items-center justify-between px-3 py-2.5 border-b">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${stage.dotColor}`} />
          <h3 className="font-medium text-sm">{stage.label}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {leads.length}
        </Badge>
      </div>

      <Droppable droppableId={stageKey}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 p-2 min-h-[200px] transition-colors ${
              snapshot.isDraggingOver ? 'bg-muted' : ''
            }`}
          >
            {visibleLeads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided) => (
                  <LeadCard
                    lead={lead}
                    onStatusChange={onStatusChange}
                    onArchive={onArchive}
                    onDelete={onDelete}
                    busy={busyLeadId === lead.id}
                    provided={provided}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {leads.length > COLLAPSE_THRESHOLD && (
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3 w-3 mr-1" />
                Toon minder
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3 mr-1" />
                Toon alle {leads.length} ({hiddenCount} verborgen)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
