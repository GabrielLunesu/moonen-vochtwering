'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { PIPELINE_STAGES } from '@/lib/utils/pipeline';
import { Users, UserCheck, FileText, CheckCircle } from 'lucide-react';

const statConfig = [
  { key: 'total', label: 'Totaal leads', icon: Users, color: '#355b23' },
  { key: 'bevestigd', label: 'Bevestigd', icon: UserCheck, color: '#6366f1' },
  { key: 'offerte_verzonden', label: 'Offertes uit', icon: FileText, color: '#f97316' },
  { key: 'akkoord', label: 'Akkoord', icon: CheckCircle, color: '#22c55e' },
];

export default function PipelineStats({ leads }) {
  const counts = {
    total: leads.length,
    bevestigd: leads.filter(l => l.status === 'bevestigd').length,
    offerte_verzonden: leads.filter(l => l.status === 'offerte_verzonden').length,
    akkoord: leads.filter(l => l.status === 'akkoord').length,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map(({ key, label, icon: Icon, color }) => (
        <Card key={key}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className="h-4 w-4" style={{ color }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts[key]}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
