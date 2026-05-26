'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { ProjectStatus, PriorityLevel, State, User as AppUser } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const projectSchema = z.object({
  name: z.string().min(3, 'Mínimo de 3 caracteres').max(200, 'Máximo de 200 caracteres'),
  state_id: z.string().min(1, 'Selecione um estado'),
  description: z.string().max(2000).optional().or(z.literal('')),
  manager_id: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['planning', 'active', 'paused', 'completed', 'canceled']),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional().or(z.literal('')),
  tags: z.string().optional().or(z.literal('')),
});

type ProjectFormData = z.infer<typeof projectSchema>;

const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planejamento' },
  { value: 'active', label: 'Ativo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Concluído' },
  { value: 'canceled', label: 'Cancelado' },
];

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string }[] = [
  { value: 'low', label: 'Baixa' },
  { value: 'medium', label: 'Média' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
];

export default function NewProjectPage() {
  const [states, setStates] = useState<State[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      state_id: '',
      description: '',
      manager_id: '',
      priority: 'medium',
      status: 'planning',
      start_date: '',
      end_date: '',
      budget: '' as any,
      tags: '',
    },
  });

  useEffect(() => {
    async function load() {
      const [statesRes, usersRes] = await Promise.all([
        supabase.from('states').select('*').eq('is_active', true).order('name'),
        supabase
          .from('users')
          .select('*')
          .eq('is_active', true)
          .order('full_name'),
      ]);
      if (statesRes.data) setStates(statesRes.data as State[]);
      if (usersRes.data) setUsers(usersRes.data as AppUser[]);
    }
    load();
  }, []);

  async function onSubmit(data: ProjectFormData) {
    setSubmitting(true);

    const tags = data.tags
      ? data.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const { error } = await supabase.from('projects').insert({
      name: data.name,
      state_id: data.state_id,
      description: data.description || null,
      manager_id: data.manager_id || null,
      priority: data.priority,
      status: data.status,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget ? Number(data.budget) : null,
      tags,
      created_by: currentUser?.id || null,
    });

    if (error) {
      toast({
        title: 'Erro ao criar projeto',
        description: error.message,
        variant: 'destructive',
      });
      setSubmitting(false);
      return;
    }

    toast({ title: 'Projeto criado com sucesso' });
    router.push('/projects');
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <a href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </a>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Novo Projeto</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input id="name" {...register('name')} />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state_id">Estado</Label>
              <Controller
                control={control}
                name="state_id"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um estado">
                        {(value: string | null) => {
                          if (!value) return null;
                          const found = states.find(s => s.id === value);
                          return found ? `${found.name} (${found.uf})` : value;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {states.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.uf})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.state_id && (
                <p className="text-xs text-destructive">
                  {errors.state_id.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                rows={4}
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="manager_id">Responsável</Label>
                <Controller
                  control={control}
                  name="manager_id"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.full_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Controller
                  control={control}
                  name="priority"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITY_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="start_date">Data de Início</Label>
                <Input id="start_date" type="date" {...register('start_date')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">Data de Término</Label>
                <Input id="end_date" type="date" {...register('end_date')} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Orçamento (R$)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
                placeholder="0,00"
                {...register('budget')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="ex: educação, infraestrutura (separadas por vírgula)"
                {...register('tags')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting}>
                <Save className="mr-1 h-4 w-4" />
                {submitting ? 'Salvando...' : 'Salvar Projeto'}
              </Button>
              <a href="/projects">
                <Button variant="outline" type="button">Cancelar</Button>
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
