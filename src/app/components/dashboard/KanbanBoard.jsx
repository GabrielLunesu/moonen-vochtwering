'use client';

import { useState, useEffect, useCallback } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase/client';
import { STAGE_ORDER } from '@/lib/utils/pipeline';
import { getLeadPriorityScore, isNeedsActionToday } from '@/lib/utils/lead-workflow';
import { toast } from 'sonner';
import KanbanColumn from './KanbanColumn';
import PipelineStats from './PipelineStats';
import NewLeadDialog from './NewLeadDialog';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Button } from '@/app/components/ui/button';
import { Plus } from 'lucide-react';

const FILTER_STORAGE_KEY = 'crm.dashboard.filter.v1';

function daysSince(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return 0;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)));
}

export default function KanbanBoard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setLeads(data);
    } catch {
      toast.error('Kon leads niet laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (stored && ['all', 'needs_action', 'no_response_3d', 'waiting_quote_response'].includes(stored)) {
        setActiveFilter(stored);
      }
    } catch {
      // Ignore storage access issues.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(FILTER_STORAGE_KEY, activeFilter);
    } catch {
      // Ignore storage access issues.
    }
  }, [activeFilter]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('leads-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setLeads(prev => [payload.new, ...prev]);
            toast.success(`Nieuwe lead: ${payload.new.name}`);
          } else if (payload.eventType === 'UPDATE') {
            setLeads(prev =>
              prev.map(l => (l.id === payload.new.id ? payload.new : l))
            );
          } else if (payload.eventType === 'DELETE') {
            setLeads(prev => prev.filter(l => l.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const updateLeadStatus = async (leadId, newStatus) => {
    // Optimistic update
    setLeads(prev =>
      prev.map(l => (l.id === leadId ? { ...l, status: newStatus } : l))
    );

    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Failed to update');
    } catch {
      toast.error('Kon status niet bijwerken');
      fetchLeads(); // Revert on error
    }
  };

  const handleDragEnd = (result) => {
    const { destination, draggableId } = result;
    if (!destination) return;

    const newStatus = destination.droppableId;
    const lead = leads.find(l => l.id === draggableId);
    if (!lead || lead.status === newStatus) return;

    updateLeadStatus(draggableId, newStatus);
  };

  const visibleLeads = leads.filter((lead) => {
    if (activeFilter === 'all') return true;

    if (activeFilter === 'needs_action') {
      return isNeedsActionToday(lead);
    }

    if (activeFilter === 'waiting_quote_response') {
      return lead.status === 'offerte_verzonden' && !lead.quote_response;
    }

    if (activeFilter === 'no_response_3d') {
      const waitingStatus = lead.status === 'uitgenodigd' || lead.status === 'offerte_verzonden';
      if (!waitingStatus) return false;
      if (lead.status === 'offerte_verzonden' && lead.quote_response) return false;
      const lastTouchAt = lead.last_email_at || lead.stage_changed_at || lead.updated_at || lead.created_at;
      return daysSince(lastTouchAt) >= 3;
    }

    return true;
  });

  const leadsByStage = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = visibleLeads
      .filter((lead) => lead.status === stage)
      .sort((a, b) => {
        const scoreDiff = getLeadPriorityScore(b) - getLeadPriorityScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        const aTouch = new Date(a.stage_changed_at || a.updated_at || a.created_at || 0).getTime();
        const bTouch = new Date(b.stage_changed_at || b.updated_at || b.created_at || 0).getTime();
        return aTouch - bTouch;
      });
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="min-w-[280px] h-96 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <PipelineStats leads={leads} />

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          style={{ backgroundColor: '#355b23' }}
          onClick={() => setNewLeadOpen(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Nieuwe aanvraag
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          variant={activeFilter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('all')}
        >
          Alle leads
        </Button>
        <Button
          variant={activeFilter === 'needs_action' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('needs_action')}
        >
          Actie nodig
        </Button>
        <Button
          variant={activeFilter === 'no_response_3d' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('no_response_3d')}
        >
          Geen reactie &gt;3d
        </Button>
        <Button
          variant={activeFilter === 'waiting_quote_response' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveFilter('waiting_quote_response')}
        >
          Wacht op offerte reactie
        </Button>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGE_ORDER.map(stage => (
            <KanbanColumn
              key={stage}
              stageKey={stage}
              leads={leadsByStage[stage]}
              onStatusChange={updateLeadStatus}
            />
          ))}
        </div>
      </DragDropContext>

      <NewLeadDialog open={newLeadOpen} onOpenChange={setNewLeadOpen} />
    </div>
  );
}
