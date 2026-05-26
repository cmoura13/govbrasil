'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CalendarDays, Plus, Pencil, Trash2, Clock, Loader2,
} from 'lucide-react';
import { Agendamento } from '@/types/database';
import { toast } from 'sonner';

export default function AgendamentosPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Agendamento | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('');

  useEffect(() => {
    if (user) loadAgendamentos();
  }, [user]);

  async function loadAgendamentos() {
    setLoading(true);
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .is('deleted_at', null)
      .order('scheduled_date', { ascending: false });
    if (error) {
      console.error('Erro ao carregar agendamentos:', error.message);
      toast.error('Erro ao carregar agendamentos');
    } else if (data) {
      setAgendamentos(data as Agendamento[]);
    }
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingItem(null);
    setFormTitle('');
    setFormDate(new Date().toISOString().slice(0, 16));
    setDialogOpen(true);
  }

  function openEditDialog(item: Agendamento) {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDate(item.scheduled_date.slice(0, 16));
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingItem(null);
    setFormTitle('');
    setFormDate('');
  }

  async function handleSubmit() {
    if (!formTitle.trim()) {
      toast.error('O título é obrigatório');
      return;
    }
    setSubmitting(true);

    const payload = {
      title: formTitle.trim(),
      scheduled_date: new Date(formDate).toISOString(),
    };

    if (editingItem) {
      const { error } = await supabase
        .from('agendamentos')
        .update(payload)
        .eq('id', editingItem.id);

      setSubmitting(false);

      if (error) {
        toast.error('Erro ao atualizar agendamento', { description: error.message });
        return;
      }

      toast.success('Agendamento atualizado com sucesso');
      loadAgendamentos();
    } else {
      const { error } = await supabase
        .from('agendamentos')
        .insert({
          ...payload,
          created_by: user?.id,
        });

      setSubmitting(false);

      if (error) {
        toast.error('Erro ao criar agendamento', { description: error.message });
        return;
      }

      toast.success('Agendamento criado com sucesso');
      loadAgendamentos();
    }

    closeDialog();
  }

  async function confirmDelete() {
    if (!deletingId) return;

    const { error } = await supabase
      .from('agendamentos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deletingId);

    if (error) {
      toast.error('Erro ao excluir agendamento', { description: error.message });
      return;
    }

    setAgendamentos((prev) => prev.filter((a) => a.id !== deletingId));
    setDeleteDialogOpen(false);
    setDeletingId(null);
    toast.success('Agendamento excluído com sucesso');
  }

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
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
          <h1 className="text-2xl font-bold tracking-tight">Agendamentos</h1>
          <p className="text-sm text-muted-foreground">
            {agendamentos.length} {agendamentos.length === 1 ? 'agendamento' : 'agendamentos'}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
          <DialogTrigger render={<Button onClick={openCreateDialog} />}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Agendamento
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
              <DialogDescription>
                {editingItem
                  ? 'Altere os dados do agendamento.'
                  : 'Registre um novo agendamento de reunião.'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="Descrição do agendamento"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data e Hora</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
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
                  <CalendarDays className="mr-2 h-4 w-4" />
                )}
                {editingItem ? 'Salvar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {agendamentos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <CalendarDays className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-lg font-medium">Nenhum agendamento</p>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro agendamento de reunião.
            </p>
            <Button className="mt-4" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Agendamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {agendamentos.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <CalendarDays className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{item.title}</p>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.scheduled_date), "dd 'de' MMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => { setDeletingId(item.id); setDeleteDialogOpen(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteDialogOpen(false); setDeletingId(null); }}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
