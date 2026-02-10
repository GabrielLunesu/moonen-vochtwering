import Sidebar from '@/app/components/dashboard/Sidebar';

export const metadata = {
  title: 'CRM | Moonen Vochtwering',
};

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-muted/40">
      <Sidebar />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
    </div>
  );
}
