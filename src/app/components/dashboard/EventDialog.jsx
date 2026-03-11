import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/components/ui/dialog';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { toast } from 'sonner';

export default function EventDialog({ isOpen, onClose, onSave, onDelete, eventData }) {
    const [summary, setSummary] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [dateStr, setDateStr] = useState('');
    const [endDateStr, setEndDateStr] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('10:00');
    const [isAllDay, setIsAllDay] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && eventData) {
            setSummary(eventData.summary || '');
            setDescription(eventData.description || '');
            setLocation(eventData.location || '');

            const startObj = eventData.start_time ? new Date(eventData.start_time) : new Date();
            const endObj = eventData.end_time ? new Date(eventData.end_time) : new Date(startObj.getTime() + 60 * 60 * 1000);

            setDateStr(startObj.toISOString().split('T')[0]);
            setEndDateStr(endObj.toISOString().split('T')[0]);

            setStartTime(startObj.toISOString().split('T')[1].slice(0, 5));
            setEndTime(endObj.toISOString().split('T')[1].slice(0, 5));

            setIsAllDay(!!eventData.is_all_day);
        } else if (isOpen) {
            // Setup defaults for a new event
            setSummary('');
            setDescription('');
            setLocation('');
            setIsAllDay(false);

            // If we clicked a specific time slot on the calendar
            if (eventData?.start_time) {
                const s = new Date(eventData.start_time);
                setDateStr(s.toISOString().split('T')[0]);
                setEndDateStr(s.toISOString().split('T')[0]);
                setStartTime(s.toTimeString().slice(0, 5));
                const e = new Date(s.getTime() + 60 * 60 * 1000);
                setEndTime(e.toTimeString().slice(0, 5));
            } else {
                const now = new Date();
                setDateStr(now.toISOString().split('T')[0]);
                setEndDateStr(now.toISOString().split('T')[0]);
                setStartTime('09:00');
                setEndTime('10:00');
            }
        }
    }, [isOpen, eventData]);

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            summary,
            description,
            location,
            is_all_day: isAllDay,
            start_time: isAllDay ? `${dateStr}T00:00:00+01:00` : `${dateStr}T${startTime}:00+01:00`,
            end_time: isAllDay ? `${endDateStr}T23:59:59+01:00` : `${endDateStr}T${endTime}:00+01:00`,
        };

        try {
            const isEdit = eventData?.id;
            const url = isEdit ? `/api/events/${eventData.id}` : '/api/events';
            const method = isEdit ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                throw new Error(d.error || 'Er ging iets fout opslaan geberutenis');
            }

            toast.success(isEdit ? 'Gebeurtenis gewijzigd' : 'Gebeurtenis toegevoegd');
            onSave();
            onClose();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!eventData?.id) return;
        if (!confirm('Weet je zeker dat je deze gebeurtenis wilt verwijderen?')) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/events/${eventData.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Kon niet verwijderen');

            toast.success('Gebeurtenis verwijderd');
            onDelete();
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
                    <DialogTitle>{eventData?.id ? 'Gebeurtenis bewerken' : 'Nieuwe gebeurtenis'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="grid py-4 gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="summary">Titel</Label>
                        <Input id="summary" value={summary} onChange={(e) => setSummary(e.target.value)} required placeholder="Bv. Team Meeting" />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox id="allday" checked={isAllDay} onCheckedChange={(checked) => setIsAllDay(!!checked)} />
                        <Label htmlFor="allday" className="cursor-pointer">Hele dag</Label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Start</Label>
                            <Input type="date" value={dateStr} onChange={(e) => setDateStr(e.target.value)} required />
                            {!isAllDay && <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />}
                        </div>
                        <div className="grid gap-2">
                            <Label>Eind</Label>
                            <Input type="date" value={endDateStr} onChange={(e) => setEndDateStr(e.target.value)} required />
                            {!isAllDay && <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />}
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="location">Locatie (optioneel)</Label>
                        <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Bv. Kantoor Maastricht" />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="description">Beschrijving (optioneel)</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
                    </div>

                    <DialogFooter className="mt-4 flex sm:justify-between items-center w-full">
                        {eventData?.id ? (
                            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                                Verwijderen
                            </Button>
                        ) : <span />}
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                                Annuleren
                            </Button>
                            <Button type="submit" disabled={loading}>
                                Opslaan
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
