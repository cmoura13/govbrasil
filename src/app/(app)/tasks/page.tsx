'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Search, User, Calendar, Trash2 } from 'lucide-react';
import { TaskWithRelations, State, PRIORITY_COLORS, STATUS_COLORS } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

const priorityLabels: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente', in_progress: 'Em Execução', validation: 'Validação',
  completed: 'Concluído', delayed: 'Atrasado', canceled: 'Cancelado',
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [stateFilter, setStateFilter] = useState('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchTasks();
    fetchStates();
  }, []);

  async function fetchTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(*), state:states(*), author:users!tasks_author_id_fkey(*), executor:users!tasks_executor_id_fkey(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (data) setTasks(data as unknown as TaskWithRelations[]);
    setLoading(false);
  }

  async function fetchStates() {
    const { data } = await supabase
      .from('states')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) setStates(data);
  }

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = search === '' ||
      task.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesState = stateFilter === 'all' || task.state_id === stateFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesState;
  });

  async function confirmDelete() {
    if (!deletingId) return;
    setDeleting(true);
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deletingId);

    if (error) {
      toast.error('Erro ao excluir tarefa');
    } else {
      setTasks((prev) => prev.filter((t) => t.id !== deletingId));
      toast.success('Tarefa excluída');
    }
    setDeleting(false);
    setDeleteDialogOpen(false);
    setDeletingId(null);
  }

  function openDeleteDialog(id: string) {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tarefas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gerencie as tarefas dos projetos</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="size-4" />
            Nova Tarefa
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="in_progress">Em Execução</SelectItem>
            <SelectItem value="validation">Validação</SelectItem>
            <SelectItem value="completed">Concluído</SelectItem>
            <SelectItem value="delayed">Atrasado</SelectItem>
            <SelectItem value="canceled">Cancelado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => v && setPriorityFilter(v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
            <SelectItem value="medium">Média</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <Select value={stateFilter} onValueChange={(v) => v && setStateFilter(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado">
              {(value: string | null) => {
                if (!value || value === 'all') return null;
                const found = states.find(s => s.id === value);
                return found ? found.name : value;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {states.map((state) => (
              <SelectItem key={state.id} value={state.id}>{state.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredTasks.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhuma tarefa encontrada</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {search || statusFilter !== 'all' || priorityFilter !== 'all' || stateFilter !== 'all'
              ? 'Tente ajustar os filtros'
              : 'Crie sua primeira tarefa'}
          </p>
          {!search && statusFilter === 'all' && priorityFilter === 'all' && stateFilter === 'all' && (
            <Link href="/tasks/new">
              <Button>
                <Plus className="size-4" />
                Criar Tarefa
              </Button>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card size="sm" className="group">
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="font-medium hover:text-primary truncate"
                      >
                        {task.title}
                      </Link>
                      <Badge className={PRIORITY_COLORS[task.priority]}>
                        {priorityLabels[task.priority]}
                      </Badge>
                      <Badge className={STATUS_COLORS[task.status]}>
                        {statusLabels[task.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {task.project && (
                        <span>{task.project.name}</span>
                      )}
                      {task.executor && (
                        <span className="flex items-center gap-1">
                          <User className="size-3" />
                          {task.executor.full_name}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          {format(new Date(task.due_date), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => openDeleteDialog(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Link
        href="/tasks/new"
        className="fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Plus className="size-6" />
      </Link>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir tarefa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
