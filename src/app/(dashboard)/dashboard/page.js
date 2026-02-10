import KanbanBoard from '@/app/components/dashboard/KanbanBoard';

export const metadata = {
  title: 'Pipeline | Moonen CRM',
};

export default function DashboardPage() {
  return (
    <div>
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-bold">Pipeline</h1>
        <p className="text-sm text-muted-foreground">
          Overzicht van alle leads en hun status
        </p>
      </div>
      <KanbanBoard />
    </div>
  );
}
