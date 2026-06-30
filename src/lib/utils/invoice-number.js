import { notifyOpsAlert } from '@/lib/ops/alerts';

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

  // Fallback: count invoices with a number in the current year
  const startOfYear = `${currentYear}-01-01T00:00:00.000Z`;
  const startOfNextYear = `${currentYear + 1}-01-01T00:00:00.000Z`;
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .not('invoice_number', 'is', null)
    .gte('created_at', startOfYear)
    .lt('created_at', startOfNextYear);

  return `MV-F-${currentYear}-${String((count || 0) + 1).padStart(4, '0')}`;
}
