'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/app/components/ui/sheet';
import { Separator } from '@/app/components/ui/separator';
import { LayoutDashboard, CalendarDays, Settings, LogOut, Menu, Droplets } from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Pipeline', icon: LayoutDashboard },
  { href: '/dashboard/planning', label: 'Planning', icon: CalendarDays },
  { href: '/dashboard/instellingen', label: 'Instellingen', icon: Settings },
];

function NavContent({ pathname, onLogout }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-5">
        <Droplets className="h-6 w-6" style={{ color: '#355b23' }} />
        <span className="font-bold text-lg">Moonen CRM</span>
      </div>
      <Separator />
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === '/dashboard'
            ? pathname === '/dashboard'
            : pathname.startsWith(item.href);
          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              style={isActive ? { backgroundColor: '#355b23' } : undefined}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </a>
          );
        })}
      </nav>
      <Separator />
      <div className="px-3 py-4">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          Uitloggen
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile sidebar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center gap-2 border-b bg-background px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavContent pathname={pathname} onLogout={handleLogout} />
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Droplets className="h-5 w-5" style={{ color: '#355b23' }} />
          <span className="font-semibold">Moonen CRM</span>
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r lg:bg-sidebar lg:fixed lg:inset-y-0">
        <NavContent pathname={pathname} onLogout={handleLogout} />
      </aside>
    </>
  );
}
