import { notifyOpsAlert } from '@/lib/ops/alerts';

function formatInvoiceNumber(year, sequence) {
  return `MV-F-${year}-${String(sequence).padStart(4, '0')}`;
}

function readInvoiceSequence(invoiceNumber) {
  if (typeof invoiceNumber !== 'string') return 0;
  const match = invoiceNumber.match(/^MV-F-\d{4}-(\d+)$/);
  return match ? Number(match[1]) : 0;
}

/**
 * Generate the next sequential invoice number (MV-F-YYYY-NNNN).
 *
 * Returns `existingNumber` unchanged when one is already set, so it is safe to
 * call on an invoice that was already numbered.
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string|null} [existingNumber]
 * @param {string} [source] context label for ops alerts
 */
export async function generateInvoiceNumber(supabase, existingNumber, source = 'invoice-number') {
  if (existingNumber) return existingNumber;

  const currentYear = new Date().getFullYear();

  // Try the atomic RPC first (no gaps under concurrency)
  const { data: rpcData, error: rpcError } = await supabase.rpc('next_invoice_number');
  if (!rpcError && typeof rpcData === 'string' && rpcData) {
    return rpcData;
  }

  if (rpcError) {
    await notifyOpsAlert({
      source,
      message: 'next_invoice_number RPC unavailable, using fallback sequence',
      error: rpcError,
    });
  }

  const { data: latestInvoice, error: latestError } = await supabase
    .from('invoices')
    .select('invoice_number')
    .like('invoice_number', `MV-F-${currentYear}-%`)
    .order('invoice_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestError) {
    await notifyOpsAlert({
      source,
      message: 'Unable to read latest invoice number for fallback sequence',
      error: latestError,
    });
  }

  return formatInvoiceNumber(currentYear, readInvoiceSequence(latestInvoice?.invoice_number) + 1);
}
