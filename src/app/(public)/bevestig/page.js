'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import { CheckCircle, AlertCircle, Loader2, MapPin, Calendar } from 'lucide-react';
import SlotCalendar from '@/app/components/public/SlotCalendar';

export default function BevestigPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <BevestigContent />
    </Suspense>
  );
}

function BevestigContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState('address'); // address, select, submitting, success, error
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedSlotLabel, setSelectedSlotLabel] = useState('');
  const [addressErrors, setAddressErrors] = useState({});
  const [address, setAddress] = useState({
    straat: '',
    postcode: '',
    plaatsnaam: '',
  });

  useEffect(() => {
    if (!token) return;
    fetch('/api/availability/public?limit=60')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setSlots(data))
      .catch(() => setSlots([]));
  }, [token]);

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
    if (addressErrors[name]) {
      setAddressErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateAddress = () => {
    const errors = {};
    if (!address.straat.trim()) errors.straat = 'Straat en huisnummer is verplicht';
    if (!address.postcode.trim()) errors.postcode = 'Postcode is verplicht';
    if (!address.plaatsnaam.trim()) errors.plaatsnaam = 'Plaatsnaam is verplicht';
    setAddressErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (!validateAddress()) return;
    setStep('select');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlotId) return;

    setStep('submitting');

    try {
      const res = await fetch('/api/customer/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          slot_id: selectedSlotId,
          plaatsnaam: address.plaatsnaam,
          postcode: address.postcode,
          straat: address.straat,
        }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        if (res.status === 409 && errorBody?.code === 'SLOT_FULL') {
          setSlots((prev) => prev.filter((slot) => slot.id !== selectedSlotId));
          setSelectedSlotId(null);
        }
        throw new Error(errorBody?.error || 'Kon inspectie niet bevestigen');
      }

      // Build label for confirmation
      const slot = slots.find((s) => s.id === selectedSlotId);
      if (slot) {
        const dateLabel = new Date(`${slot.slot_date}T12:00:00`).toLocaleDateString('nl-NL', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        });
        setSelectedSlotLabel(`${dateLabel} om ${slot.slot_time.slice(0, 5)}`);
      }
      setStep('success');
    } catch {
      setStep('error');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Ongeldige link</p>
            <p className="text-sm text-muted-foreground mt-2">
              Deze link is ongeldig of verlopen. Neem contact op via 06 18 16 25 15.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#355b23' }} />
            <p className="text-lg font-medium">Bevestigd!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Uw inspectie is ingepland op {selectedSlotLabel}. U ontvangt een bevestigingsmail.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg font-medium">Er ging iets mis</p>
            <p className="text-sm text-muted-foreground mt-2">
              Probeer het opnieuw of bel ons op 06 18 16 25 15.
            </p>
            <Button className="mt-4" onClick={() => setStep('select')}>
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'address') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2">
              <MapPin className="h-8 w-8" style={{ color: '#355b23' }} />
            </div>
            <CardTitle style={{ color: '#355b23' }}>Waar mogen wij langskomen?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Vul uw adres in zodat onze specialist u kan bezoeken
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="straat">Straat + huisnummer *</Label>
                <Input
                  id="straat"
                  name="straat"
                  value={address.straat}
                  onChange={handleAddressChange}
                  placeholder="Voorbeeldstraat 1"
                  className={addressErrors.straat ? 'border-red-400' : ''}
                />
                {addressErrors.straat && <p className="text-red-500 text-xs">{addressErrors.straat}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="postcode">Postcode *</Label>
                  <Input
                    id="postcode"
                    name="postcode"
                    value={address.postcode}
                    onChange={handleAddressChange}
                    placeholder="1234 AB"
                    className={addressErrors.postcode ? 'border-red-400' : ''}
                  />
                  {addressErrors.postcode && <p className="text-red-500 text-xs">{addressErrors.postcode}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plaatsnaam">Plaatsnaam *</Label>
                  <Input
                    id="plaatsnaam"
                    name="plaatsnaam"
                    value={address.plaatsnaam}
                    onChange={handleAddressChange}
                    placeholder="Heerlen"
                    className={addressErrors.plaatsnaam ? 'border-red-400' : ''}
                  />
                  {addressErrors.plaatsnaam && <p className="text-red-500 text-xs">{addressErrors.plaatsnaam}</p>}
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                style={{ backgroundColor: '#355b23' }}
              >
                Verder
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // step === 'select' or 'submitting'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2">
            <Calendar className="h-8 w-8" style={{ color: '#355b23' }} />
          </div>
          <CardTitle style={{ color: '#355b23' }}>Kies een moment</CardTitle>
          <p className="text-sm text-muted-foreground">
            Kies een datum en tijdstip voor uw gratis vochtinspectie
          </p>
        </CardHeader>
        <CardContent>
          {slots.length === 0 && (
            <div className="rounded-md border p-3 text-sm text-muted-foreground mb-4">
              Er zijn momenteel geen beschikbare momenten. Bel ons op 06 18 16 25 15, dan plannen we direct met u in.
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            {slots.length > 0 && (
              <SlotCalendar
                slots={slots}
                selectedSlotId={selectedSlotId}
                onSelectSlot={setSelectedSlotId}
              />
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={!selectedSlotId || step === 'submitting' || slots.length === 0}
              style={{ backgroundColor: '#355b23' }}
            >
              {step === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Bevestigen...
                </>
              ) : (
                'Bevestig inspectie'
              )}
            </Button>

            <button
              type="button"
              onClick={() => setStep('address')}
              className="w-full text-sm text-muted-foreground hover:underline"
            >
              Terug naar adres
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
