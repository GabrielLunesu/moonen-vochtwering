'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { CheckCircle, AlertCircle, Loader2, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function VoorstelPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <VoorstelContent />
        </Suspense>
    );
}

function VoorstelContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const dateStr = searchParams.get('date');
    const timeStr = searchParams.get('time');

    const [step, setStep] = useState('review'); // review, submitting, success, error

    const handleAccept = async () => {
        setStep('submitting');
        try {
            const res = await fetch('/api/customer/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, date: dateStr, time: timeStr }),
            });
            if (!res.ok) throw new Error();
            setStep('success');
        } catch {
            setStep('error');
        }
    };

    if (!token || !dateStr || !timeStr) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <p className="text-lg font-medium">Ongeldige link</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Deze link mist de benodigde gegevens. Neem contact op via 06 18 16 25 15.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const formattedDate = format(new Date(`${dateStr}T12:00:00`), 'EEEE d MMMM yyyy', { locale: nl });

    if (step === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <Card className="max-w-md w-full">
                    <CardContent className="p-6 text-center">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#355b23' }} />
                        <p className="text-lg font-bold">Afspraak Gepland!</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Wij hebben de afspraak succesvol in onze agenda gezet voor <span className="font-semibold">{formattedDate}</span> om <span className="font-semibold">{timeStr} uur</span>. U ontvangt hier nog een bevestiging van.
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
                            Mogelijk is dit moment al geaccepteerd of niet meer beschikbaar. Bel ons op 06 18 16 25 15.
                        </p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-2">
                        <Calendar className="h-8 w-8" style={{ color: '#355b23' }} />
                    </div>
                    <CardTitle style={{ color: '#355b23' }}>Nieuw Inspectiemoment</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        We willen graag de volgende tijd aan u voorstellen voor de vochtinspectie.
                    </p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div
                        className="rounded-md px-4 py-3 text-center border"
                        style={{ background: '#f0f7ec', borderColor: '#355b23', borderLeftWidth: '4px' }}
                    >
                        <p className="text-sm text-gray-500 mb-1">Voorgesteld moment</p>
                        <p className="text-lg text-gray-900 font-semibold capitalize">
                            {formattedDate}
                        </p>
                        <p className="text-lg text-gray-900 font-semibold">
                            om {timeStr} uur
                        </p>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full"
                            disabled={step === 'submitting'}
                            onClick={handleAccept}
                            style={{ backgroundColor: '#355b23' }}
                        >
                            {step === 'submitting' ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Bevestigen...</>
                            ) : (
                                'Ja, deze tijd schikt mij'
                            )}
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-muted-foreground">Of</span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full"
                            disabled={step === 'submitting'}
                            onClick={() => {
                                window.location.href = `/bevestig?token=${token}`;
                            }}
                        >
                            Ander moment kiezen
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
