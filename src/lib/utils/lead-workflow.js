export const STAGE_SLA_DAYS = {
  nieuw: 1,
  uitgenodigd: 3,
  bevestigd: 2,
  bezocht: 2,
  offerte_verzonden: 3,
  akkoord: null,
  verloren: null,
};

const MS_PER_DAY = 1000 * 60 * 60 * 24;

const STAGE_LABELS = {
  nieuw: 'Nieuw',
  uitgenodigd: 'Uitgenodigd',
  bevestigd: 'Bevestigd',
  bezocht: 'Bezocht',
  offerte_verzonden: 'Offerte verzonden',
  akkoord: 'Akkoord',
  verloren: 'Verloren',
};

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function normalizeDateOnly(value) {
  if (!value) return null;
  if (typeof value === 'string' && value.length === 10) {
    return toDate(`${value}T12:00:00`);
  }
  return toDate(value);
}

function addDays(value, days) {
  const date = toDate(value) || new Date();
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function getDaysUntil(dateInput) {
  const date = normalizeDateOnly(dateInput);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / MS_PER_DAY);
}

function getHighestSeverity(reasons = []) {
  if (reasons.some((reason) => reason.severity === 'critical')) return 'critical';
  if (reasons.some((reason) => reason.severity === 'warning')) return 'warning';
  return 'none';
}

export function getStageStartDate(lead) {
  return (
    toDate(lead?.stage_changed_at) ||
    toDate(lead?.updated_at) ||
    toDate(lead?.created_at) ||
    new Date()
  );
}

export function getDaysSince(dateInput) {
  const date = toDate(dateInput);
  if (!date) return 0;
  const diffMs = Date.now() - date.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

export function getStageAging(lead) {
  const stage = lead?.status;
  const sla = STAGE_SLA_DAYS[stage] ?? null;
  const stageStart = getStageStartDate(lead);
  const daysInStage = getDaysSince(stageStart);

  if (sla === null) {
    return {
      daysInStage,
      sla,
      urgency: 'none',
      needsAction: false,
      stageStart,
    };
  }

  const urgency = daysInStage >= sla + 2 ? 'critical' : daysInStage >= sla ? 'warning' : 'ok';

  return {
    daysInStage,
    sla,
    urgency,
    needsAction: urgency !== 'ok',
    stageStart,
  };
}

export function getPrimaryAction(lead) {
  switch (lead?.status) {
    case 'nieuw':
      return 'Stuur beschikbaarheid';
    case 'uitgenodigd':
      return 'Wacht op bevestiging';
    case 'bevestigd':
      return 'Maak offerte';
    case 'bezocht':
      return 'Verstuur offerte';
    case 'offerte_verzonden':
      return lead?.followup_paused ? 'Hervat opvolging' : 'Bewaak reactie';
    case 'akkoord':
      return 'Plan uitvoering';
    case 'verloren':
      return 'Geen actie';
    default:
      return 'Controleer lead';
  }
}

export function buildCommunicationSnapshot(lead, emailLog = []) {
  const countByType = emailLog.reduce((acc, row) => {
    const key = row.type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const lastEmail = [...emailLog].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )[0];

  return {
    availabilitySent: (countByType.availability || 0) > 0,
    confirmationSent: (countByType.confirmation || 0) > 0,
    quoteSent: (countByType.quote || 0) > 0,
    followUpCount: countByType.follow_up || 0,
    customerResponse: lead?.quote_response || null,
    lastEmailAt: lastEmail?.created_at || null,
  };
}

export function isNeedsActionToday(lead) {
  const warning = getLeadWarnings(lead);
  return warning.level !== 'none';
}

const STAGE_INDEX = {
  nieuw: 0,
  uitgenodigd: 1,
  bevestigd: 2,
  bezocht: 3,
  offerte_verzonden: 4,
  akkoord: 5,
  verloren: 6,
};

export function getStageIndex(status) {
  return STAGE_INDEX[status] ?? -1;
}

export function getAvailableActions(lead, communication = {}, linkedQuotes = []) {
  const status = lead?.status;
  const actions = [];

  // send_availability: available on nieuw, uitgenodigd, bevestigd
  if (['nieuw', 'uitgenodigd', 'bevestigd'].includes(status)) {
    const label = communication.availabilitySent ? 'Herstuur beschikbaarheid' : 'Stuur beschikbaarheid';
    actions.push({ key: 'send_availability', label, icon: 'Send', variant: 'default' });
  }

  // Quote actions: create or edit — available from bevestigd onward (except verloren)
  if (['bevestigd', 'bezocht', 'offerte_verzonden', 'akkoord'].includes(status)) {
    if (linkedQuotes.length > 0) {
      const latest = linkedQuotes[0]; // already sorted desc by created_at
      actions.push({
        key: 'edit_quote',
        label: 'Bewerk offerte',
        icon: 'FileText',
        variant: 'default',
        quoteId: latest.id,
      });
    } else {
      actions.push({ key: 'create_quote', label: 'Maak offerte', icon: 'FileText', variant: 'default' });
    }
  }

  // send_followup: manual follow-up for offerte_verzonden without customer response
  if (status === 'offerte_verzonden' && !lead?.quote_response && (lead?.follow_up_count || 0) < 3) {
    actions.push({
      key: 'send_followup',
      label: `Stuur follow-up ${(lead?.follow_up_count || 0) + 1}/3`,
      icon: 'Send',
      variant: 'default',
    });
  }

  return actions;
}

export function getLastContactAt(lead) {
  const candidates = [
    lead?.quote_response_at,
    lead?.last_email_at,
    lead?.quote_sent_at,
    lead?.stage_changed_at,
    lead?.updated_at,
    lead?.created_at,
  ]
    .map((value) => toDate(value))
    .filter(Boolean);

  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((date) => date.getTime())));
}

export function getNextActionSummary(lead) {
  const stageStart = getStageStartDate(lead);

  switch (lead?.status) {
    case 'nieuw':
      return {
        label: 'Stuur beschikbaarheid',
        dueAt: addDays(stageStart, STAGE_SLA_DAYS.nieuw),
      };
    case 'uitgenodigd':
      return {
        label: 'Bel voor bevestiging',
        dueAt: addDays(stageStart, STAGE_SLA_DAYS.uitgenodigd),
      };
    case 'bevestigd':
      if (!lead?.inspection_date) {
        return {
          label: 'Plan inspectie',
          dueAt: addDays(stageStart, 1),
        };
      }
      if (!lead?.route_position || !lead?.inspection_time) {
        return {
          label: 'Rond planning af',
          dueAt: normalizeDateOnly(lead.inspection_date),
        };
      }
      return {
        label: 'Inspectie uitvoeren',
        dueAt: normalizeDateOnly(lead.inspection_date),
      };
    case 'bezocht':
      return {
        label: lead?.quote_amount > 0 ? 'Verstuur offerte' : 'Vul offertebedrag in',
        dueAt: addDays(stageStart, 1),
      };
    case 'offerte_verzonden':
      if (lead?.quote_response) {
        return {
          label: 'Reactie verwerkt',
          dueAt: null,
        };
      }
      return {
        label: 'Volg offerte op',
        dueAt: addDays(lead?.quote_sent_at || stageStart, 3),
      };
    case 'akkoord':
      return {
        label: 'Plan uitvoering',
        dueAt: addDays(stageStart, 2),
      };
    case 'verloren':
      return {
        label: 'Geen actie',
        dueAt: null,
      };
    default:
      return {
        label: 'Controleer lead',
        dueAt: null,
      };
  }
}

export function getLeadWarnings(lead) {
  const stageAging = getStageAging(lead);
  const reasons = [];

  if (stageAging.urgency === 'warning' || stageAging.urgency === 'critical') {
    reasons.push({
      code: 'te_lang_in_fase',
      severity: stageAging.urgency,
      message: `Al ${stageAging.daysInStage} dagen in fase ${STAGE_LABELS[lead?.status] || 'Onbekend'}.`,
    });
  }

  if (lead?.status === 'offerte_verzonden' && !lead?.quote_response) {
    const daysWithoutResponse = getDaysSince(lead?.quote_sent_at || getStageStartDate(lead));
    if (daysWithoutResponse >= 3) {
      reasons.push({
        code: 'offerte_geen_reactie',
        severity: daysWithoutResponse >= 7 ? 'critical' : 'warning',
        message: `Offerte ${daysWithoutResponse} dagen zonder klantreactie.`,
      });
    }
  }

  if (lead?.status === 'bevestigd' && !lead?.inspection_date) {
    reasons.push({
      code: 'inspectie_niet_gepland',
      severity: 'warning',
      message: 'Inspectie is nog niet ingepland.',
    });
  }

  if (['bevestigd', 'bezocht', 'offerte_verzonden'].includes(lead?.status) && lead?.inspection_date) {
    const daysUntilInspection = getDaysUntil(lead.inspection_date);
    const hasRoute = Number.isInteger(lead?.route_position) && lead.route_position > 0;
    const hasTime = Boolean(lead?.inspection_time);

    if (daysUntilInspection === 1) {
      if (!hasRoute && !hasTime) {
        reasons.push({
          code: 'inspectie_morgen_niet_ingedeeld',
          severity: 'critical',
          message: 'Inspectie morgen zonder routepositie en tijd.',
        });
      } else if (!hasRoute) {
        reasons.push({
          code: 'inspectie_morgen_geen_route',
          severity: 'warning',
          message: 'Inspectie morgen zonder routepositie.',
        });
      } else if (!hasTime) {
        reasons.push({
          code: 'inspectie_morgen_geen_tijd',
          severity: 'warning',
          message: 'Inspectie morgen zonder tijdslot.',
        });
      }
    }
  }

  return {
    level: getHighestSeverity(reasons),
    reasons,
  };
}

export function getLeadRiskLevel(lead) {
  if (['akkoord', 'verloren'].includes(lead?.status)) return 'laag';

  const warning = getLeadWarnings(lead);
  if (warning.level === 'critical') return 'hoog';
  if (warning.level === 'warning') return 'midden';

  if (lead?.status === 'offerte_verzonden' && !lead?.quote_response) return 'midden';
  return 'laag';
}

export function getLeadPriorityScore(lead) {
  const stageAging = getStageAging(lead);
  const warning = getLeadWarnings(lead);

  let score = 0;

  if (warning.level === 'critical') score += 120;
  else if (warning.level === 'warning') score += 70;

  if (lead?.status === 'offerte_verzonden' && !lead?.quote_response) score += 20;
  if (stageAging.urgency === 'critical') score += 20;
  else if (stageAging.urgency === 'warning') score += 10;

  score += Math.min(stageAging.daysInStage, 30);

  return score;
}
