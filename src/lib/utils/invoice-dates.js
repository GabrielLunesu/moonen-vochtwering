export const INVOICE_PAYMENT_TERM_DAYS = 30;
export const INVOICE_PAYMENT_TERM_LABEL = `Binnen ${INVOICE_PAYMENT_TERM_DAYS} dagen na factuurdatum`;

function padDatePart(value) {
  return String(value).padStart(2, '0');
}

export function todayISODate(now = new Date()) {
  return [
    now.getFullYear(),
    padDatePart(now.getMonth() + 1),
    padDatePart(now.getDate()),
  ].join('-');
}

function readDateParts(value) {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      return {
        year: Number(match[1]),
        month: Number(match[2]),
        day: Number(match[3]),
      };
    }
  }

  const date = value instanceof Date ? value : new Date(value || todayISODate());
  if (Number.isNaN(date.getTime())) {
    const fallback = new Date();
    return {
      year: fallback.getFullYear(),
      month: fallback.getMonth() + 1,
      day: fallback.getDate(),
    };
  }

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function addDaysToISODate(value, days) {
  const parts = readDateParts(value);
  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getInvoiceDueDate(issueDate) {
  return addDaysToISODate(issueDate || todayISODate(), INVOICE_PAYMENT_TERM_DAYS);
}
