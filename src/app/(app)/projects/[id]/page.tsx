'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User,
  MapPin,
  FileText,
  CheckSquare,
  Clock,
} from 'lucide-react';
import {
  ProjectWithManager,
  TaskWithRelations,
  PRIORITY_COLORS,
} from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const PROJECT_STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  active: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  paused: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  canceled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const STATUS_LABEL: Record<string, string> = {
  planning: 'Planejamento',
  active: 'Ativo',
  paused: 'Pausado',
  completed: 'Concluído',
  canceled: 'Cancelado',
};

const PRIORITY_LABEL: Record<string, string> = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  urgent: 'Urgente',
};

const TASK_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  validation: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  completed: 'bg-green-500/10 text-green-500 border-green-500/20',
  delayed: 'bg-red-500/10 text-red-500 border-red-500/20',
  canceled: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

const TASK_STATUS_LABEL: Record<string, string> = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  validation: 'Validação',
  completed: 'Concluída',
  delayed: 'Atrasada',
  canceled: 'Cancelada',
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [project, setProject] = useState<ProjectWithManager | null>(null);
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (params.id) loadProject();
  }, [params.id]);

  async function loadProject() {
    setLoading(true);
    const [projectRes, tasksRes] = await Promise.all([
      supabase
        .from('projects')
        .select('*, manager:users!manager_id(*), state:states(*)')
        .eq('id', params.id as string)
        .is('deleted_at', null)
        .single(),
      supabase
        .from('tasks')
        .select('*, project:projects(*), state:states(*), author:users!author_id(*), executor:users!executor_id(*)')
        .eq('project_id', params.id as string)
        .is('deleted_at', null)
        .order('created_at', { ascending: false }),
    ]);

    if (projectRes.data) setProject(projectRes.data as unknown as ProjectWithManager);
    if (tasksRes.data) setTasks(tasksRes.data as unknown as TaskWithRelations[]);
    setLoading(false);
  }

  async function handleDelete() {
    if (!project) return;
    setDeleting(true);
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', project.id);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      setDeleting(false);
      return;
    }

    toast({ title: 'Projeto excluído' });
    router.push('/projects');
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-10 w-2/3" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">Projeto não encontrado</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          O projeto que você procura não existe ou foi removido.
        </p>
        <Link href="/projects">
          <Button className="mt-4" variant="outline">Voltar para Projetos</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>
        <div className="flex gap-2">
          <Link href={`/projects/${project.id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit className="mr-1 h-4 w-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-1 h-4 w-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          <Badge
            className={
              PROJECT_STATUS_COLORS[project.status] || 'bg-gray-500/10 text-gray-500'
            }
          >
            {STATUS_LABEL[project.status] || project.status}
          </Badge>
          <Badge
            className={
              PRIORITY_COLORS[project.priority] || 'bg-gray-500/10 text-gray-500'
            }
          >
            {PRIORITY_LABEL[project.priority] || project.priority}
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium">
                {project.state
                  ? `${project.state.name} (${project.state.uf})`
                  : '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <User className="h-4 w-4" />
                Responsável
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium">
                {project.manager?.full_name || '—'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Prazo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium">
                {project.end_date
                  ? new Date(project.end_date).toLocaleDateString('pt-BR')
                  : 'Sem prazo definido'}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="h-4 w-4" />
              Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={project.progress_percent}>
              <ProgressLabel>Progresso Geral</ProgressLabel>
              <ProgressValue />
            </Progress>
          </CardContent>
        </Card>

        {project.description && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4" />
                Descrição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">{project.description}</p>
            </CardContent>
          </Card>
        )}

        {project.budget != null && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Orçamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-base font-medium">
                {new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                }).format(project.budget)}
              </p>
            </CardContent>
          </Card>
        )}

        {project.tags && project.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <CheckSquare className="h-5 w-5" />
          Relatório de Tarefas
        </h2>

        {tasks.length === 0 ? (
          <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <CheckSquare className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa neste projeto ainda.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {tasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <Card className="cursor-pointer transition-colors hover:border-primary/30">
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`h-2 w-2 shrink-0 rounded-full ${
                              task.status === 'completed'
                                ? 'bg-green-500'
                                : task.status === 'delayed'
                                  ? 'bg-red-500'
                                  : task.status === 'in_progress'
                                    ? 'bg-blue-500'
                                    : 'bg-yellow-500'
                            }`}
                          />
                          <p className="text-sm font-medium">{task.title}</p>
                          <Badge
                            className={
                              TASK_STATUS_COLORS[task.status] ||
                              'bg-gray-500/10 text-gray-500'
                            }
                          >
                            {TASK_STATUS_LABEL[task.status] || task.status}
                          </Badge>
                        </div>

                        {task.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(task.created_at).toLocaleDateString('pt-BR')}
                          </span>
                          {task.executor && (
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {task.executor.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href={`/tasks/new?project_id=${project.id}`}>
            <Button size="default">
              <CheckSquare className="mr-2 h-4 w-4" />
              Adicionar Tarefa
            </Button>
          </Link>
        </div>
      </div>

      <Dialog
        open={showDeleteDialog}
        onOpenChange={(open) => !open && setShowDeleteDialog(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir projeto</DialogTitle>
            <DialogDescription>
              Esta ação moverá o projeto para a lixeira. Você pode restaurá-lo
              depois, se necessário.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
