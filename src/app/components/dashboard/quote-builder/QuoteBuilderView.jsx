'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Send, Eye, Loader2, MessageSquare, FileText } from 'lucide-react';
import { useQuoteState } from './useQuoteState';
import ChatPanel from './ChatPanel';
import QuotePanel from './QuotePanel';

export default function QuoteBuilderView({ lead = null, quote = null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [input, setInput] = useState('');

  const quoteState = useQuoteState(lead);
  const quoteStateRef = useRef(quoteState);
  quoteStateRef.current = quoteState;

  // Transport sends quoteState as extra body with each request
  const [transport] = useState(() => new DefaultChatTransport({
    api: '/api/quote-builder/chat',
    body: () => ({ quoteState: quoteStateRef.current.getSnapshot() }),
  }));

  // Track which tool call IDs we've already dispatched
  const dispatchedToolCalls = useRef(new Set());

  const {
    messages,
    sendMessage,
    status,
    stop,
  } = useChat({
    transport,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Dispatch tool results from messages as they arrive
  // AI SDK v3 uses part.type = "tool-{toolName}" with output directly on part
  // We include `status` in deps so this also fires when streaming completes
  const dispatchToolResults = useCallback(() => {
    for (const msg of messages) {
      if (msg.role !== 'assistant' || !msg.parts) continue;
      for (const part of msg.parts) {
        if (!part.type?.startsWith('tool-') || !part.toolCallId) continue;
        if (!part.output) continue;
        if (dispatchedToolCalls.current.has(part.toolCallId)) continue;
        dispatchedToolCalls.current.add(part.toolCallId);
        quoteStateRef.current.dispatchToolResult(part.output);
      }
    }
  }, [messages]);

  // Run dispatch on message changes and status changes
  useEffect(() => {
    dispatchToolResults();
  }, [dispatchToolResults, status]);

  // Also poll during streaming to catch tool results as they arrive
  useEffect(() => {
    if (status !== 'streaming') return;
    const interval = setInterval(dispatchToolResults, 500);
    return () => clearInterval(interval);
  }, [status, dispatchToolResults]);

  // Handle form submit
  const handleSubmit = useCallback((e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    sendMessage({ role: 'user', content: text });
  }, [input, isLoading, sendMessage]);

  // Handle input change
  const handleInputChange = useCallback((e) => {
    setInput(e.target.value);
  }, []);

  // Load existing quote for editing
  useEffect(() => {
    if (!quote) return;
    quoteState.loadQuote(quote);
  }, [quote]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load settings (quote defaults + pricelist)
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((settings) => {
        if (settings.quote_defaults && typeof settings.quote_defaults === 'object') {
          quoteState.setDefaults((prev) => ({ ...prev, ...settings.quote_defaults }));
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill from lead inspection data
  useEffect(() => {
    if (!lead) return;
    const insp = lead.inspection_data_v2;
    if (insp?.diagnose) {
      const d = Array.isArray(insp.diagnose) ? insp.diagnose : [insp.diagnose];
      quoteState.setDiagnose(d);
    }
    if (lead.photos?.length > 0) {
      quoteState.setPhotos(lead.photos);
    }
  }, [lead]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- Save ---
  const handleSave = useCallback(async () => {
    if (!quoteState.customer.name) {
      toast.error('Vul een klantnaam in');
      return;
    }
    setSaving(true);
    try {
      const payload = quoteState.buildPayload();
      const isEditing = Boolean(quoteState.quoteId);
      const url = isEditing ? `/api/quotes/${quoteState.quoteId}` : '/api/quotes';
      const method = isEditing ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Opslaan mislukt');
      }
      const saved = await res.json();
      toast.success(isEditing ? 'Offerte bijgewerkt' : 'Offerte opgeslagen als concept');
      router.push(`/dashboard/offerte/${saved.id}`);
    } catch (err) {
      toast.error(err?.message || 'Opslaan mislukt');
    } finally {
      setSaving(false);
    }
  }, [quoteState, router]);

  // --- Send ---
  const handleSend = useCallback(async () => {
    if (!quoteState.customer.name) {
      toast.error('Vul een klantnaam in');
      return;
    }
    if (!quoteState.customer.email) {
      toast.error('Vul een e-mailadres in om de offerte te versturen');
      return;
    }
    if (quoteState.lineItems.length === 0) {
      toast.error('Voeg eerst offerteregels toe');
      return;
    }
    setSending(true);
    try {
      // Save first
      const payload = quoteState.buildPayload();
      const isEditing = Boolean(quoteState.quoteId);
      const saveUrl = isEditing ? `/api/quotes/${quoteState.quoteId}` : '/api/quotes';
      const saveMethod = isEditing ? 'PATCH' : 'POST';

      const saveRes = await fetch(saveUrl, {
        method: saveMethod,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!saveRes.ok) {
        const data = await saveRes.json().catch(() => ({}));
        throw new Error(data.error || 'Opslaan mislukt');
      }
      const saved = await saveRes.json();

      // Then send
      const sendRes = await fetch(`/api/quotes/${saved.id}/send`, { method: 'POST' });
      if (!sendRes.ok) {
        const data = await sendRes.json().catch(() => ({}));
        throw new Error(data.error || 'Verzenden mislukt');
      }

      toast.success('Offerte verzonden!');
      router.push(`/dashboard/offerte/${saved.id}`);
    } catch (err) {
      toast.error(err?.message || 'Verzenden mislukt');
    } finally {
      setSending(false);
    }
  }, [quoteState, router]);

  // --- PDF Preview ---
  const handlePreview = useCallback(async () => {
    if (quoteState.lineItems.length === 0) {
      toast.error('Voeg eerst offerteregels toe');
      return;
    }
    setGeneratingPreview(true);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    try {
      const payload = quoteState.buildPayload();
      const draftLead = {
        id: lead?.id || 'draft',
        name: quoteState.customer.name,
        email: quoteState.customer.email,
        phone: quoteState.customer.phone,
        straat: quoteState.customer.straat,
        postcode: quoteState.customer.postcode,
        plaatsnaam: quoteState.customer.plaatsnaam,
        oppervlakte_m2: quoteState.oppervlakte || null,
        inspection_notes: quoteState.notes,
        quote_amount: quoteState.exclBtw,
        photos: quoteState.photos,
        inspection_data_v2: {
          diagnose: quoteState.diagnose,
          diagnose_details: quoteState.diagnoseDetails || null,
          oplossingen: quoteState.oplossingen,
          kelder_sub_areas: null,
          oppervlakte_m2: quoteState.oppervlakte || null,
          line_items: payload.line_items,
          subtotal: payload.subtotal_incl,
          discount_type: payload.discount_type,
          discount_value: payload.discount_value,
          discount_amount: payload.discount_amount,
          btw_percentage: payload.btw_percentage,
          btw_amount: payload.btw_amount,
          total_incl_btw: payload.total_incl,
          garantie_jaren: payload.garantie_jaren,
          doorlooptijd: payload.doorlooptijd,
          betaling: payload.betaling,
          geldigheid_dagen: payload.geldigheid_dagen,
          offerte_inleiding: payload.offerte_inleiding,
          notes: quoteState.notes || null,
        },
      };
      const res = await fetch('/api/pdf/quote/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftLead }),
      });
      if (!res.ok) throw new Error('PDF genereren mislukt');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      window.open(url, '_blank');
    } catch (err) {
      toast.error(err?.message || 'PDF preview mislukt');
    } finally {
      setGeneratingPreview(false);
    }
  }, [quoteState, previewUrl, lead]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const isBusy = saving || sending;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] lg:h-screen">
      {/* Header */}
      <div className="border-b px-4 py-3 shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">
            {quoteState.quoteId ? 'Offerte bewerken' : 'Offerte Builder'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {quoteState.quoteId
              ? `${quoteState.customer.name || 'Concept'}`
              : lead ? `${lead.name} — ${lead.plaatsnaam || ''}` : 'Nieuwe offerte via AI'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreview}
            disabled={isBusy || generatingPreview || quoteState.lineItems.length === 0}
          >
            {generatingPreview ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isBusy || quoteState.lineItems.length === 0}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Opslaan
          </Button>
          <Button
            size="sm"
            onClick={handleSend}
            disabled={isBusy || quoteState.lineItems.length === 0}
            style={{ backgroundColor: '#355b23' }}
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Send className="h-4 w-4 mr-1" />}
            Verstuur
          </Button>
        </div>
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        <div className="w-1/2 border-r">
          <ChatPanel
            messages={messages}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
            isLoading={isLoading}
            stop={stop}
          />
        </div>
        <div className="w-1/2">
          <QuotePanel
            lineItems={quoteState.lineItems}
            customer={quoteState.customer}
            discount={quoteState.discount}
            notes={quoteState.notes}
            oplossingen={quoteState.oplossingen}
            diagnoseDetails={quoteState.diagnoseDetails}
            oppervlakte={quoteState.oppervlakte}
            defaults={quoteState.defaults}
            subtotalIncl={quoteState.subtotalIncl}
            discountAmount={quoteState.discountAmount}
            afterDiscount={quoteState.afterDiscount}
            exclBtw={quoteState.exclBtw}
            btwAmount={quoteState.btwAmount}
            btwPercentage={quoteState.btwPercentage}
            onUpdateLine={quoteState.updateLine}
            onRemoveLine={quoteState.removeLine}
            onCustomerChange={quoteState.setCustomer}
            onOplossingenChange={quoteState.setOplossingen}
            onDiagnoseDetailsChange={quoteState.setDiagnoseDetails}
            onOppervlakteChange={quoteState.setOppervlakte}
            onDefaultsChange={(updates) => quoteState.setDefaults((prev) => ({ ...prev, ...updates }))}
          />
        </div>
      </div>

      {/* Mobile: tabs */}
      <div className="lg:hidden flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <TabsList className="mx-4 mt-2 grid grid-cols-2">
            <TabsTrigger value="chat" className="gap-1">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="offerte" className="gap-1">
              <FileText className="h-3.5 w-3.5" />
              Offerte
              {quoteState.lineItems.length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                  {quoteState.lineItems.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="flex-1 overflow-hidden mt-0">
            <ChatPanel
              messages={messages}
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              isLoading={isLoading}
              stop={stop}
            />
          </TabsContent>
          <TabsContent value="offerte" className="flex-1 overflow-hidden mt-0">
            <QuotePanel
              lineItems={quoteState.lineItems}
              customer={quoteState.customer}
              discount={quoteState.discount}
              notes={quoteState.notes}
              oplossingen={quoteState.oplossingen}
              diagnoseDetails={quoteState.diagnoseDetails}
              oppervlakte={quoteState.oppervlakte}
              defaults={quoteState.defaults}
              subtotalIncl={quoteState.subtotalIncl}
              discountAmount={quoteState.discountAmount}
              afterDiscount={quoteState.afterDiscount}
              exclBtw={quoteState.exclBtw}
              btwAmount={quoteState.btwAmount}
              btwPercentage={quoteState.btwPercentage}
              onUpdateLine={quoteState.updateLine}
              onRemoveLine={quoteState.removeLine}
              onCustomerChange={quoteState.setCustomer}
              onOplossingenChange={quoteState.setOplossingen}
              onDiagnoseDetailsChange={quoteState.setDiagnoseDetails}
              onOppervlakteChange={quoteState.setOppervlakte}
              onDefaultsChange={(updates) => quoteState.setDefaults((prev) => ({ ...prev, ...updates }))}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
