'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  ArrowLeft, Edit, Trash2, Calendar, User,
  MapPin, MessageSquare, Clock, Send
} from 'lucide-react';
import { TaskWithRelations, TaskComment, PRIORITY_COLORS, STATUS_COLORS } from '@/types/database';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import Link from 'next/link';

const priorityLabels: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendente', in_progress: 'Em Execução', validation: 'Validação',
  completed: 'Concluído', delayed: 'Atrasado', canceled: 'Cancelado',
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();

  const [task, setTask] = useState<TaskWithRelations | null>(null);
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const taskId = params.id as string;

  useEffect(() => {
    if (taskId) {
      fetchTask();
      fetchComments();
    }
  }, [taskId]);

  async function fetchTask() {
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(*), state:states(*), author:users!tasks_author_id_fkey(*), executor:users!tasks_executor_id_fkey(*), reviewer:users!tasks_reviewer_id_fkey(*)')
      .eq('id', taskId)
      .is('deleted_at', null)
      .single();

    if (data) setTask(data as unknown as TaskWithRelations);
    setLoading(false);
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
  }

  async function handleStatusChange(newStatus: string | null) {
    if (!newStatus) return;
    setUpdatingStatus(true);
    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', taskId);

    if (error) {
      toast.error('Erro ao atualizar status');
    } else {
      setTask((prev) => prev ? { ...prev, status: newStatus as any } : prev);
      toast.success('Status atualizado');
    }
    setUpdatingStatus(false);
  }

  async function handleAddComment() {
    if (!newComment.trim() || !user) return;
    setSendingComment(true);

    const { data, error } = await supabase
      .from('task_comments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        comment: newComment.trim(),
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao enviar comentário');
    } else {
      setComments((prev) => [...prev, data as TaskComment]);
      setNewComment('');
    }
    setSendingComment(false);
  }

  async function handleDelete() {
    setDeleting(true);
    const { error } = await supabase
      .from('tasks')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', taskId);

    if (error) {
      toast.error('Erro ao excluir tarefa');
    } else {
      toast.success('Tarefa excluída');
      router.push('/tasks');
    }
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-lg font-medium">Tarefa não encontrada</p>
        <Link href="/tasks">
          <Button variant="outline" className="mt-4">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/tasks">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold truncate">{task.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/tasks/${task.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="size-4" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="size-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className={PRIORITY_COLORS[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
                <Badge className={STATUS_COLORS[task.status]}>
                  {statusLabels[task.status]}
                </Badge>
              </div>

              {task.description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="text-sm whitespace-pre-wrap">{task.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {task.project && (
                  <div>
                    <p className="text-muted-foreground">Projeto</p>
                    <p className="font-medium">{task.project.name}</p>
                  </div>
                )}
                {task.state && (
                  <div>
                    <p className="text-muted-foreground">Estado</p>
                    <p className="font-medium">{task.state.name}</p>
                  </div>
                )}
                {task.executor && (
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Executor</p>
                      <p className="font-medium">{task.executor.full_name}</p>
                    </div>
                  </div>
                )}
                {task.author && (
                  <div className="flex items-center gap-2">
                    <User className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Autor</p>
                      <p className="font-medium">{task.author.full_name}</p>
                    </div>
                  </div>
                )}
                {task.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Vencimento</p>
                      <p className="font-medium">
                        {format(new Date(task.due_date), "dd 'de' MMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                )}
                {task.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Local</p>
                      <p className="font-medium">{task.location}</p>
                    </div>
                  </div>
                )}
                {task.estimated_hours != null && (
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Horas Estimadas</p>
                      <p className="font-medium">{task.estimated_hours}h</p>
                    </div>
                  </div>
                )}
              </div>

              {task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {task.requires_validation && (
                <div className="flex items-center gap-2 text-sm text-amber-500">
                  <span className="size-2 rounded-full bg-amber-500" />
                  Requer validação
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="size-4" />
                Comentários
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {comments.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nenhum comentário ainda
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                      <p className="text-sm">{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="flex gap-2">
                <Textarea
                  placeholder="Adicionar comentário..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || sendingComment}
                  className="self-end"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={task.status}
                onValueChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="in_progress">Em Execução</SelectItem>
                  <SelectItem value="validation">Validação</SelectItem>
                  <SelectItem value="completed">Concluído</SelectItem>
                  <SelectItem value="delayed">Atrasado</SelectItem>
                  <SelectItem value="canceled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="size-4" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {task.created_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-2 rounded-full bg-primary" />
                      <div className="flex-1 w-px bg-border" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-sm">Tarefa criada</p>
                    </div>
                  </div>
                )}
                {task.updated_at !== task.created_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-2 rounded-full bg-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-sm">Última atualização</p>
                    </div>
                  </div>
                )}
                {task.completed_at && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="size-2 rounded-full bg-green-500" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(task.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                      <p className="text-sm">Tarefa concluída</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

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
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
