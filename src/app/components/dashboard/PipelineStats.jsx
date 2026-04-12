'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Users, UserCheck, FileText, CheckCircle } from 'lucide-react';

// `stageKey` is the lead.status value the card filters to (null = no stage filter, just total)
const statConfig = [
  { key: 'total', stageKey: null, label: 'Totaal leads', icon: Users, color: '#355b23' },
  { key: 'bevestigd', stageKey: 'bevestigd', label: 'Bevestigd', icon: UserCheck, color: '#6366f1' },
  { key: 'offerte_verzonden', stageKey: 'offerte_verzonden', label: 'Offertes uit', icon: FileText, color: '#f97316' },
  { key: 'akkoord', stageKey: 'akkoord', label: 'Akkoord', icon: CheckCircle, color: '#22c55e' },
];

export default function PipelineStats({ leads, activeStage, onStageClick }) {
  const counts = {
    total: leads.length,
    bevestigd: leads.filter(l => l.status === 'bevestigd').length,
    offerte_verzonden: leads.filter(l => l.status === 'offerte_verzonden').length,
    akkoord: leads.filter(l => l.status === 'akkoord').length,
  };

  const handleClick = (stageKey) => {
    if (!onStageClick) return;
    // Clicking the same active stage clears the filter
    onStageClick(activeStage === stageKey ? null : stageKey);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statConfig.map(({ key, stageKey, label, icon: Icon, color }) => {
        const isActive = activeStage === stageKey && stageKey !== null;
        return (
          <Card
            key={key}
            onClick={() => handleClick(stageKey)}
            className={`cursor-pointer transition-all hover:shadow-md ${
              isActive ? 'ring-2 ring-offset-1' : ''
            }`}
            style={isActive ? { '--tw-ring-color': color } : undefined}
          >
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
        );
      })}
    </div>
  );
}
