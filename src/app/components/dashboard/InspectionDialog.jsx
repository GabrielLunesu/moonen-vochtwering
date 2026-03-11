import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function InspectionDialog({ isOpen, onClose, onSave, leadData }) {
    const [dateStr, setDateStr] = useState('');
    const [timeStr, setTimeStr] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && leadData) {
            setDateStr(leadData.proposed_date || leadData.inspection_date || '');
            setTimeStr(leadData.proposed_time || (leadData.inspection_time ? leadData.inspection_time.slice(0, 5) : ''));
        }
    }, [isOpen, leadData]);

    if (!leadData) return null;

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/leads/${leadData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inspection_date: dateStr,
                    inspection_time: timeStr,
                }),
            });

            if (!res.ok) {
                throw new Error('Kon inspectie niet wijzigen');
            }

            toast.success('Inspectie gewijzigd');
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSuggestTime = async () => {
        if (!dateStr || !timeStr) {
            toast.error('Vul eerst datum en tijd in');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/leads/${leadData.id}/suggest-time`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    date: dateStr,
                    time: timeStr,
                }),
            });

            if (!res.ok) {
                const errorBody = await res.json().catch(() => ({}));
                throw new Error(errorBody?.error || 'Kon voorstel niet sturen');
            }

            toast.success('Voorstel e-mail succesvol verzonden');
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUnschedule = async () => {
        if (!confirm('Weet je zeker dat je deze inspectie van de agenda wilt verwijderen? (De lead blijft bestaan)')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/leads/${leadData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inspection_date: null,
                    inspection_time: null,
                }),
            });

            if (!res.ok) {
                throw new Error('Kon inspectie niet van agenda verwijderen');
            }

            toast.success('Inspectie van agenda verwijderd');
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Inspectie details</DialogTitle>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="space-y-1">
                        <p className="font-semibold">{leadData.name}</p>
                        {leadData.phone && <p className="text-sm text-gray-600">{leadData.phone}</p>}
                        {leadData.email && <p className="text-sm text-gray-600">{leadData.email}</p>}
                        {(leadData.straat || leadData.plaatsnaam) && (
                            <p className="text-sm text-gray-600">
                                {[leadData.straat, leadData.postcode, leadData.plaatsnaam].filter(Boolean).join(', ')}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <p className="text-sm font-medium">Probleem</p>
                        <p className="text-sm text-gray-600 capitalize">{leadData.type_probleem ? leadData.type_probleem.replace('_', ' ') : 'Geen type opgegeven'}</p>
                        {leadData.message && <p className="text-sm text-gray-600 mt-1 line-clamp-2">{leadData.message}</p>}
                    </div>

                    <form id="inspection-form" onSubmit={handleSave} className="grid grid-cols-2 gap-4 pt-2">
                        <div className="grid gap-2">
                            <Label>Datum</Label>
                            <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Tijd</Label>
                            <Input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} required />
                        </div>
                    </form>
                </div>

                <DialogFooter className="mt-2 flex flex-col sm:flex-row sm:justify-between items-center w-full gap-2">
                    <div className="flex gap-2">
                        <Button type="button" variant="outline" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleUnschedule} disabled={loading}>
                            Vrijgeven
                        </Button>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button type="button" variant="ghost" onClick={() => window.open(`/dashboard/lead/${leadData.id}`, '_blank')} disabled={loading}>
                            Bekijk Lead
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleSuggestTime} disabled={loading} title="Stuur een e-mail naar de klant met een voorstel voor deze datum/tijd">
                            Voorstellen
                        </Button>
                        <Button type="submit" form="inspection-form" disabled={loading} title="Bewaar direct op deze datum/tijd">
                            Opslaan
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
