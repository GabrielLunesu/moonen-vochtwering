'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Separator } from '@/app/components/ui/separator';
import { toast } from 'sonner';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsForm() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Local form state
  const [baseRate, setBaseRate] = useState('280');
  const [minCharge, setMinCharge] = useState('1500');
  const [followUp1, setFollowUp1] = useState('2');
  const [followUp2, setFollowUp2] = useState('5');
  const [followUp3, setFollowUp3] = useState('10');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        if (data.pricing) {
          setBaseRate(String(data.pricing.base_rate || 280));
          setMinCharge(String(data.pricing.min_charge || 1500));
        }
        if (data.follow_up_days) {
          const days = data.follow_up_days;
          setFollowUp1(String(days[0] || 2));
          setFollowUp2(String(days[1] || 5));
          setFollowUp3(String(days[2] || 10));
        }
      })
      .catch(() => toast.error('Kon instellingen niet laden'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pricing: {
            base_rate: Number(baseRate),
            min_charge: Number(minCharge),
          },
          follow_up_days: [
            Number(followUp1),
            Number(followUp2),
            Number(followUp3),
          ],
        }),
      });
      if (!res.ok) throw new Error();
      toast.success('Instellingen opgeslagen');
    } catch {
      toast.error('Kon instellingen niet opslaan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prijzen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tarief per m² (€)</Label>
              <Input
                type="number"
                value={baseRate}
                onChange={(e) => setBaseRate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Minimale offerte (€)</Label>
              <Input
                type="number"
                value={minCharge}
                onChange={(e) => setMinCharge(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Follow-up schema</CardTitle>
          <p className="text-sm text-muted-foreground">
            Dagen na offerteverzending voor automatische herinnering
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>1e herinnering (dag)</Label>
              <Input
                type="number"
                value={followUp1}
                onChange={(e) => setFollowUp1(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>2e herinnering (dag)</Label>
              <Input
                type="number"
                value={followUp2}
                onChange={(e) => setFollowUp2(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>3e herinnering (dag)</Label>
              <Input
                type="number"
                value={followUp3}
                onChange={(e) => setFollowUp3(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="gap-2"
        style={{ backgroundColor: '#355b23' }}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Opslaan...' : 'Instellingen opslaan'}
      </Button>
    </div>
  );
}
