'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PriorityLevel, TaskStatus } from '@/types/database';

const taskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  project_id: z.string().min(1, 'Projeto é obrigatório'),
  state_id: z.string().min(1, 'Estado é obrigatório'),
  executor_id: z.string().optional(),
  priority: z.string().min(1),
  status: z.string().min(1),
  due_date: z.string().optional(),
  estimated_hours: z.string().optional(),
  location: z.string().optional(),
  requires_validation: z.boolean().optional(),
  tags: z.string().optional(),
});

type TaskForm = z.infer<typeof taskSchema>;

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [executors, setExecutors] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<TaskForm>({
    resolver: zodResolver(taskSchema),
  });

  useEffect(() => {
    const load = async () => {
      const [statesRes, projectsRes, executorsRes, taskRes] = await Promise.all([
        supabase.from('states').select('*').eq('is_active', true),
        supabase.from('projects').select('*').not('status', 'in', '("completed","canceled")'),
        supabase.from('users').select('id, full_name').in('role', ['state_admin', 'executor']),
        supabase.from('tasks').select('*').eq('id', params.id).single(),
      ]);
      if (statesRes.data) setStates(statesRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (executorsRes.data) setExecutors(executorsRes.data);
      if (taskRes.data) {
        const t = taskRes.data;
        setValue('title', t.title);
        setValue('description', t.description || '');
        setValue('project_id', t.project_id);
        setValue('state_id', t.state_id);
        setValue('executor_id', t.executor_id || '');
        setValue('priority', t.priority);
        setValue('status', t.status);
        setValue('due_date', t.due_date ? t.due_date.split('T')[0] : '');
        setValue('estimated_hours', t.estimated_hours ? String(t.estimated_hours) : '');
        setValue('location', t.location || '');
        setValue('requires_validation', t.requires_validation || false);
        setValue('tags', t.tags?.join(', ') || '');
      }
      setLoading(false);
    };
    load();
  }, [params.id]);

  const onSubmit = async (data: TaskForm) => {
    setSaving(true);
    const { error } = await supabase.from('tasks').update({
      title: data.title,
      description: data.description || null,
      project_id: data.project_id,
      state_id: data.state_id,
      executor_id: data.executor_id || null,
      priority: data.priority as PriorityLevel,
      status: data.status as TaskStatus,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours ? Number(data.estimated_hours) : null,
      location: data.location || null,
      requires_validation: data.requires_validation || false,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
    }).eq('id', params.id);

    if (error) {
      toast.error('Erro ao atualizar tarefa');
    } else {
      toast.success('Tarefa atualizada com sucesso');
      router.push('/tasks');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[500px] w-full" />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Editar Tarefa</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Tarefa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register('description')} rows={3} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select onValueChange={(v) => v && setValue('state_id', v)} value={watch('state_id')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
                      {(value: string | null) => {
                        if (!value) return null;
                        const found = states.find(s => s.id === value);
                        return found ? `${found.name} (${found.uf})` : value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.uf})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Projeto</Label>
                <Select onValueChange={(v) => v && setValue('project_id', v)} value={watch('project_id')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Executor</Label>
                <Select onValueChange={(v) => setValue('executor_id', v ?? '')} value={watch('executor_id')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
                      {(value: string | null) => {
                        if (!value) return 'Sem executor';
                        const found = executors.find(e => e.id === value);
                        return found ? found.full_name : value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem executor</SelectItem>
                    {executors.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select onValueChange={(v) => v && setValue('priority', v)} value={watch('priority')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(v) => v && setValue('status', v)} value={watch('status')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Execução</SelectItem>
                    <SelectItem value="validation">Aguardando Validação</SelectItem>
                    <SelectItem value="completed">Executada</SelectItem>
                    <SelectItem value="delayed">Atrasada</SelectItem>
                    <SelectItem value="canceled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Prazo</Label>
                <Input type="date" {...register('due_date')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Horas Estimadas</Label>
                <Input type="number" {...register('estimated_hours')} />
              </div>
              <div className="space-y-2">
                <Label>Local</Label>
                <Input {...register('location')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (separadas por vírgula)</Label>
              <Input placeholder="ex: urgente, infraestrutura" {...register('tags')} />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={watch('requires_validation')}
                onCheckedChange={(v) => setValue('requires_validation', v)}
              />
              <Label>Requer validação</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
