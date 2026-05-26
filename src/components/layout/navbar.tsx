'use client';

import { Menu, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/theme-context';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { HelpDialog } from '@/components/layout/help-dialog';

interface NavbarProps {
  onMenuClick: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const { effectiveTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-4">
      <Button variant="ghost" size="icon" className="lg:hidden rounded-lg" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>

      <Link href="/projects" className="flex items-center gap-2 font-bold text-lg hover:text-primary transition-colors">
        GovBrasil
      </Link>

      <div className="flex-1" />

      <HelpDialog />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-lg"
        onClick={() => setTheme(effectiveTheme === 'dark' ? 'light' : 'dark')}
        title="Alternar tema"
      >
        {effectiveTheme === 'dark' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </Button>

      <Button variant="ghost" className="rounded-lg gap-2" onClick={handleSignOut}>
        <LogOut className="h-5 w-5" />
        <span className="hidden sm:inline">Sair</span>
      </Button>
    </header>
  );
}
