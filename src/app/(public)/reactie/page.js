'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { CheckCircle, AlertCircle, Loader2, MessageSquare } from 'lucide-react';

export default function ReactiePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
      <ReactieContent />
    </Suspense>
  );
}

function ReactieContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const initialResponse = searchParams.get('response');
  const [step, setStep] = useState(initialResponse === 'akkoord' ? 'confirm_akkoord' : initialResponse === 'vraag' ? 'vraag_form' : 'select');
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitResponse = async (response, message) => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/customer/quote-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, response, message }),
      });
      if (!res.ok) throw new Error();
      setStep(response === 'akkoord' ? 'success_akkoord' : 'success_vraag');
    } catch {
      setStep('error');
    } finally {
      setSubmitting(false);
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
              Neem contact op via 06 18 16 25 15.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success_akkoord') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#355b23' }} />
            <p className="text-lg font-bold">Bedankt!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Wij hebben uw akkoord ontvangen en nemen binnenkort contact op om de werkzaamheden in te plannen.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'success_vraag') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-4" style={{ color: '#355b23' }} />
            <p className="text-lg font-bold">Vraag ontvangen</p>
            <p className="text-sm text-muted-foreground mt-2">
              Wij nemen zo snel mogelijk contact met u op.
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
            <p>Er ging iets mis. Bel ons op 06 18 16 25 15.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'confirm_akkoord') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle style={{ color: '#355b23' }}>Offerte accepteren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-center text-muted-foreground">
              Wilt u de offerte accepteren? Wij nemen daarna contact op om de werkzaamheden in te plannen.
            </p>
            <Button
              className="w-full"
              disabled={submitting}
              onClick={() => submitResponse('akkoord')}
              style={{ backgroundColor: '#355b23' }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Ja, ik ga akkoord
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setStep('vraag_form')}>
              Ik heb eerst een vraag
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'vraag_form') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle style={{ color: '#355b23' }}>Uw vraag</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Stel uw vraag..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              rows={4}
            />
            <Button
              className="w-full"
              disabled={!question.trim() || submitting}
              onClick={() => submitResponse('vraag', question)}
              style={{ backgroundColor: '#355b23' }}
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Verstuur vraag
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default: select response
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle style={{ color: '#355b23' }}>Reactie op offerte</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            className="w-full"
            onClick={() => setStep('confirm_akkoord')}
            style={{ backgroundColor: '#355b23' }}
          >
            Ik ga akkoord
          </Button>
          <Button variant="outline" className="w-full" onClick={() => setStep('vraag_form')}>
            Ik heb een vraag
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => submitResponse('nee')}
          >
            Nee bedankt
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
