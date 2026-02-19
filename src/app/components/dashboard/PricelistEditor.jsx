'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { Skeleton } from '@/app/components/ui/skeleton';
import { toast } from 'sonner';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  DEFAULT_LINE_ITEM_TEMPLATES,
  EXTRA_LINE_ITEMS,
  KELDER_SUB_AREAS,
  OPLOSSING_OPTIONS,
} from '@/lib/utils/inspection-constants';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Build a user-friendly category structure from the template keys
const TEMPLATE_CATEGORIES = [
  ...KELDER_SUB_AREAS.map((area) => ({
    key: area.templateKey,
    label: `Kelder: ${area.label}`,
  })),
  ...OPLOSSING_OPTIONS.filter((o) => !o.hasSubAreas && o.templateKey).map((o) => ({
    key: o.templateKey,
    label: o.value,
  })),
];

export default function PricelistEditor() {
  const [templates, setTemplates] = useState(null);
  const [extras, setExtras] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((settings) => {
        if (settings.pricelist?.templates) {
          setTemplates(deepClone(settings.pricelist.templates));
        } else if (settings.line_item_templates) {
          setTemplates(deepClone(settings.line_item_templates));
        } else {
          setTemplates(deepClone(DEFAULT_LINE_ITEM_TEMPLATES));
        }
        if (settings.pricelist?.extras) {
          setExtras(deepClone(settings.pricelist.extras));
        } else {
          setExtras(deepClone(EXTRA_LINE_ITEMS));
        }
      })
      .catch(() => {
        setTemplates(deepClone(DEFAULT_LINE_ITEM_TEMPLATES));
        setExtras(deepClone(EXTRA_LINE_ITEMS));
      })
      .finally(() => setLoading(false));
  }, []);

  const updateTemplateItem = (categoryKey, itemIndex, field, value) => {
    setTemplates((prev) => {
      const next = { ...prev };
      next[categoryKey] = [...(next[categoryKey] || [])];
      next[categoryKey][itemIndex] = { ...next[categoryKey][itemIndex], [field]: value };
      return next;
    });
  };

  const addTemplateItem = (categoryKey) => {
    setTemplates((prev) => ({
      ...prev,
      [categoryKey]: [
        ...(prev[categoryKey] || []),
        { description: '', unit: 'm\u00b2', unit_price: 0 },
      ],
    }));
  };

  const removeTemplateItem = (categoryKey, itemIndex) => {
    setTemplates((prev) => ({
      ...prev,
      [categoryKey]: (prev[categoryKey] || []).filter((_, i) => i !== itemIndex),
    }));
  };

  const updateStaffel = (categoryKey, itemIndex, staffelIndex, field, value) => {
    setTemplates((prev) => {
      const next = { ...prev };
      next[categoryKey] = [...(next[categoryKey] || [])];
      const item = { ...next[categoryKey][itemIndex] };
      item.staffels = [...(item.staffels || [])];
      item.staffels[staffelIndex] = { ...item.staffels[staffelIndex], [field]: Number(value) || 0 };
      next[categoryKey][itemIndex] = item;
      return next;
    });
  };

  const addStaffel = (categoryKey, itemIndex) => {
    setTemplates((prev) => {
      const next = { ...prev };
      next[categoryKey] = [...(next[categoryKey] || [])];
      const item = { ...next[categoryKey][itemIndex] };
      item.staffels = [...(item.staffels || []), { vanaf: 20, prijs: 0 }];
      next[categoryKey][itemIndex] = item;
      return next;
    });
  };

  const removeStaffel = (categoryKey, itemIndex, staffelIndex) => {
    setTemplates((prev) => {
      const next = { ...prev };
      next[categoryKey] = [...(next[categoryKey] || [])];
      const item = { ...next[categoryKey][itemIndex] };
      item.staffels = (item.staffels || []).filter((_, i) => i !== staffelIndex);
      if (item.staffels.length === 0) delete item.staffels;
      next[categoryKey][itemIndex] = item;
      return next;
    });
  };

  const updateExtra = (index, field, value) => {
    setExtras((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const addExtra = () => {
    setExtras((prev) => [...prev, { description: '', unit: 'stuk', unit_price: 0 }]);
  };

  const removeExtra = (index) => {
    setExtras((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Clean up templates: convert prices to numbers
      const cleanTemplates = {};
      for (const [key, items] of Object.entries(templates)) {
        cleanTemplates[key] = items.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price) || 0,
          ...(item.minimum ? { minimum: Number(item.minimum) || 0 } : {}),
          ...(item.staffels
            ? {
                staffels: item.staffels.map((s) => ({
                  vanaf: Number(s.vanaf) || 0,
                  prijs: Number(s.prijs) || 0,
                })),
              }
            : {}),
        }));
      }

      const cleanExtras = extras.map((item) => ({
        ...item,
        unit_price: Number(item.unit_price) || 0,
        ...(item.staffels
          ? {
              staffels: item.staffels.map((s) => ({
                vanaf: Number(s.vanaf) || 0,
                prijs: Number(s.prijs) || 0,
              })),
            }
          : {}),
      }));

      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricelist: {
            templates: cleanTemplates,
            extras: cleanExtras,
          },
        }),
      });

      if (!res.ok) throw new Error();
      toast.success('Prijslijst opgeslagen');
    } catch {
      toast.error('Kon prijslijst niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !templates || !extras) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Template categories */}
      {TEMPLATE_CATEGORIES.map((cat) => {
        const items = templates[cat.key] || [];
        return (
          <Card key={cat.key}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{cat.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="rounded-md border p-3 space-y-2">
                  <div className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-12 sm:col-span-5 space-y-1">
                      <Label className="text-xs">Omschrijving</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => updateTemplateItem(cat.key, idx, 'description', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Eenheid</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => updateTemplateItem(cat.key, idx, 'unit', e.target.value)}
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Prijs incl. BTW</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateTemplateItem(cat.key, idx, 'unit_price', e.target.value)}
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Minimum ({'\u20AC'})</Label>
                      <Input
                        type="number"
                        step="1"
                        value={item.minimum || ''}
                        placeholder="-"
                        onChange={(e) => updateTemplateItem(cat.key, idx, 'minimum', Number(e.target.value) || undefined)}
                      />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500"
                        onClick={() => removeTemplateItem(cat.key, idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Staffels */}
                  {item.staffels?.map((staffel, si) => (
                    <div key={si} className="flex items-center gap-2 ml-4 text-xs">
                      <span className="text-muted-foreground">{'\u2265'}</span>
                      <Input
                        type="number"
                        className="w-20 h-7 text-xs"
                        value={staffel.vanaf}
                        onChange={(e) => updateStaffel(cat.key, idx, si, 'vanaf', e.target.value)}
                      />
                      <span className="text-muted-foreground">= {'\u20AC'}</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-24 h-7 text-xs"
                        value={staffel.prijs}
                        onChange={(e) => updateStaffel(cat.key, idx, si, 'prijs', e.target.value)}
                      />
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStaffel(cat.key, idx, si)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs ml-4"
                    onClick={() => addStaffel(cat.key, idx)}
                  >
                    + Staffel toevoegen
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => addTemplateItem(cat.key)}>
                <Plus className="h-3.5 w-3.5" />
                Regel toevoegen
              </Button>
            </CardContent>
          </Card>
        );
      })}

      <Separator />

      {/* Extras */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Veelgebruikte toevoegingen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {extras.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-12 sm:col-span-6 space-y-1">
                <Label className="text-xs">Omschrijving</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateExtra(idx, 'description', e.target.value)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <Label className="text-xs">Eenheid</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateExtra(idx, 'unit', e.target.value)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 space-y-1">
                <Label className="text-xs">Prijs incl. BTW</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateExtra(idx, 'unit_price', e.target.value)}
                />
              </div>
              <div className="col-span-4 sm:col-span-2 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500"
                  onClick={() => removeExtra(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={addExtra}>
            <Plus className="h-3.5 w-3.5" />
            Toevoeging toevoegen
          </Button>
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-background border-t px-6 py-3 flex justify-end z-30">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="gap-2"
          style={{ backgroundColor: '#355b23' }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {saving ? 'Opslaan...' : 'Prijslijst opslaan'}
        </Button>
      </div>
    </div>
  );
}
