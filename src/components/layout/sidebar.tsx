'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FolderKanban,
  CheckSquare,
  CalendarDays,
  BarChart3,
  Users,
  Settings,
  BookOpen,
  ChevronLeft,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';

const menuItems = [
  { href: '/projects', label: 'Projetos', icon: FolderKanban },
  { href: '/tasks', label: 'Tarefas', icon: CheckSquare },
  { href: '/agendamentos', label: 'Agendamentos', icon: CalendarDays },
  { href: '/reports', label: 'Relatórios', icon: BarChart3 },
  { href: '/repositorio', label: 'Repositório', icon: BookOpen },
];

const bottomItems = [
  { href: '/users', label: 'Usuários', icon: Users, adminOnly: true },
  { href: '/settings', label: 'Configurações', icon: Settings },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-200 lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <Building2 className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">GovBrasil</span>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-8 w-8 lg:hidden"
            onClick={onClose}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-4">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {user?.role === 'super_admin' && (
            <>
              <Separator className="my-4" />
              <nav className="space-y-1">
                {bottomItems
                  .filter((i) => !i.adminOnly || user?.role === 'super_admin')
                  .map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
              </nav>
            </>
          )}
        </ScrollArea>

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user?.full_name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.role === 'super_admin'
                  ? 'Administrador Geral'
                  : user?.role === 'state_admin'
                    ? 'Admin. Estadual'
                    : user?.role === 'executor'
                      ? 'Executor'
                      : 'Visualizador'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
