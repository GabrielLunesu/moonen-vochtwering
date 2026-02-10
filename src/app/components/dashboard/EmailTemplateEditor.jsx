'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { toast } from 'sonner';
import { Save, Loader2, RotateCcw } from 'lucide-react';

const TEMPLATE_TYPES = [
  { key: 'availability', label: 'Beschikbaarheid' },
  { key: 'confirmation', label: 'Bevestiging' },
  { key: 'quote', label: 'Offerte' },
  { key: 'follow_up', label: 'Follow-up' },
];

const DEFAULT_FIELDS = {
  availability: {
    subject: 'Gratis vochtinspectie - Kies uw moment | Moonen Vochtwering',
    greeting: 'Bedankt voor uw aanvraag. Wij komen graag bij u langs voor een gratis vochtinspectie.',
    body: 'Klik op de knop hieronder om een geschikt moment te kiezen:',
    cta_label: 'Moment kiezen',
    closing: 'De inspectie duurt ongeveer 30-45 minuten en is geheel gratis en vrijblijvend.',
  },
  confirmation: {
    subject: 'Bevestiging vochtinspectie | Moonen Vochtwering',
    greeting: 'Uw vochtinspectie is bevestigd!',
    body: 'Onze specialist komt bij u langs om de situatie te beoordelen. De inspectie is geheel gratis en vrijblijvend.',
    cta_label: '',
    closing: 'Heeft u vragen of wilt u de afspraak wijzigen? Bel ons op 06 18 16 25 15.',
  },
  quote: {
    subject: 'Uw offerte van Moonen Vochtwering',
    greeting: 'Naar aanleiding van onze inspectie hebben wij een offerte voor u opgesteld.',
    body: 'Wat wilt u doen?',
    cta_label: 'Akkoord',
    closing: '',
  },
  follow_up: {
    subject: 'Herinnering: Uw offerte van Moonen Vochtwering',
    greeting: 'Wij willen u er even aan herinneren dat u een offerte van ons heeft ontvangen.',
    body: 'Heeft u nog vragen? Wij helpen u graag.',
    cta_label: 'Offerte accepteren',
    closing: '',
  },
};

const FIELD_LABELS = {
  subject: 'Onderwerp',
  greeting: 'Begroeting / intro',
  body: 'Hoofdtekst',
  cta_label: 'Knoptekst (CTA)',
  closing: 'Afsluiting',
};

export default function EmailTemplateEditor() {
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        const loaded = {};
        for (const type of TEMPLATE_TYPES) {
          const settingKey = `email_template_${type.key}`;
          loaded[type.key] = data[settingKey] || {};
        }
        setTemplates(loaded);
      })
      .catch(() => toast.error('Kon e-mailsjablonen niet laden'))
      .finally(() => setLoading(false));
  }, []);

  const updateField = (type, field, value) => {
    setTemplates((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value,
      },
    }));
  };

  const resetTemplate = (type) => {
    setTemplates((prev) => ({
      ...prev,
      [type]: {},
    }));
    toast.info('Sjabloon hersteld naar standaard');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {};
      for (const type of TEMPLATE_TYPES) {
        const settingKey = `email_template_${type.key}`;
        const fields = templates[type.key] || {};
        // Only store non-empty overrides
        const filtered = {};
        for (const [k, v] of Object.entries(fields)) {
          if (v && v.trim()) filtered[k] = v.trim();
        }
        updates[settingKey] = Object.keys(filtered).length > 0 ? filtered : null;
      }

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!res.ok) throw new Error();
      toast.success('E-mailsjablonen opgeslagen');
    } catch {
      toast.error('Kon sjablonen niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  const renderPreview = (type) => {
    const overrides = templates[type] || {};
    const defaults = DEFAULT_FIELDS[type];
    const subject = overrides.subject || defaults.subject;
    const greeting = overrides.greeting || defaults.greeting;
    const body = overrides.body || defaults.body;
    const ctaLabel = overrides.cta_label || defaults.cta_label;
    const closing = overrides.closing || defaults.closing;

    return (
      <div className="rounded-md border bg-white text-sm">
        <div className="bg-[#355b23] px-4 py-3 text-center">
          <span className="text-white font-bold text-base">Moonen Vochtwering</span>
        </div>
        <div className="p-4 space-y-2">
          <p className="text-xs text-muted-foreground">Onderwerp: {subject}</p>
          <p>Beste [naam klant],</p>
          <p>{greeting}</p>
          <p>{body}</p>
          {ctaLabel && (
            <div className="text-center py-2">
              <span className="inline-block bg-[#355b23] text-white px-4 py-2 rounded text-sm font-medium">
                {ctaLabel}
              </span>
            </div>
          )}
          {closing && <p className="text-muted-foreground text-xs">{closing}</p>}
          <p className="text-muted-foreground text-xs mt-3">Met vriendelijke groet, Moonen Vochtwering</p>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="text-muted-foreground text-sm">E-mailsjablonen laden...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">E-mailsjablonen</CardTitle>
        <p className="text-sm text-muted-foreground">
          Pas de tekst aan van klantmails. Lege velden gebruiken de standaardtekst.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="availability">
          <TabsList className="mb-4 flex-wrap h-auto gap-1">
            {TEMPLATE_TYPES.map((type) => (
              <TabsTrigger key={type.key} value={type.key}>
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {TEMPLATE_TYPES.map((type) => (
            <TabsContent key={type.key} value={type.key} className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  {Object.keys(DEFAULT_FIELDS[type.key]).map((field) => {
                    const defaults = DEFAULT_FIELDS[type.key];
                    const current = templates[type.key]?.[field] || '';
                    const isTextarea = field === 'body' || field === 'greeting' || field === 'closing';

                    return (
                      <div key={field} className="space-y-1">
                        <Label className="text-xs">{FIELD_LABELS[field]}</Label>
                        {isTextarea ? (
                          <Textarea
                            rows={2}
                            placeholder={defaults[field]}
                            value={current}
                            onChange={(e) => updateField(type.key, field, e.target.value)}
                          />
                        ) : (
                          <Input
                            placeholder={defaults[field]}
                            value={current}
                            onChange={(e) => updateField(type.key, field, e.target.value)}
                          />
                        )}
                      </div>
                    );
                  })}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-xs"
                    onClick={() => resetTemplate(type.key)}
                  >
                    <RotateCcw className="h-3 w-3" />
                    Herstel standaard
                  </Button>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-2">Voorbeeld</p>
                  {renderPreview(type.key)}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gap-2"
            style={{ backgroundColor: '#355b23' }}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Opslaan...' : 'Sjablonen opslaan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
