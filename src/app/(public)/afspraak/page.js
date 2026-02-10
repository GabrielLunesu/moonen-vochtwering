'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { CheckCircle, AlertCircle, Loader2, Calendar, XCircle } from 'lucide-react';

export default function AfspraakPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <AfspraakContent />
    </Suspense>
  );
}

function AfspraakContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [step, setStep] = useState('loading'); // loading, view, reschedule, cancel-confirm, submitting, success, error, no-appointment
  const [appointment, setAppointment] = useState(null);
  const [slots, setSlots] = useState([]);
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [actionType, setActionType] = useState(''); // 'reschedule' or 'cancel'
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`/api/customer/appointment?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error('invalid');
        return res.json();
      })
      .then((data) => {
        setAppointment(data);
        if (!data.inspection_date || !data.inspection_time) {
          setStep('no-appointment');
        } else {
          setStep('view');
        }
      })
      .catch(() => setStep('error'));
  }, [token]);

  const loadSlots = () => {
    fetch('/api/availability/public?limit=60')
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => setSlots(data))
      .catch(() => setSlots([]));
  };

  const formattedDate = appointment?.inspection_date
    ? new Date(`${appointment.inspection_date}T12:00:00`).toLocaleDateString('nl-NL', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '';

  const isWithin24Hours = appointment?.inspection_date && appointment?.inspection_time
    ? (() => {
        const [hours, minutes] = appointment.inspection_time.split(':').map(Number);
        const appointmentDate = new Date(`${appointment.inspection_date}T00:00:00`);
        appointmentDate.setHours(hours, minutes, 0, 0);
        const hoursUntil = (appointmentDate - new Date()) / (1000 * 60 * 60);
        return hoursUntil < 24;
      })()
    : false;

  const slotOptions = slots.map((slot) => ({
    id: slot.id,
    label: `${new Date(`${slot.slot_date}T12:00:00`).toLocaleDateString('nl-NL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })} om ${slot.slot_time}`,
  }));

  const handleReschedule = async () => {
    if (!selectedSlotId) return;
    setStep('submitting');
    setActionType('reschedule');

    try {
      const res = await fetch('/api/customer/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, slot_id: selectedSlotId }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        if (res.status === 409 && errorBody?.code === 'SLOT_FULL') {
          setSlots((prev) => prev.filter((slot) => slot.id !== selectedSlotId));
          setSelectedSlotId('');
          setStep('reschedule');
          setErrorMessage('Dit moment is helaas niet meer beschikbaar. Kies een ander moment.');
          return;
        }
        throw new Error(errorBody?.error || 'Kon afspraak niet wijzigen');
      }

      const data = await res.json();
      setAppointment((prev) => ({
        ...prev,
        inspection_date: data.date,
        inspection_time: data.time,
      }));
      setStep('success');
    } catch {
      setStep('error');
    }
  };

  const handleCancel = async () => {
    setStep('submitting');
    setActionType('cancel');

    try {
      const res = await fetch('/api/customer/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const errorBody = await res.json().catch(() => ({}));
        throw new Error(errorBody?.error || 'Kon afspraak niet annuleren');
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

  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (step === 'no-appointment') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">Geen actieve afspraak</p>
            <p className="text-sm text-muted-foreground mt-2">
              Er staat geen inspectie gepland. Wilt u een inspectie inplannen?
            </p>
            <Button
              className="mt-4"
              style={{ backgroundColor: '#355b23' }}
              onClick={() => {
                window.location.href = `/bevestig?token=${token}`;
              }}
            >
              Inspectie inplannen
            </Button>
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
            <p className="text-lg font-medium">
              {actionType === 'reschedule' ? 'Afspraak gewijzigd!' : 'Afspraak geannuleerd'}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {actionType === 'reschedule'
                ? 'U ontvangt een bevestigingsmail met de nieuwe datum.'
                : 'Uw afspraak is geannuleerd. U ontvangt een bevestigingsmail.'}
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
            <Button className="mt-4" onClick={() => setStep('view')}>
              Opnieuw proberen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'cancel-confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <XCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-lg">Weet u het zeker?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Uw inspectie op <strong>{formattedDate}</strong> om <strong>{appointment.inspection_time}</strong> wordt geannuleerd.
            </p>
            {isWithin24Hours && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Wij verzoeken u vriendelijk om wijzigingen minimaal 24 uur van tevoren door te geven.
              </div>
            )}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep('view')}
              >
                Terug
              </Button>
              <Button
                className="flex-1"
                variant="destructive"
                onClick={handleCancel}
              >
                Annuleren
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'reschedule') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <Calendar className="h-8 w-8 mx-auto mb-2" style={{ color: '#355b23' }} />
            <CardTitle style={{ color: '#355b23' }}>Kies een nieuw moment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isWithin24Hours && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Wij verzoeken u vriendelijk om wijzigingen minimaal 24 uur van tevoren door te geven.
              </div>
            )}
            {errorMessage && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                {errorMessage}
              </div>
            )}
            {slotOptions.length === 0 ? (
              <div className="rounded-md border p-3 text-sm text-muted-foreground">
                Er zijn momenteel geen beschikbare momenten. Bel ons op 06 18 16 25 15, dan plannen we direct met u in.
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Nieuw moment</Label>
                  <Select value={selectedSlotId} onValueChange={(val) => { setSelectedSlotId(val); setErrorMessage(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kies een moment" />
                    </SelectTrigger>
                    <SelectContent>
                      {slotOptions.map((slot) => (
                        <SelectItem key={slot.id} value={slot.id}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  className="w-full"
                  style={{ backgroundColor: '#355b23' }}
                  disabled={!selectedSlotId}
                  onClick={handleReschedule}
                >
                  Bevestig nieuw moment
                </Button>
              </>
            )}
            <button
              type="button"
              onClick={() => { setStep('view'); setErrorMessage(''); }}
              className="w-full text-sm text-muted-foreground hover:underline"
            >
              Terug
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#355b23' }} />
            <p className="text-sm text-muted-foreground">
              {actionType === 'reschedule' ? 'Afspraak wijzigen...' : 'Afspraak annuleren...'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // step === 'view'
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <Calendar className="h-8 w-8 mx-auto mb-2" style={{ color: '#355b23' }} />
          <CardTitle style={{ color: '#355b23' }}>Uw afspraak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div style={{ background: '#f0f7ec', borderLeft: '4px solid #355b23' }} className="p-4 rounded-r">
            <p className="font-semibold text-sm text-gray-800">Datum: {formattedDate}</p>
            <p className="font-semibold text-sm text-gray-800">Tijd: {appointment.inspection_time}</p>
            {appointment.plaatsnaam && (
              <p className="text-sm text-gray-600 mt-1">Locatie: {appointment.plaatsnaam}</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1"
              style={{ backgroundColor: '#355b23' }}
              onClick={() => {
                loadSlots();
                setStep('reschedule');
              }}
            >
              Verzetten
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setStep('cancel-confirm')}
            >
              Annuleren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
