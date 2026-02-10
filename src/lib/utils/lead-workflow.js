export const STAGE_SLA_DAYS = {
  nieuw: 1,
  uitgenodigd: 3,
  bevestigd: 2,
  bezocht: 2,
  offerte_verzonden: 3,
  akkoord: null,
  verloren: null,
};

function toDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
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
      return 'Start inspectie';
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
  const { needsAction } = getStageAging(lead);
  return needsAction;
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

export function getAvailableActions(lead, communication = {}) {
  const status = lead?.status;
  const actions = [];

  // send_availability: available on nieuw, uitgenodigd, bevestigd
  if (['nieuw', 'uitgenodigd', 'bevestigd'].includes(status)) {
    const label = communication.availabilitySent ? 'Herstuur beschikbaarheid' : 'Stuur beschikbaarheid';
    actions.push({ key: 'send_availability', label, icon: 'Send', variant: 'default' });
  }

  // start_inspection / edit_inspection
  if (['bevestigd', 'bezocht', 'offerte_verzonden'].includes(status)) {
    const hasInspection = Boolean(lead?.inspection_data_v2);
    actions.push({
      key: hasInspection ? 'edit_inspection' : 'start_inspection',
      label: hasInspection ? 'Bewerk inspectie' : 'Start inspectie',
      icon: 'ClipboardList',
      variant: 'default',
    });
  }

  // preview_quote: whenever quote_amount > 0
  if (lead?.quote_amount > 0) {
    actions.push({ key: 'preview_quote', label: 'Bekijk offerte PDF', icon: 'Eye', variant: 'outline' });
  }

  // send_quote / resend_quote
  if (['bezocht', 'offerte_verzonden'].includes(status) && lead?.quote_amount > 0) {
    const label = communication.quoteSent ? 'Herstuur offerte' : 'Verstuur offerte';
    actions.push({ key: 'send_quote', label, icon: 'FileText', variant: 'default' });
  }

  // toggle_followup
  if (status === 'offerte_verzonden') {
    actions.push({
      key: 'toggle_followup',
      label: lead?.followup_paused ? 'Hervat opvolging' : 'Pauzeer opvolging',
      icon: lead?.followup_paused ? 'PlayCircle' : 'PauseCircle',
      variant: 'outline',
    });
  }

  return actions;
}
