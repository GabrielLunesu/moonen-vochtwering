'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { CalendarDays, Loader2 } from 'lucide-react';

export default function ExecutionDateDialog({
  open,
  onOpenChange,
  quoteId,
  customerName,
  onSaved,
}) {
  const [selectedDate, setSelectedDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!selectedDate) {
      toast.error('Selecteer een datum');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planned_execution_date: selectedDate }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Opslaan mislukt');
      }

      toast.success('Uitvoeringsdatum opgeslagen');
      setSelectedDate('');
      onOpenChange(false);
      onSaved?.();
    } catch (err) {
      console.error('[EXECUTION_DATE_SAVE_FAIL]', err);
      toast.error(err.message || 'Kon de datum niet opslaan');
    } finally {
      setSaving(false);
    }
  }

  function handleSkip() {
    setSelectedDate('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Wanneer worden de werkzaamheden uitgevoerd?
          </DialogTitle>
          <DialogDescription>
            Kies de geplande datum voor de werkzaamheden bij{' '}
            <span className="font-medium text-foreground">{customerName}</span>.
            Dit bepaalt in welke maand de omzet wordt meegerekend.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="execution-date">Geplande uitvoeringsdatum</Label>
          <Input
            id="execution-date"
            type="date"
            className="mt-1.5"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={handleSkip} disabled={saving}>
            Later bepalen
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Opslaan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
