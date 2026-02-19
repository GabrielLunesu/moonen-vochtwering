'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
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
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PROBLEEM_TYPES } from '@/lib/utils/pipeline';

const emptyForm = {
  name: '',
  phone: '',
  email: '',
  straat: '',
  postcode: '',
  plaatsnaam: '',
  type_probleem: '',
  message: '',
};

export default function QuickLeadDialog({ open, onOpenChange, slot, onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Naam is verplicht';
    if (!form.phone.trim()) newErrors.phone = 'Telefoon is verplicht';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate() || !slot) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads/create-with-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          slot_id: slot.id,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        if (res.status === 409 && body?.code === 'SLOT_FULL') {
          toast.error('Dit moment is niet meer beschikbaar');
        } else {
          toast.error(body?.error || 'Kon lead niet aanmaken');
        }
        return;
      }

      toast.success('Aanvraag aangemaakt en bevestigd');
      setForm(emptyForm);
      setErrors({});
      onOpenChange(false);
      if (onCreated) onCreated();
    } catch {
      toast.error('Er ging iets mis');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = (value) => {
    if (!submitting) {
      setForm(emptyForm);
      setErrors({});
      onOpenChange(value);
    }
  };

  const dateLabel = slot?.slot_date
    ? format(new Date(`${slot.slot_date}T12:00:00`), 'EEEE d MMMM yyyy', { locale: nl })
    : '';
  const timeLabel = slot?.slot_time ? slot.slot_time.slice(0, 5) : '';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe aanvraag</DialogTitle>
          <DialogDescription>
            Maak een nieuwe lead aan en boek direct de inspectie.
          </DialogDescription>
        </DialogHeader>

        {slot && (
          <div
            className="rounded-md px-3 py-2 text-sm"
            style={{ background: '#f0f7ec', borderLeft: '3px solid #355b23' }}
          >
            <span className="font-medium capitalize">{dateLabel}</span> om{' '}
            <span className="font-medium">{timeLabel}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ql-name">Naam *</Label>
              <Input
                id="ql-name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Jan de Vries"
                className={errors.name ? 'border-red-400' : ''}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ql-phone">Telefoon *</Label>
              <Input
                id="ql-phone"
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="06 12345678"
                className={errors.phone ? 'border-red-400' : ''}
              />
              {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ql-email">E-mail</Label>
            <Input
              id="ql-email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jan@voorbeeld.nl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ql-straat">Straat + huisnummer</Label>
            <Input
              id="ql-straat"
              value={form.straat}
              onChange={(e) => handleChange('straat', e.target.value)}
              placeholder="Voorbeeldstraat 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ql-postcode">Postcode</Label>
              <Input
                id="ql-postcode"
                value={form.postcode}
                onChange={(e) => handleChange('postcode', e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ql-plaatsnaam">Plaatsnaam</Label>
              <Input
                id="ql-plaatsnaam"
                value={form.plaatsnaam}
                onChange={(e) => handleChange('plaatsnaam', e.target.value)}
                placeholder="Heerlen"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Type probleem</Label>
            <Select
              value={form.type_probleem}
              onValueChange={(val) => handleChange('type_probleem', val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optioneel" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PROBLEEM_TYPES).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ql-message">Toelichting</Label>
            <Textarea
              id="ql-message"
              value={form.message}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Optioneel"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
              Annuleren
            </Button>
            <Button type="submit" disabled={submitting} style={{ backgroundColor: '#355b23' }}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Aanmaken...
                </>
              ) : (
                'Aanvraag aanmaken'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
