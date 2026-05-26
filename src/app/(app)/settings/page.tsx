'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useTheme } from '@/contexts/theme-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Moon, Sun, Monitor, User, Shield,
  Bell, Lock, Save,
} from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { theme, setTheme } = useTheme();
  const supabase = createClient();

  const [passwords, setPasswords] = useState({ current: '', newPassword: '', confirm: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const [notifications, setNotifications] = useState({
    emailTasks: true,
    emailReports: true,
    browserTasks: true,
    browserUpdates: false,
  });

  async function handlePasswordChange() {
    if (!passwords.current || !passwords.newPassword || !passwords.confirm) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (passwords.newPassword !== passwords.confirm) {
      toast.error('As senhas não conferem');
      return;
    }
    if (passwords.newPassword.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.newPassword,
      });
      if (error) throw error;
      toast.success('Senha alterada com sucesso');
      setPasswords({ current: '', newPassword: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao alterar senha');
    } finally {
      setSavingPassword(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize sua experiência na plataforma</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Aparência</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              <Sun className="mr-1 h-4 w-4" />
              Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              <Moon className="mr-1 h-4 w-4" />
              Escuro
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
            >
              <Monitor className="mr-1 h-4 w-4" />
              Sistema
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Perfil</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Nome</Label>
              <p className="text-sm font-medium">{user?.full_name || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">E-mail</Label>
              <p className="text-sm font-medium">{user?.email || '-'}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Função</Label>
              <div className="flex items-center gap-1 text-sm font-medium">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                {user?.role === 'super_admin' ? 'Super Admin' :
                 user?.role === 'state_admin' ? 'Admin Estadual' :
                 user?.role === 'executor' ? 'Executor' : 'Visualizador'}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Telefone</Label>
              <p className="text-sm font-medium">{user?.phone || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Alterar Senha</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Senha Atual</Label>
            <Input
              type="password"
              value={passwords.current}
              onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
              placeholder="••••••••"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label>Confirmar Nova Senha</Label>
              <Input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="••••••••"
              />
            </div>
          </div>
          <Button onClick={handlePasswordChange} disabled={savingPassword}>
            <Save className="mr-1 h-4 w-4" />
            {savingPassword ? 'Salvando...' : 'Alterar Senha'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notificações</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações por E-mail</Label>
              <p className="text-xs text-muted-foreground">Receba atualizações das tarefas por e-mail</p>
            </div>
            <Switch
              checked={notifications.emailTasks}
              onCheckedChange={(v) => setNotifications({ ...notifications, emailTasks: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Relatórios por E-mail</Label>
              <p className="text-xs text-muted-foreground">Receba relatórios periódicos por e-mail</p>
            </div>
            <Switch
              checked={notifications.emailReports}
              onCheckedChange={(v) => setNotifications({ ...notifications, emailReports: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Notificações no Navegador</Label>
              <p className="text-xs text-muted-foreground">Alertas de tarefas no navegador</p>
            </div>
            <Switch
              checked={notifications.browserTasks}
              onCheckedChange={(v) => setNotifications({ ...notifications, browserTasks: v })}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <Label>Atualizações do Sistema</Label>
              <p className="text-xs text-muted-foreground">Novidades e atualizações da plataforma</p>
            </div>
            <Switch
              checked={notifications.browserUpdates}
              onCheckedChange={(v) => setNotifications({ ...notifications, browserUpdates: v })}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Palette({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="13.5" cy="6.5" r="0.5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="0.5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r="0.5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
