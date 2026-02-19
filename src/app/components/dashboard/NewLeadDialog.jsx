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

export default function NewLeadDialog({ open, onOpenChange }) {
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
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast.error(body?.error || 'Kon lead niet aanmaken');
        return;
      }

      toast.success('Aanvraag aangemaakt');
      setForm(emptyForm);
      setErrors({});
      onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nieuwe aanvraag</DialogTitle>
          <DialogDescription>
            Maak handmatig een nieuwe lead aan. De lead verschijnt als &quot;Nieuw&quot; in de pipeline.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nl-name">Naam *</Label>
              <Input
                id="nl-name"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Jan de Vries"
                className={errors.name ? 'border-red-400' : ''}
              />
              {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-phone">Telefoon *</Label>
              <Input
                id="nl-phone"
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
            <Label htmlFor="nl-email">E-mail</Label>
            <Input
              id="nl-email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jan@voorbeeld.nl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nl-straat">Straat + huisnummer</Label>
            <Input
              id="nl-straat"
              value={form.straat}
              onChange={(e) => handleChange('straat', e.target.value)}
              placeholder="Voorbeeldstraat 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nl-postcode">Postcode</Label>
              <Input
                id="nl-postcode"
                value={form.postcode}
                onChange={(e) => handleChange('postcode', e.target.value)}
                placeholder="1234 AB"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nl-plaatsnaam">Plaatsnaam</Label>
              <Input
                id="nl-plaatsnaam"
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
            <Label htmlFor="nl-message">Toelichting</Label>
            <Textarea
              id="nl-message"
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
