'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell, AlertCircle, CheckCircle, Info,
  Plus, User, Calendar, Loader2, Pencil,
} from 'lucide-react';
import { NotificationWithAuthor } from '@/types/database';
import { toast } from 'sonner';

const TYPE_ICONS: Record<string, typeof Bell> = {
  alert: AlertCircle,
  info: Info,
  default: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  alert: 'text-red-500 bg-red-500/10',
  info: 'text-blue-500 bg-blue-500/10',
  default: 'text-muted-foreground bg-muted',
};

const TYPE_LABELS: Record<string, string> = {
  alert: 'Alerta',
  info: 'Informativo',
  default: 'Geral',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<NotificationWithAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationWithAuthor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formType, setFormType] = useState('default');

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  async function loadNotifications() {
    setLoading(true);
    const { data } = await supabase
      .from('notifications')
      .select('*, author:users!author_id(full_name, email)')
      .order('created_at', { ascending: false });
    if (data) setNotifications(data as unknown as NotificationWithAuthor[]);
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingNotification(null);
    setFormTitle('');
    setFormMessage('');
    setFormType('default');
    setDialogOpen(true);
  }

  function openEditDialog(notification: NotificationWithAuthor) {
    setEditingNotification(notification);
    setFormTitle(notification.title);
    setFormMessage(notification.message ?? '');
    setFormType(notification.type);
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingNotification(null);
    setFormTitle('');
    setFormMessage('');
    setFormType('default');
  }

  async function handleSubmit() {
    if (!formTitle.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    setSubmitting(true);

    const payload = {
      title: formTitle.trim(),
      message: formMessage.trim() || null,
      type: formType,
    };

    if (editingNotification) {
      const { error: updateError } = await supabase
        .from('notifications')
        .update(payload)
        .eq('id', editingNotification.id);

      setSubmitting(false);

      if (updateError) {
        toast.error('Erro ao atualizar notificação', { description: updateError.message });
        return;
      }

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === editingNotification.id ? { ...n, ...payload } : n,
        ),
      );

      toast.success('Notificação atualizada com sucesso');
    } else {
      const { error: insertError, data: insertData } = await supabase
        .from('notifications')
        .insert({
          ...payload,
          author_id: user?.id,
          user_id: user?.id,
          is_read: false,
          sent_email: false,
        })
        .select('*');

      setSubmitting(false);

      if (insertError) {
        toast.error('Erro ao criar notificação', { description: insertError.message });
        return;
      }

      if (insertData && insertData[0]) {
        const created = insertData[0];
        setNotifications((prev) => [
          {
            ...created,
            author: user ? { full_name: user.full_name, email: user.email } : undefined,
          },
          ...prev,
        ]);
      }

      toast.success('Notificação criada com sucesso');
    }

    closeDialog();
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground">
            {notifications.length} {notifications.length === 1 ? 'notificação' : 'notificações'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
          <DialogTrigger render={<Button onClick={openCreateDialog} />}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Notificação
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingNotification ? 'Editar Notificação' : 'Nova Notificação'}</DialogTitle>
              <DialogDescription>
                {editingNotification
                  ? 'Altere os campos da notificação já publicada.'
                  : 'Crie uma notificação para todos os usuários do sistema.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Título da notificação"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select value={formType} onValueChange={(v) => v && setFormType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Geral</SelectItem>
                    <SelectItem value="info">Informativo</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Conteúdo</Label>
                <Textarea
                  id="message"
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Escreva o conteúdo da notificação..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Bell className="mr-2 h-4 w-4" />
                )}
                {editingNotification ? 'Salvar' : 'Publicar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Bell className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">Nenhuma notificação</p>
              <p className="text-sm text-muted-foreground">
                Nenhuma notificação foi publicada ainda.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n, i) => {
                const Icon = TYPE_ICONS[n.type] || TYPE_ICONS.default;
                const colorClass = TYPE_COLORS[n.type] || TYPE_COLORS.default;
                return (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-4 p-4"
                  >
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">{n.title}</p>
                          {n.message && (
                            <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                              {n.message}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(n)}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Editar
                          </Button>
                          <Badge variant="outline">
                            {TYPE_LABELS[n.type] || 'Geral'}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {n.author && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {n.author.full_name}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(n.created_at), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
