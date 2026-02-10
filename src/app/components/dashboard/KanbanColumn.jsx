'use client';

import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Badge } from '@/app/components/ui/badge';
import { PIPELINE_STAGES } from '@/lib/utils/pipeline';
import LeadCard from './LeadCard';

export default function KanbanColumn({ stageKey, leads, onStatusChange }) {
  const stage = PIPELINE_STAGES[stageKey];

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
            {leads.map((lead, index) => (
              <Draggable key={lead.id} draggableId={lead.id} index={index}>
                {(provided) => (
                  <LeadCard
                    lead={lead}
                    onStatusChange={onStatusChange}
                    provided={provided}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
