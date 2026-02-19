'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { toast } from 'sonner';
import { RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function GoogleCalendarSettings() {
  const [syncing, setSyncing] = useState(false);
  const [watching, setWatching] = useState(false);
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState(null); // null | 'connected' | 'not_configured'
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  async function testConnection() {
    setTesting(true);
    try {
      const res = await fetch('/api/gcal/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setStatus('connected');
        setLastSync(new Date().toLocaleTimeString('nl-NL'));
        if (data.synced > 0) {
          toast.success(`${data.synced} agenda-items gesynchroniseerd`);
        }
      } else {
        const body = await res.json().catch(() => ({}));
        if (res.status === 500 && body.error?.includes('Google')) {
          setStatus('not_configured');
        } else if (res.status === 500) {
          setStatus('not_configured');
        } else {
          setStatus('connected');
        }
      }
    } catch {
      setStatus('not_configured');
    } finally {
      setTesting(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/gcal/sync?full=true', { method: 'POST' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLastSync(new Date().toLocaleTimeString('nl-NL'));
      toast.success(`Volledige sync voltooid: ${data.synced} items`);
    } catch {
      toast.error('Synchronisatie mislukt');
    } finally {
      setSyncing(false);
    }
  }

  async function handleWatch() {
    setWatching(true);
    try {
      const res = await fetch('/api/gcal/watch', { method: 'POST' });
      if (!res.ok) throw new Error();
      toast.success('Push-notificaties geactiveerd');
    } catch {
      toast.error('Kon push-notificaties niet activeren');
    } finally {
      setWatching(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Google Agenda</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Status:</span>
          {testing ? (
            <Badge variant="outline" className="gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Testen...
            </Badge>
          ) : status === 'connected' ? (
            <Badge variant="default" className="gap-1 bg-green-600">
              <CheckCircle2 className="h-3 w-3" />
              Verbonden
            </Badge>
          ) : (
            <Badge variant="destructive" className="gap-1">
              <XCircle className="h-3 w-3" />
              Niet geconfigureerd
            </Badge>
          )}
          {lastSync && (
            <span className="text-xs text-muted-foreground ml-2">
              Laatste sync: {lastSync}
            </span>
          )}
        </div>

        {status === 'not_configured' && (
          <p className="text-sm text-muted-foreground">
            Google Calendar is nog niet geconfigureerd. Voeg de omgevingsvariabelen toe:
            GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
            GOOGLE_CALENDAR_ID, GCAL_WEBHOOK_SECRET.
          </p>
        )}

        {status === 'connected' && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSync}
              disabled={syncing}
              className="gap-2"
            >
              {syncing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Volledige sync
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleWatch}
              disabled={watching}
              className="gap-2"
            >
              {watching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Push-notificaties vernieuwen
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={testConnection}
              disabled={testing}
              className="gap-2"
            >
              Verbinding testen
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
