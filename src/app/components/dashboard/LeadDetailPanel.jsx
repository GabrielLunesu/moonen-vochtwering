'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Separator } from '@/app/components/ui/separator';
import { Textarea } from '@/app/components/ui/textarea';
import { PIPELINE_STAGES, PROBLEEM_TYPES } from '@/lib/utils/pipeline';
import {
  buildCommunicationSnapshot,
  getAvailableActions,
  getPrimaryAction,
  getStageAging,
} from '@/lib/utils/lead-workflow';
import LeadTimeline from './LeadTimeline';
import { toast } from 'sonner';
import {
  Phone,
  Mail,
  MapPin,
  Send,
  PauseCircle,
  PlayCircle,
  FileText,
  ArrowRight,
  Eye,
  ClipboardList,
} from 'lucide-react';

const ACTION_ICONS = { Send, PauseCircle, PlayCircle, FileText, ArrowRight, Eye, ClipboardList };

const MAIL_TYPE_LABELS = {
  availability: 'Beschikbaarheid',
  confirmation: 'Bevestiging',
  quote: 'Offerte',
  follow_up: 'Follow-up',
};

const RESPONSE_LABELS = {
  akkoord: 'Akkoord',
  vraag: 'Vraag',
  nee: 'Niet akkoord',
};

export default function LeadDetailPanel({ lead: initialLead, initialEvents = [], initialEmailLog = [] }) {
  const router = useRouter();

  const [lead, setLead] = useState(initialLead);
  const [events, setEvents] = useState(initialEvents);
  const [emailLog, setEmailLog] = useState(initialEmailLog);
  const [notes, setNotes] = useState(initialLead.inspection_notes || '');
  const [saving, setSaving] = useState(false);
  const [togglingFollowup, setTogglingFollowup] = useState(false);
  const [runningPrimaryAction, setRunningPrimaryAction] = useState(false);
  const [sendingQuote, setSendingQuote] = useState(false);

  const stage = PIPELINE_STAGES[lead.status];
  const stageAging = useMemo(() => getStageAging(lead), [lead]);
  const communication = useMemo(
    () => buildCommunicationSnapshot(lead, emailLog),
    [lead, emailLog]
  );
  const deliveredChips = useMemo(() => {
    const chips = [];
    if (communication.availabilitySent) chips.push('Beschikbaarheid');
    if (communication.confirmationSent) chips.push('Bevestiging');
    if (communication.quoteSent) chips.push('Offerte');
    if (communication.followUpCount > 0) chips.push(`Follow-up x${communication.followUpCount}`);
    if (communication.customerResponse) {
      chips.push(`Reactie: ${RESPONSE_LABELS[communication.customerResponse] || communication.customerResponse}`);
    }
    return chips;
  }, [communication]);

  const lastEvent = events.length > 0 ? events[events.length - 1] : null;

  const refreshLeadData = async () => {
    try {
      const [leadRes, eventsRes, emailRes] = await Promise.all([
        fetch(`/api/leads/${lead.id}`),
        fetch(`/api/leads/${lead.id}/events`),
        fetch(`/api/leads/${lead.id}/emails`),
      ]);

      if (leadRes.ok) {
        const payload = await leadRes.json();
        setLead(payload);
      }

      if (eventsRes.ok) {
        const payload = await eventsRes.json();
        setEvents(payload);
      }

      if (emailRes.ok) {
        const payload = await emailRes.json();
        setEmailLog(payload);
      }
    } catch {
      // Silent; avoid blocking UI actions if refresh fails.
    }
  };

  const saveNotes = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspection_notes: notes }),
      });
      if (!res.ok) throw new Error();
      toast.success('Notities opgeslagen');
      refreshLeadData();
    } catch {
      toast.error('Kon notities niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  const sendAvailability = async () => {
    const res = await fetch(`/api/leads/${lead.id}/send-availability`, {
      method: 'POST',
    });
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 409 && payload?.code === 'NO_AVAILABILITY') {
        throw new Error('Geen beschikbare momenten. Open eerst beschikbaarheid in de planning.');
      }
      throw new Error(payload?.error || 'Kon beschikbaarheidsmail niet verzenden');
    }

    setLead(payload);
  };

  const sendQuote = async () => {
    setSendingQuote(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/send-quote`, {
        method: 'POST',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload?.error || 'Kon offerte niet verzenden');

      setLead(payload);
      toast.success('Offerte verzonden');
      refreshLeadData();
    } catch (error) {
      toast.error(error?.message || 'Offerte verzenden mislukt');
    } finally {
      setSendingQuote(false);
    }
  };

  const toggleFollowupPaused = async () => {
    setTogglingFollowup(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followup_paused: !lead.followup_paused }),
      });

      if (!res.ok) throw new Error();
      const updated = await res.json();
      setLead(updated);
      toast.success(updated.followup_paused ? 'Automatische opvolging gepauzeerd' : 'Automatische opvolging hervat');
      refreshLeadData();
    } catch {
      toast.error('Kon opvolging niet aanpassen');
    } finally {
      setTogglingFollowup(false);
    }
  };

  const availableActions = useMemo(
    () => getAvailableActions(lead, communication),
    [lead, communication]
  );

  const runAction = async (key) => {
    setRunningPrimaryAction(true);
    try {
      switch (key) {
        case 'send_availability':
          await sendAvailability();
          toast.success('Beschikbaarheid e-mail verzonden');
          await refreshLeadData();
          break;
        case 'start_inspection':
        case 'edit_inspection':
          router.push(`/dashboard/inspectie/${lead.id}`);
          break;
        case 'preview_quote':
          window.open(`/api/pdf/quote/${lead.id}`, '_blank');
          break;
        case 'send_quote':
          await sendQuote();
          break;
        case 'toggle_followup':
          await toggleFollowupPaused();
          break;
        default:
          toast.info('Geen actie beschikbaar');
      }
    } catch (error) {
      toast.error(error?.message || 'Actie mislukt');
    } finally {
      setRunningPrimaryAction(false);
    }
  };

  // Keep backward compat: runPrimaryAction dispatches to first available action
  const runPrimaryAction = async () => {
    const first = availableActions[0];
    if (first) {
      await runAction(first.key);
    } else {
      toast.info('Geen directe actie beschikbaar voor deze fase.');
    }
  };

  const stageUrgencyClass =
    stageAging.urgency === 'critical'
      ? 'bg-red-100 text-red-800'
      : stageAging.urgency === 'warning'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-700';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Lead ID: {lead.id}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge className={stage.color}>{stage.label}</Badge>
            {lead.type_probleem && (
              <Badge variant="outline">
                {PROBLEEM_TYPES[lead.type_probleem] || lead.type_probleem}
              </Badge>
            )}
            {lead.followup_paused && <Badge variant="secondary">Opvolging gepauzeerd</Badge>}
            {stageAging.sla !== null && (
              <Badge className={stageUrgencyClass}>{stageAging.daysInStage}d in fase</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Klant ontvangen:</span>
            {deliveredChips.length > 0 ? (
              deliveredChips.map((chip) => (
                <Badge key={chip} variant="outline" className="text-xs">
                  {chip}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary" className="text-xs">
                Nog niets verzonden
              </Badge>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {availableActions.map((action, idx) => {
            const Icon = ACTION_ICONS[action.icon] || ArrowRight;
            const isFirst = idx === 0;
            return (
              <Button
                key={action.key}
                variant={isFirst ? 'default' : (action.variant || 'outline')}
                style={isFirst ? { backgroundColor: '#355b23' } : undefined}
                onClick={() => runAction(action.key)}
                disabled={runningPrimaryAction || (action.key === 'send_quote' && sendingQuote) || (action.key === 'toggle_followup' && togglingFollowup)}
              >
                <Icon className="h-4 w-4 mr-2" />
                {(action.key === 'send_quote' && sendingQuote) ? 'Verzenden...' : action.label}
              </Button>
            );
          })}

          <Button variant="outline" asChild>
            <a href={`tel:${lead.phone}`}>
              <Phone className="h-4 w-4 mr-2" />
              Bel
            </a>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Huidige fase</p>
            <p className="font-semibold">{stage.label}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Volgende stap</p>
            <p className="font-semibold">{getPrimaryAction(lead)}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Laatste gebeurtenis</p>
            <p className="font-semibold">{lastEvent ? lastEvent.event_type : 'Geen events'}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-muted-foreground">Laatste mail</p>
            <p className="font-semibold">
              {communication.lastEmailAt
                ? new Date(communication.lastEmailAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Nog niets verzonden'}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <a href={`tel:${lead.phone}`} className="text-sm hover:underline">
                {lead.phone}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <a href={`mailto:${lead.email}`} className="text-sm hover:underline truncate">
                {lead.email}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {lead.plaatsnaam} {lead.postcode || ''}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Tijdlijn</TabsTrigger>
          <TabsTrigger value="communication">Communicatie</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="notes">Notities</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <LeadTimeline events={events} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="rounded-md border p-3 flex items-center justify-between">
                  <span>Beschikbaarheid mail</span>
                  <Badge variant={communication.availabilitySent ? 'default' : 'secondary'}>
                    {communication.availabilitySent ? 'Verzonden' : 'Niet verzonden'}
                  </Badge>
                </div>
                <div className="rounded-md border p-3 flex items-center justify-between">
                  <span>Bevestigingsmail</span>
                  <Badge variant={communication.confirmationSent ? 'default' : 'secondary'}>
                    {communication.confirmationSent ? 'Verzonden' : 'Niet verzonden'}
                  </Badge>
                </div>
                <div className="rounded-md border p-3 flex items-center justify-between">
                  <span>Offerte mail</span>
                  <Badge variant={communication.quoteSent ? 'default' : 'secondary'}>
                    {communication.quoteSent ? 'Verzonden' : 'Niet verzonden'}
                  </Badge>
                </div>
                <div className="rounded-md border p-3 flex items-center justify-between">
                  <span>Follow-ups</span>
                  <Badge variant="outline">{communication.followUpCount}</Badge>
                </div>
                <div className="rounded-md border p-3 flex items-center justify-between md:col-span-2">
                  <span>Klantreactie op offerte</span>
                  <Badge variant={communication.customerResponse ? 'default' : 'secondary'}>
                    {communication.customerResponse || 'Nog geen reactie'}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Verzendhistorie</h3>
                {emailLog.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nog geen mailverzendingen geregistreerd.</p>
                ) : (
                  emailLog.map((entry) => (
                    <div key={entry.id} className="rounded-md border p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{MAIL_TYPE_LABELS[entry.type] || entry.type}</p>
                        <p className="text-xs text-muted-foreground">{entry.subject}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.created_at).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Bericht</h3>
                <p className="text-sm">{lead.message || 'Geen bericht'}</p>
              </div>
              <Separator />
              {lead.diagnose && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Diagnose</h3>
                    <p className="text-sm">{lead.diagnose}</p>
                  </div>
                  <Separator />
                </>
              )}
              {lead.oplossing && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Oplossing</h3>
                    <p className="text-sm">{lead.oplossing}</p>
                  </div>
                  <Separator />
                </>
              )}
              {lead.inspection_date && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Inspectie gepland</h3>
                    <p className="text-sm">
                      {new Date(`${lead.inspection_date}T12:00:00`).toLocaleDateString('nl-NL')} {lead.inspection_time || ''}
                    </p>
                  </div>
                  <Separator />
                </>
              )}
              {lead.quote_amount && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">Offerte</h3>
                  <p className="text-sm font-bold">
                    €{Number(lead.quote_amount).toLocaleString('nl-NL', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Textarea
                placeholder="Notities over deze lead..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={6}
              />
              <Button onClick={saveNotes} disabled={saving} style={{ backgroundColor: '#355b23' }}>
                {saving ? 'Opslaan...' : 'Opslaan'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
