'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Skeleton } from '@/app/components/ui/skeleton';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import { Plus, Pencil, Check, X, Trash2 } from 'lucide-react';

const MONTH_LABELS = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

const JOB_COST_CATEGORIES = {
  materiaal: 'Materiaal',
  arbeid: 'Arbeid',
  onderaannemer: 'Onderaannemer',
  overig: 'Overig',
};

const BUSINESS_COST_CATEGORIES = {
  brandstof: 'Brandstof',
  gereedschap: 'Gereedschap',
  verzekering: 'Verzekering',
  huur: 'Huur',
  marketing: 'Marketing',
  administratie: 'Administratie',
  overig: 'Overig',
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount || 0);
}

// --- KPI Card ---
function KpiCard({ label, amount, description, color }) {
  const colorClasses = {
    green: 'bg-green-50 text-green-700 border-green-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    red: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-muted-foreground">{label}</span>
          <Badge variant="outline" className={colorClasses[color] || colorClasses.green}>
            {label}
          </Badge>
        </div>
        <p className="text-2xl font-bold">{formatCurrency(amount)}</p>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// --- Monthly Bar Chart ---
function MonthlyChart({ monthlyRevenue, year }) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const maxAmount = Math.max(...monthlyRevenue, 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Omzet per maand</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-48">
          {MONTH_LABELS.map((label, i) => {
            const amount = monthlyRevenue[i] || 0;
            const isCurrentMonth = i === currentMonth && parseInt(year) === currentYear;
            return (
              <div key={label} className="flex-1 flex flex-col items-center group relative">
                <div className="absolute bottom-full mb-1 hidden group-hover:block bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap z-10">
                  {formatCurrency(amount)}
                </div>
                <div
                  className={`w-full rounded-t transition-all ${isCurrentMonth ? 'ring-2 ring-offset-1 ring-[#8AAB4C]' : ''}`}
                  style={{
                    height: `${(amount / maxAmount) * 100}%`,
                    minHeight: amount > 0 ? '4px' : '2px',
                    backgroundColor: amount > 0 ? '#8AAB4C' : '#e5e7eb',
                  }}
                />
                <span className="text-xs mt-1 text-muted-foreground">{label}</span>
                {amount > 0 && (
                  <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                    {formatCurrency(amount)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Unscheduled Quotes Alert (execution date picker) ---
function UnscheduledQuotesAlert({ quotes, onSave }) {
  const [dates, setDates] = useState({});
  const [saving, setSaving] = useState({});

  if (!quotes || quotes.length === 0) return null;

  async function handleSave(item) {
    const date = dates[item.id];
    if (!date) {
      toast.error('Selecteer een datum');
      return;
    }
    setSaving((prev) => ({ ...prev, [item.id]: true }));
    try {
      if (item.quote_id) {
        // Update the quote's planned_execution_date
        const res = await fetch(`/api/quotes/${item.quote_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planned_execution_date: date }),
        });
        if (!res.ok) throw new Error('Opslaan mislukt');
      } else if (item.lead_id) {
        // No linked quote — create a revenue_entry with the date
        const res = await fetch('/api/financieel/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: item.lead_id,
            customer_name: item.customer_name,
            quoted_amount: item.total_incl,
            actual_amount: item.total_incl,
            revenue_date: date,
            is_external: false,
          }),
        });
        if (!res.ok) throw new Error('Opslaan mislukt');
      }
      toast.success('Uitvoeringsdatum opgeslagen');
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving((prev) => ({ ...prev, [item.id]: false }));
    }
  }

  return (
    <Card className="border-orange-200 bg-orange-50/30">
      <CardHeader>
        <CardTitle>Ingeplande werkzaamheden nodig</CardTitle>
        <p className="text-sm text-muted-foreground">
          Deze goedgekeurde opdrachten hebben nog geen uitvoeringsdatum. Stel in wanneer de werkzaamheden plaatsvinden — dit bepaalt in welke maand de omzet telt.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {quotes.map((q) => (
            <div key={q.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border rounded-lg bg-background">
              <div className="flex-1">
                <p className="font-medium text-sm">{q.customer_name}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(q.total_incl)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  className="w-auto text-sm"
                  value={dates[q.id] || ''}
                  onChange={(e) => setDates((prev) => ({ ...prev, [q.id]: e.target.value }))}
                />
                <Button
                  size="sm"
                  onClick={() => handleSave(q)}
                  disabled={saving[q.id]}
                  style={{ backgroundColor: '#355b23' }}
                >
                  {saving[q.id] ? 'Bezig...' : 'Opslaan'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// --- Revenue / Opdrachten Section ---
function RevenueSection({ crmJobs, revenueEntries, standaloneInvoices, onRefresh }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // New external job form
  const [newJob, setNewJob] = useState({
    customer_name: '',
    description: '',
    actual_amount: '',
    revenue_date: new Date().toISOString().slice(0, 10),
  });

  // Build override map: lead_id → revenue_entry
  const overrideMap = {};
  for (const entry of revenueEntries) {
    if (entry.lead_id) overrideMap[entry.lead_id] = entry;
  }

  // External entries (not linked to a lead)
  const externalEntries = revenueEntries.filter((e) => !e.lead_id);

  async function handleSetActual(leadId, customerName, quotedAmount) {
    if (!editAmount || isNaN(Number(editAmount))) {
      toast.error('Voer een geldig bedrag in');
      return;
    }
    setSubmitting(true);
    try {
      const existing = overrideMap[leadId];
      if (existing) {
        // Update existing entry
        const res = await fetch('/api/financieel/revenue', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existing.id, actual_amount: Number(editAmount) }),
        });
        if (!res.ok) throw new Error();
      } else {
        // Create new entry
        const res = await fetch('/api/financieel/revenue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lead_id: leadId,
            customer_name: customerName,
            quoted_amount: quotedAmount,
            actual_amount: Number(editAmount),
            revenue_date: new Date().toISOString().slice(0, 10),
            is_external: false,
          }),
        });
        if (!res.ok) throw new Error();
      }
      toast.success('Bedrag bijgewerkt');
      setEditingId(null);
      setEditAmount('');
      onRefresh();
    } catch {
      toast.error('Opslaan mislukt');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddExternal(e) {
    e.preventDefault();
    if (!newJob.customer_name || !newJob.actual_amount) {
      toast.error('Vul naam en bedrag in');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/financieel/revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: newJob.customer_name,
          description: newJob.description || null,
          actual_amount: Number(newJob.actual_amount),
          revenue_date: newJob.revenue_date,
          is_external: true,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Externe opdracht toegevoegd');
      setNewJob({ customer_name: '', description: '', actual_amount: '', revenue_date: new Date().toISOString().slice(0, 10) });
      setShowAddForm(false);
      onRefresh();
    } catch {
      toast.error('Opslaan mislukt');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteExternal(entryId) {
    if (!confirm('Weet u het zeker?')) return;
    try {
      const res = await fetch('/api/financieel/revenue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Verwijderd');
      onRefresh();
    } catch {
      toast.error('Verwijderen mislukt');
    }
  }

  async function handleRemoveOverride(entryId) {
    try {
      const res = await fetch('/api/financieel/revenue', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: entryId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Werkelijk bedrag verwijderd, offertebedrag hersteld');
      onRefresh();
    } catch {
      toast.error('Verwijderen mislukt');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Opdrachten</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Alle inkomsten — pas werkelijke bedragen aan of voeg externe opdrachten toe
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-4 w-4" />
            Externe opdracht
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Add external job form */}
        {showAddForm && (
          <form onSubmit={handleAddExternal} className="mb-4 p-4 border rounded-lg space-y-3 bg-muted/30">
            <p className="text-sm font-medium">Externe opdracht toevoegen</p>
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Klantnaam *"
                value={newJob.customer_name}
                onChange={(e) => setNewJob((p) => ({ ...p, customer_name: e.target.value }))}
              />
              <Input
                placeholder="Omschrijving"
                value={newJob.description}
                onChange={(e) => setNewJob((p) => ({ ...p, description: e.target.value }))}
              />
              <Input
                type="number"
                step="0.01"
                placeholder="Bedrag (incl. BTW) *"
                value={newJob.actual_amount}
                onChange={(e) => setNewJob((p) => ({ ...p, actual_amount: e.target.value }))}
              />
              <Input
                type="date"
                value={newJob.revenue_date}
                onChange={(e) => setNewJob((p) => ({ ...p, revenue_date: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={submitting} style={{ backgroundColor: '#355b23' }}>
                {submitting ? 'Opslaan...' : 'Toevoegen'}
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                Annuleren
              </Button>
            </div>
          </form>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Klant</th>
                <th className="text-left py-2 font-medium">Omschrijving</th>
                <th className="text-right py-2 font-medium">Offerte</th>
                <th className="text-right py-2 font-medium">Werkelijk</th>
                <th className="py-2 w-24"></th>
              </tr>
            </thead>
            <tbody>
              {/* CRM jobs */}
              {crmJobs.map((job) => {
                const override = overrideMap[job.lead_id || job.id];
                const hasInvoice = job.invoice_id != null;
                // Actual amount priority: override > invoice > none
                let actualAmount = null;
                let actualSource = null;
                if (override) {
                  actualAmount = override.actual_amount;
                  actualSource = 'override';
                } else if (hasInvoice) {
                  actualAmount = job.invoice_amount;
                  actualSource = 'invoice';
                }
                const isEditing = editingId === job.id;
                const invoiceStatusLabels = {
                  verzonden: 'Verzonden',
                  betaald: 'Betaald',
                  deels_betaald: 'Deels betaald',
                };
                const invoiceStatusColors = {
                  verzonden: 'bg-blue-50 text-blue-700 border-blue-200',
                  betaald: 'bg-green-50 text-green-700 border-green-200',
                  deels_betaald: 'bg-orange-50 text-orange-700 border-orange-200',
                };

                return (
                  <tr key={job.id} className="border-b last:border-0">
                    <td className="py-2.5">
                      <span className="font-medium">{job.customer_name}</span>
                      <Badge variant="outline" className="ml-2 text-[10px]">CRM</Badge>
                      {hasInvoice && (
                        <Badge
                          variant="outline"
                          className={`ml-1 text-[10px] ${invoiceStatusColors[job.invoice_status] || ''}`}
                          title={job.invoice_number}
                        >
                          Factuur: {invoiceStatusLabels[job.invoice_status] || job.invoice_status}
                        </Badge>
                      )}
                    </td>
                    <td className="py-2.5 text-muted-foreground">
                      {hasInvoice ? (job.invoice_number || 'Gefactureerd') : 'Offerte goedgekeurd'}
                    </td>
                    <td className="py-2.5 text-right text-muted-foreground">
                      {formatCurrency(job.total_incl)}
                    </td>
                    <td className="py-2.5 text-right">
                      {isEditing ? (
                        <Input
                          type="number"
                          step="0.01"
                          className="w-28 ml-auto text-right text-sm h-8"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`font-medium ${actualAmount != null && actualAmount !== job.total_incl ? 'text-blue-700' : ''}`}
                          title={actualSource === 'invoice' ? 'Uit factuur' : actualSource === 'override' ? 'Handmatig aangepast' : ''}
                        >
                          {actualAmount != null ? formatCurrency(actualAmount) : '—'}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        {isEditing ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-green-600"
                              onClick={() => handleSetActual(job.id, job.customer_name, job.total_incl)}
                              disabled={submitting}
                            >
                              <Check className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => { setEditingId(null); setEditAmount(''); }}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              title="Werkelijk bedrag aanpassen"
                              onClick={() => {
                                setEditingId(job.id);
                                setEditAmount(actualAmount != null ? String(actualAmount) : String(job.total_incl));
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {override && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-red-500"
                                title="Werkelijk bedrag verwijderen"
                                onClick={() => handleRemoveOverride(override.id)}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Standalone invoices (not linked to a CRM lead) */}
              {(standaloneInvoices || []).map((inv) => {
                const invoiceStatusLabels = {
                  verzonden: 'Verzonden',
                  betaald: 'Betaald',
                  deels_betaald: 'Deels betaald',
                };
                const invoiceStatusColors = {
                  verzonden: 'bg-blue-50 text-blue-700 border-blue-200',
                  betaald: 'bg-green-50 text-green-700 border-green-200',
                  deels_betaald: 'bg-orange-50 text-orange-700 border-orange-200',
                };
                return (
                  <tr key={`inv-${inv.id}`} className="border-b last:border-0">
                    <td className="py-2.5">
                      <span className="font-medium">{inv.customer_name}</span>
                      <Badge
                        variant="outline"
                        className={`ml-2 text-[10px] ${invoiceStatusColors[inv.status] || ''}`}
                      >
                        Factuur: {invoiceStatusLabels[inv.status] || inv.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{inv.invoice_number || '—'}</td>
                    <td className="py-2.5 text-right text-muted-foreground">—</td>
                    <td className="py-2.5 text-right font-medium">{formatCurrency(inv.amount)}</td>
                    <td className="py-2.5" />
                  </tr>
                );
              })}

              {/* External entries */}
              {externalEntries.map((entry) => (
                <tr key={entry.id} className="border-b last:border-0">
                  <td className="py-2.5">
                    <span className="font-medium">{entry.customer_name}</span>
                    <Badge variant="outline" className="ml-2 text-[10px] bg-orange-50 text-orange-700 border-orange-200">Extern</Badge>
                  </td>
                  <td className="py-2.5 text-muted-foreground">{entry.description || '—'}</td>
                  <td className="py-2.5 text-right text-muted-foreground">—</td>
                  <td className="py-2.5 text-right font-medium">{formatCurrency(entry.actual_amount)}</td>
                  <td className="py-2.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteExternal(entry.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}

              {crmJobs.length === 0 && externalEntries.length === 0 && (standaloneInvoices || []).length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    Nog geen opdrachten. Voeg een externe opdracht toe of keur een offerte goed.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Cost Section ---
function CostSection({ title, costs, categories, approvedQuotes, type, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    quote_id: '',
    category: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState({});

  const isJob = type === 'job';

  function resetForm() {
    setFormData({ quote_id: '', category: '', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
    setShowForm(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.category || !formData.amount || !formData.date) {
      toast.error('Vul alle verplichte velden in');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch('/api/financieel/costs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          quote_id: isJob ? formData.quote_id || null : null,
          category: formData.category,
          description: formData.description,
          amount: parseFloat(formData.amount),
          date: formData.date,
        }),
      });
      if (!res.ok) throw new Error('Opslaan mislukt');
      toast.success('Kosten toegevoegd');
      resetForm();
      onAdd();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(costId) {
    setDeleting((prev) => ({ ...prev, [costId]: true }));
    try {
      const res = await fetch('/api/financieel/costs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, id: costId }),
      });
      if (!res.ok) throw new Error();
      toast.success('Kosten verwijderd');
      onDelete();
    } catch {
      toast.error('Verwijderen mislukt');
    } finally {
      setDeleting((prev) => ({ ...prev, [costId]: false }));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button variant="outline" size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuleren' : 'Toevoegen'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showForm && (
          <form onSubmit={handleSubmit} className="mb-4 p-4 border rounded-lg space-y-3 bg-muted/30">
            {isJob && (
              <Select
                value={formData.quote_id}
                onValueChange={(val) => setFormData((prev) => ({ ...prev, quote_id: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer opdracht (optioneel)" />
                </SelectTrigger>
                <SelectContent>
                  {(approvedQuotes || []).map((q) => (
                    <SelectItem key={q.id} value={q.id}>
                      {q.customer_name} — {formatCurrency(q.total_incl)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select
              value={formData.category}
              onValueChange={(val) => setFormData((prev) => ({ ...prev, category: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categorie" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categories).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Omschrijving"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            />
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                placeholder="Bedrag"
                value={formData.amount}
                onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                className="flex-1"
              />
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                className="flex-1"
              />
            </div>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Opslaan...' : 'Opslaan'}
            </Button>
          </form>
        )}

        {costs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Geen kosten gevonden</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Datum</th>
                  <th className="text-left py-2 font-medium">Categorie</th>
                  <th className="text-left py-2 font-medium">Omschrijving</th>
                  <th className="text-right py-2 font-medium">Bedrag</th>
                  <th className="py-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {costs.map((cost) => (
                  <tr key={cost.id} className="border-b last:border-0">
                    <td className="py-2 whitespace-nowrap">
                      {new Date(cost.date).toLocaleDateString('nl-NL')}
                    </td>
                    <td className="py-2">
                      <Badge variant="outline">
                        {categories[cost.category] || cost.category}
                      </Badge>
                    </td>
                    <td className="py-2 text-muted-foreground">{cost.description || '—'}</td>
                    <td className="py-2 text-right font-medium">{formatCurrency(cost.amount)}</td>
                    <td className="py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                        onClick={() => handleDelete(cost.id)}
                        disabled={deleting[cost.id]}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Main Dashboard ---
export default function FinancialDashboard() {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [data, setData] = useState(null);
  const [costsData, setCostsData] = useState(null);
  const [revenueEntries, setRevenueEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [finRes, costsRes, revenueRes] = await Promise.all([
        fetch(`/api/financieel?year=${year}`),
        fetch(`/api/financieel/costs?year=${year}`),
        fetch(`/api/financieel/revenue?year=${year}`),
      ]);

      const finData = finRes.ok ? await finRes.json() : {
        revenue_by_month: [], pipeline_value: 0, total_revenue_ytd: 0,
        total_job_costs: 0, total_business_costs: 0, profit: 0,
        unscheduled_quotes: [], approved_quotes: [],
      };
      const costsResult = costsRes.ok ? await costsRes.json() : { job_costs: [], business_costs: [] };
      const revenueResult = revenueRes.ok ? await revenueRes.json() : [];

      setData(finData);
      setCostsData(costsResult);
      setRevenueEntries(revenueResult);
    } catch (err) {
      console.error('[API_ERROR] financieel:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const totalRevenue = data?.total_revenue_ytd || 0;
  const pipelineValue = data?.pipeline_value || 0;
  const revenueByMonth = data?.revenue_by_month || [];

  const jobCosts = costsData?.job_costs || [];
  const businessCosts = costsData?.business_costs || [];
  const totalJobCosts = data?.total_job_costs || 0;
  const totalBusinessCosts = data?.total_business_costs || 0;
  const totalCosts = totalJobCosts + totalBusinessCosts;
  const profit = data?.profit ?? (totalRevenue - totalCosts);

  const monthlyRevenue = Array(12).fill(0);
  for (const entry of revenueByMonth) {
    const monthIndex = parseInt(entry.month.split('-')[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      monthlyRevenue[monthIndex] = entry.amount || 0;
    }
  }

  const crmJobs = data?.approved_quotes || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Financieel overzicht</h1>
          <p className="text-muted-foreground">Winst &amp; verlies, omzet per maand</p>
        </div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
            <SelectItem value="2027">2027</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Omzet" amount={totalRevenue} description="Totale omzet dit jaar" color="green" />
        <KpiCard label="Pijplijn" amount={pipelineValue} description="Offertes in afwachting" color="orange" />
        <KpiCard label="Kosten" amount={totalCosts} description="Totale kosten dit jaar" color="red" />
        <KpiCard label="Winst" amount={profit} description="Omzet minus kosten" color={profit >= 0 ? 'green' : 'red'} />
      </div>

      {/* Monthly Revenue Chart */}
      <MonthlyChart monthlyRevenue={monthlyRevenue} year={year} />

      {/* Unscheduled Quotes — prompts to set execution dates for approved jobs */}
      <UnscheduledQuotesAlert
        quotes={data?.unscheduled_quotes || []}
        onSave={fetchData}
      />

      {/* Opdrachten — Revenue tracking with editable actuals + external jobs */}
      <RevenueSection
        crmJobs={crmJobs}
        revenueEntries={revenueEntries}
        standaloneInvoices={data?.standalone_invoices || []}
        onRefresh={fetchData}
      />

      {/* Cost Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CostSection
          title="Kosten per opdracht"
          costs={jobCosts}
          categories={JOB_COST_CATEGORIES}
          approvedQuotes={crmJobs}
          type="job"
          onAdd={fetchData}
          onDelete={fetchData}
        />
        <CostSection
          title="Bedrijfskosten"
          costs={businessCosts}
          categories={BUSINESS_COST_CATEGORIES}
          type="business"
          onAdd={fetchData}
          onDelete={fetchData}
        />
      </div>
    </div>
  );
}
