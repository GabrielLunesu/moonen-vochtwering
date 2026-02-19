'use client';

import { Mail, Calendar, CheckCircle, PauseCircle, Clock, PenLine, FileText } from 'lucide-react';
import { PIPELINE_STAGES } from '@/lib/utils/pipeline';

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

const EVENT_CONFIG = {
  lead_received: {
    title: 'Lead binnengekomen via website',
    icon: Mail,
  },
  email_sent: {
    title: 'E-mail verzonden',
    icon: Mail,
  },
  status_change: {
    title: 'Status gewijzigd',
    icon: CheckCircle,
  },
  slot_booked: {
    title: 'Inspectieslot bevestigd',
    icon: Calendar,
  },
  customer_response: {
    title: 'Klantreactie ontvangen',
    icon: CheckCircle,
  },
  followup_pause_changed: {
    title: 'Follow-up pauze aangepast',
    icon: PauseCircle,
  },
  manual_edit: {
    title: 'Leadgegevens bijgewerkt',
    icon: PenLine,
  },
  quote_generated: {
    title: 'Offerte gegenereerd',
    icon: FileText,
  },
};

function humanizeStatus(status) {
  if (!status) return 'Onbekend';
  return PIPELINE_STAGES[status]?.label || status;
}

function humanizeActor(actor) {
  if (!actor || actor === 'system') return 'Systeem';
  if (actor === 'customer') return 'Klant';
  if (actor.toLowerCase() === 'gabriel') return 'Gabriel';
  if (actor.includes('@')) {
    const name = actor.split('@')[0].replace(/[._-]+/g, ' ').trim();
    if (!name) return actor;
    return name
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
  return actor;
}

function formatTitle(event) {
  if (event.event_type === 'status_change') {
    return `Status: ${humanizeStatus(event.old_value)} -> ${humanizeStatus(event.new_value)}`;
  }

  if (event.event_type === 'email_sent') {
    const typeLabel = MAIL_TYPE_LABELS[event.metadata?.type] || 'E-mail';
    return `${typeLabel} verzonden`;
  }

  if (event.event_type === 'customer_response') {
    const responseLabel = RESPONSE_LABELS[event.new_value] || event.new_value || 'Reactie';
    return `Klantreactie: ${responseLabel}`;
  }

  if (event.event_type === 'followup_pause_changed') {
    return event.new_value === 'true' ? 'Opvolging gepauzeerd' : 'Opvolging hervat';
  }

  if (event.event_type === 'quote_generated') {
    const quoteNumber = event.metadata?.quote_number;
    return quoteNumber ? `Offerte gegenereerd (${quoteNumber})` : 'Offerte gegenereerd';
  }

  return EVENT_CONFIG[event.event_type]?.title || event.event_type;
}

function formatDescription(event) {
  if (event.event_type === 'email_sent') {
    const type = event.metadata?.type;
    const subject = event.metadata?.subject;
    const toEmail = event.metadata?.to_email;
    return [
      type ? `Type: ${MAIL_TYPE_LABELS[type] || type}` : null,
      subject ? `Onderwerp: ${subject}` : null,
      toEmail ? `Naar: ${toEmail}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  if (event.event_type === 'slot_booked') {
    const date = event.metadata?.date;
    const time = event.metadata?.time;
    if (!date || !time) return null;
    const formattedDate = new Date(`${date}T12:00:00`).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${formattedDate} om ${time}`;
  }

  if (event.event_type === 'customer_response') {
    return event.metadata?.note || null;
  }

  if (event.event_type === 'followup_pause_changed') {
    return event.new_value === 'true' ? 'Automatische opvolging gepauzeerd' : 'Automatische opvolging hervat';
  }

  if (event.event_type === 'manual_edit') {
    const changed = event.metadata?.changed_keys;
    if (!Array.isArray(changed) || changed.length === 0) return null;
    return `Gewijzigd: ${changed.join(', ')}`;
  }

  if (event.event_type === 'quote_generated') {
    const amount = event.metadata?.amount;
    if (!amount) return null;
    const formatted = new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
    return `Bedrag: ${formatted} (excl. BTW)`;
  }

  return null;
}

export default function LeadTimeline({ events = [] }) {
  if (!events.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Nog geen gebeurtenissen voor deze lead.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {events.map((event, index) => {
        const config = EVENT_CONFIG[event.event_type] || {
          title: formatTitle(event),
          icon: Clock,
        };

        const description = formatDescription(event);
        const Icon = config.icon;

        return (
          <div key={event.id || `${event.event_type}-${index}`} className="flex gap-3 pb-6 last:pb-0">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              {index < events.length - 1 && <div className="w-px flex-1 bg-border mt-2" />}
            </div>
            <div className="pt-1">
              <p className="text-sm font-medium">{formatTitle(event)}</p>
              {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
              <p className="text-xs text-muted-foreground mt-1">door {humanizeActor(event.actor)}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {new Date(event.created_at).toLocaleDateString('nl-NL', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
