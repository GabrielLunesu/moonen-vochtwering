import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { notifyOpsAlert } from '@/lib/ops/alerts';

/**
 * Revenue priority (highest to lowest):
 * 1. revenue_entries override (manual actual amount + date)
 * 2. Invoice (sent/paid) — real billed amount
 * 3. Approved quote/lead amount (fallback when not yet invoiced)
 *
 * Month attribution priority:
 * 1. revenue_entries.revenue_date
 * 2. invoice.issue_date (or sent_at)
 * 3. quote.planned_execution_date
 * 4. lead.quote_response_at / created_at
 *
 * De-duping: Each unique job is counted once, even if it has a lead,
 * quote, invoice, and revenue_entry all linked.
 */
export async function GET(request) {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const yearParam = request.nextUrl.searchParams.get('year');
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const startOfYear = `${year}-01-01`;
    const startOfNextYear = `${year + 1}-01-01`;

    // --- 1. Fetch approved leads ---
    const { data: akkoordLeads, error: leadsError } = await supabase
      .from('leads')
      .select('id, name, quote_amount, quote_number, quote_response_at, created_at, plaatsnaam')
      .eq('status', 'akkoord')
      .gt('quote_amount', 0);

    if (leadsError) {
      console.error('[DB_FAIL] GET /api/financieel - leads:', leadsError);
      return NextResponse.json({ error: leadsError.message }, { status: 500 });
    }

    // --- 2. Fetch approved quotes (for manually-marked quotes) ---
    let akkoordQuotes = [];
    const { data: quotesData } = await supabase
      .from('quotes')
      .select('id, lead_id, customer_name, total_incl, planned_execution_date, status, created_at')
      .eq('status', 'akkoord');
    akkoordQuotes = quotesData || [];

    // --- 3. Fetch ALL quotes linked to approved leads (for quote_id + execution date) ---
    const leadIds = (akkoordLeads || []).map((l) => l.id);
    const quotesByLeadId = {};
    if (leadIds.length > 0) {
      const { data: leadQuotes } = await supabase
        .from('quotes')
        .select('id, lead_id, total_incl, planned_execution_date, created_at')
        .in('lead_id', leadIds);

      for (const q of leadQuotes || []) {
        if (!quotesByLeadId[q.lead_id] || new Date(q.created_at) > new Date(quotesByLeadId[q.lead_id].created_at)) {
          quotesByLeadId[q.lead_id] = q;
        }
      }
    }

    // --- 4. Fetch invoices (sent, paid, or partially paid) ---
    // Concept invoices are drafts; they don't count as revenue
    let invoices = [];
    const { data: invoicesData, error: invoicesError } = await supabase
      .from('invoices')
      .select('id, lead_id, quote_id, customer_name, invoice_number, total_incl, status, issue_date, sent_at, paid_amount')
      .in('status', ['verzonden', 'betaald', 'deels_betaald']);

    if (!invoicesError) {
      invoices = invoicesData || [];
    }

    // Build invoice lookup maps (by lead_id and by quote_id)
    const invoiceByLeadId = {};
    const invoiceByQuoteId = {};
    for (const inv of invoices) {
      if (inv.lead_id) {
        // If multiple invoices per lead, prefer paid > deels_betaald > verzonden, then most recent
        const existing = invoiceByLeadId[inv.lead_id];
        if (!existing || shouldReplaceInvoice(existing, inv)) {
          invoiceByLeadId[inv.lead_id] = inv;
        }
      }
      if (inv.quote_id) {
        const existing = invoiceByQuoteId[inv.quote_id];
        if (!existing || shouldReplaceInvoice(existing, inv)) {
          invoiceByQuoteId[inv.quote_id] = inv;
        }
      }
    }

    // --- 5. Build unified list of accepted items ---
    const seenLeadIds = new Set((akkoordLeads || []).map((l) => l.id));
    const acceptedItems = [];

    // From approved leads
    for (const lead of akkoordLeads || []) {
      const linkedQuote = quotesByLeadId[lead.id];
      acceptedItems.push({
        id: lead.id,
        lead_id: lead.id,
        quote_id: linkedQuote?.id || null,
        customer_name: lead.name,
        total_incl: lead.quote_amount,
        planned_execution_date: linkedQuote?.planned_execution_date || null,
        created_at: lead.quote_response_at || lead.created_at,
        source: 'lead',
      });
    }

    // From approved quotes not linked to an already-counted lead
    for (const q of akkoordQuotes) {
      if (q.lead_id && seenLeadIds.has(q.lead_id)) continue;
      acceptedItems.push({
        id: q.id,
        lead_id: q.lead_id,
        quote_id: q.id,
        customer_name: q.customer_name,
        total_incl: q.total_incl,
        planned_execution_date: q.planned_execution_date,
        created_at: q.created_at,
        source: 'quote',
      });
    }

    // --- 6. Fetch pipeline value (quotes sent but not yet accepted) ---
    const { data: pipelineQuotes } = await supabase
      .from('quotes')
      .select('total_incl, lead_id')
      .eq('status', 'verzonden');

    const pipelineFiltered = (pipelineQuotes || []).filter(
      (q) => !q.lead_id || !seenLeadIds.has(q.lead_id)
    );

    // --- 7. Fetch costs (graceful if tables don't exist) ---
    let jobCosts = [];
    const { data: jobCostsData } = await supabase
      .from('job_costs')
      .select('amount')
      .gte('date', startOfYear)
      .lt('date', startOfNextYear);
    jobCosts = jobCostsData || [];

    let businessCosts = [];
    const { data: businessCostsData } = await supabase
      .from('business_costs')
      .select('amount')
      .gte('date', startOfYear)
      .lt('date', startOfNextYear);
    businessCosts = businessCostsData || [];

    // --- 8. Fetch revenue entries (overrides + external) ---
    let revenueEntries = [];
    const { data: revenueData } = await supabase
      .from('revenue_entries')
      .select('*')
      .gte('revenue_date', startOfYear)
      .lt('revenue_date', startOfNextYear);
    revenueEntries = revenueData || [];

    const overrideByLeadId = {};
    for (const entry of revenueEntries) {
      if (entry.lead_id) {
        overrideByLeadId[entry.lead_id] = entry;
      }
    }

    // --- 9. Walk through accepted items and resolve amounts/dates ---
    const monthlyMap = {};
    const unscheduledQuotes = [];
    const seenInvoiceIds = new Set(); // track invoices already counted via linking

    for (const item of acceptedItems) {
      const override = overrideByLeadId[item.lead_id || item.id];
      const linkedInvoice =
        (item.lead_id && invoiceByLeadId[item.lead_id]) ||
        (item.quote_id && invoiceByQuoteId[item.quote_id]) ||
        null;

      if (linkedInvoice) {
        seenInvoiceIds.add(linkedInvoice.id);
      }

      // Resolve amount (priority: override > invoice > quote)
      let amount;
      if (override) {
        amount = override.actual_amount || 0;
      } else if (linkedInvoice) {
        // Prefer paid_amount for betaald/deels_betaald; total_incl for verzonden
        amount = linkedInvoice.status === 'deels_betaald'
          ? (linkedInvoice.paid_amount || 0)
          : (linkedInvoice.total_incl || 0);
      } else {
        amount = item.total_incl || 0;
      }

      // Resolve date (priority: override > invoice > execution > created)
      let dateForMonth;
      if (override) {
        dateForMonth = override.revenue_date;
      } else if (linkedInvoice) {
        dateForMonth = linkedInvoice.issue_date || (linkedInvoice.sent_at ? linkedInvoice.sent_at.slice(0, 10) : null);
      } else {
        dateForMonth = item.planned_execution_date;
      }

      // Unscheduled check: no override, no invoice, no execution date
      if (!dateForMonth && !override && !linkedInvoice) {
        unscheduledQuotes.push({
          id: item.id,
          quote_id: item.quote_id,
          lead_id: item.lead_id,
          customer_name: item.customer_name,
          total_incl: item.total_incl,
        });
        dateForMonth = item.created_at ? item.created_at.slice(0, 10) : null;
      }

      if (!dateForMonth) continue;

      const d = new Date(dateForMonth);
      const dYear = d.getFullYear();
      if (dYear !== year) continue;

      const monthKey = `${dYear}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      monthlyMap[monthKey].amount += amount;
      monthlyMap[monthKey].count += 1;
    }

    // --- 10. Add standalone invoices (not linked to any accepted item) ---
    for (const inv of invoices) {
      if (seenInvoiceIds.has(inv.id)) continue;
      // Not linked to an accepted CRM job — count it directly
      const amount = inv.status === 'deels_betaald'
        ? (inv.paid_amount || 0)
        : (inv.total_incl || 0);
      const dateStr = inv.issue_date || (inv.sent_at ? inv.sent_at.slice(0, 10) : null);
      if (!dateStr) continue;

      const d = new Date(dateStr);
      const dYear = d.getFullYear();
      if (dYear !== year) continue;

      const monthKey = `${dYear}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      monthlyMap[monthKey].amount += amount;
      monthlyMap[monthKey].count += 1;
    }

    // --- 11. Add external revenue_entries (no lead_id) ---
    for (const entry of revenueEntries) {
      if (entry.lead_id) continue;
      const d = new Date(entry.revenue_date);
      const dYear = d.getFullYear();
      if (dYear !== year) continue;

      const monthKey = `${dYear}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, amount: 0, count: 0 };
      }
      monthlyMap[monthKey].amount += entry.actual_amount || 0;
      monthlyMap[monthKey].count += 1;
    }

    const revenueByMonth = Object.values(monthlyMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );

    const pipelineValue = pipelineFiltered.reduce(
      (sum, q) => sum + (q.total_incl || 0),
      0
    );

    // --- 12. Total revenue YTD (same logic as monthly) ---
    let totalRevenueYtd = 0;
    const seenInvoiceIdsTotal = new Set();

    for (const item of acceptedItems) {
      const override = overrideByLeadId[item.lead_id || item.id];
      const linkedInvoice =
        (item.lead_id && invoiceByLeadId[item.lead_id]) ||
        (item.quote_id && invoiceByQuoteId[item.quote_id]) ||
        null;
      if (linkedInvoice) seenInvoiceIdsTotal.add(linkedInvoice.id);

      if (override) {
        totalRevenueYtd += override.actual_amount || 0;
      } else if (linkedInvoice) {
        totalRevenueYtd += linkedInvoice.status === 'deels_betaald'
          ? (linkedInvoice.paid_amount || 0)
          : (linkedInvoice.total_incl || 0);
      } else {
        totalRevenueYtd += item.total_incl || 0;
      }
    }

    // Standalone invoices
    for (const inv of invoices) {
      if (seenInvoiceIdsTotal.has(inv.id)) continue;
      totalRevenueYtd += inv.status === 'deels_betaald'
        ? (inv.paid_amount || 0)
        : (inv.total_incl || 0);
    }

    // External revenue entries
    for (const entry of revenueEntries) {
      if (!entry.lead_id) {
        totalRevenueYtd += entry.actual_amount || 0;
      }
    }

    const totalJobCosts = jobCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalBusinessCosts = businessCosts.reduce((sum, c) => sum + (c.amount || 0), 0);
    const profit = totalRevenueYtd - totalJobCosts - totalBusinessCosts;

    const approvedQuotesList = acceptedItems.map((item) => {
      const linkedInvoice =
        (item.lead_id && invoiceByLeadId[item.lead_id]) ||
        (item.quote_id && invoiceByQuoteId[item.quote_id]) ||
        null;
      return {
        id: item.id,
        lead_id: item.lead_id,
        quote_id: item.quote_id,
        customer_name: item.customer_name,
        total_incl: item.total_incl,
        invoice_id: linkedInvoice?.id || null,
        invoice_number: linkedInvoice?.invoice_number || null,
        invoice_status: linkedInvoice?.status || null,
        invoice_amount: linkedInvoice
          ? (linkedInvoice.status === 'deels_betaald' ? linkedInvoice.paid_amount : linkedInvoice.total_incl)
          : null,
      };
    });

    // Also return standalone invoices (not linked to accepted CRM jobs)
    const standaloneInvoices = invoices
      .filter((inv) => !seenInvoiceIdsTotal.has(inv.id))
      .map((inv) => ({
        id: inv.id,
        customer_name: inv.customer_name,
        invoice_number: inv.invoice_number,
        status: inv.status,
        amount: inv.status === 'deels_betaald' ? inv.paid_amount : inv.total_incl,
        issue_date: inv.issue_date,
      }));

    return NextResponse.json({
      revenue_by_month: revenueByMonth,
      pipeline_value: pipelineValue,
      total_revenue_ytd: totalRevenueYtd,
      total_job_costs: totalJobCosts,
      total_business_costs: totalBusinessCosts,
      profit,
      unscheduled_quotes: unscheduledQuotes,
      approved_quotes: approvedQuotesList,
      standalone_invoices: standaloneInvoices,
    });
  } catch (error) {
    console.error('[API_ERROR] GET /api/financieel:', error);
    await notifyOpsAlert({
      source: 'GET /api/financieel',
      message: 'Failed to fetch financial data',
      error,
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// Helper: decide whether to replace an existing invoice in the lookup map
// Priority: betaald > deels_betaald > verzonden; within same status, most recent wins
function shouldReplaceInvoice(existing, candidate) {
  const rank = { betaald: 3, deels_betaald: 2, verzonden: 1 };
  const existingRank = rank[existing.status] || 0;
  const candidateRank = rank[candidate.status] || 0;
  if (candidateRank > existingRank) return true;
  if (candidateRank < existingRank) return false;
  // Same rank: prefer most recent issue_date
  const existingDate = existing.issue_date || existing.sent_at || '';
  const candidateDate = candidate.issue_date || candidate.sent_at || '';
  return candidateDate > existingDate;
}
