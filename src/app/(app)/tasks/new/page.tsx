'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { Project, State, User } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  project_id: z.string().min(1, 'Projeto é obrigatório'),
  state_id: z.string().min(1, 'Estado é obrigatório'),
  description: z.string().optional(),
  executor_id: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'validation', 'completed', 'delayed', 'canceled']),
  due_date: z.string().optional(),
  estimated_hours: z.coerce.number().min(0).optional(),
  location: z.string().optional(),
  requires_validation: z.boolean(),
  tags: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export default function NewTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const supabase = createClient();

  const [projects, setProjects] = useState<Project[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      priority: 'medium',
      status: 'pending',
      requires_validation: true,
      state_id: '',
      project_id: '',
    },
  });

  const selectedStateId = watch('state_id');
  const preselectedProjectId = searchParams.get('project_id');
  const preselectedStateId = searchParams.get('state_id');

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchStates(), fetchUsers()]);

      if (preselectedProjectId && preselectedStateId) {
        setValue('state_id', preselectedStateId);
        setValue('project_id', preselectedProjectId);
        await fetchProjects(preselectedStateId, preselectedProjectId);
      } else if (preselectedStateId) {
        setValue('state_id', preselectedStateId);
        await fetchProjects(preselectedStateId);
      } else if (preselectedProjectId) {
        const { data: project } = await supabase
          .from('projects')
          .select('id, state_id')
          .eq('id', preselectedProjectId)
          .single();

        if (project) {
          setValue('state_id', project.state_id);
          setValue('project_id', project.id);
          await fetchProjects(project.state_id, project.id);
        }
      } else {
        setValue('state_id', user?.state_id || '');
      }

      setInitialLoading(false);
    };

    init();
  }, []);

  useEffect(() => {
    if (selectedStateId && !initialLoading) {
      fetchProjects(selectedStateId);
    } else if (!selectedStateId && !initialLoading) {
      setProjects([]);
    }
  }, [selectedStateId]);

  async function fetchProjects(stateId: string, preselectedId?: string) {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('state_id', stateId)
      .is('deleted_at', null)
      .order('name');

    if (!preselectedId && !preselectedProjectId) {
      query = query.eq('is_archived', false);
    }

    const { data } = await query;
    if (data) setProjects(data as unknown as Project[]);
  }

  async function fetchStates() {
    const { data } = await supabase
      .from('states')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (data) setStates(data);
  }

  async function fetchUsers() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('full_name');

    if (data) setUsers(data);
  }

  async function onSubmit(data: TaskFormData) {
    setSubmitting(true);

    const tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const { error } = await supabase.from('tasks').insert({
      title: data.title,
      project_id: data.project_id,
      state_id: data.state_id,
      description: data.description || null,
      executor_id: data.executor_id || null,
      priority: data.priority,
      status: data.status,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours || null,
      location: data.location || null,
      requires_validation: data.requires_validation,
      tags,
      author_id: user?.id,
      created_by: user?.id,
    });

    setSubmitting(false);

    if (error) {
      toast.error('Erro ao criar tarefa', { description: error.message });
    } else {
      toast.success('Tarefa criada com sucesso');
      router.push('/tasks');
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        {preselectedProjectId ? (
          <Link href={`/projects/${preselectedProjectId}`}>
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
        ) : (
          <Link href="/tasks">
            <Button variant="ghost" size="icon-sm">
              <ArrowLeft className="size-4" />
            </Button>
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight">Nova Tarefa</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register('description')} rows={4} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Controller
                  name="state_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o estado">
                          {(value: string | null) => {
                            if (!value) return null;
                            const found = states.find(s => s.id === value);
                            return found ? `${found.name} (${found.uf})` : value;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.state_id && <p className="text-xs text-destructive">{errors.state_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>Projeto *</Label>
                <Controller
                  name="project_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={field.onChange} disabled={!selectedStateId}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={selectedStateId ? 'Selecione o projeto' : 'Selecione um estado primeiro'}>
                          {(value: string | null) => {
                            if (!value) return null;
                            const found = projects.find(p => p.id === value);
                            return found ? found.name : value;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.project_id && <p className="text-xs text-destructive">{errors.project_id.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Executor</Label>
                <Controller
                  name="executor_id"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || null)}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o executor" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Baixa</SelectItem>
                        <SelectItem value="medium">Média</SelectItem>
                        <SelectItem value="high">Alta</SelectItem>
                        <SelectItem value="urgent">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status *</Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
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
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="due_date">Data de Vencimento</Label>
                <Input id="due_date" type="date" {...register('due_date')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_hours">Horas Estimadas</Label>
                <Input id="estimated_hours" type="number" min="0" step="0.5" {...register('estimated_hours')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Localização</Label>
                <Input id="location" {...register('location')} placeholder="Ex: Sala 301" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input id="tags" {...register('tags')} placeholder="tag1, tag2, tag3" />
              <p className="text-xs text-muted-foreground">Separe as tags por vírgula</p>
            </div>

            <div className="flex items-center gap-2">
              <Controller
                name="requires_validation"
                control={control}
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Requer validação</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          {preselectedProjectId ? (
            <Link href={`/projects/${preselectedProjectId}`}>
              <Button variant="outline">Cancelar</Button>
            </Link>
          ) : (
            <Link href="/tasks">
              <Button variant="outline">Cancelar</Button>
            </Link>
          )}
          <Button type="submit" disabled={submitting}>
            <Save className="size-4" />
            {submitting ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </form>
    </div>
  );
}
