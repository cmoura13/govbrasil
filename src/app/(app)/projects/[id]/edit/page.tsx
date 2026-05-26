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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ProjectStatus, PriorityLevel } from '@/types/database';

const projectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  state_id: z.string().min(1, 'Estado é obrigatório'),
  manager_id: z.string().optional(),
  priority: z.string().min(1),
  status: z.string().min(1),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.string().optional(),
  tags: z.string().optional(),
});

type ProjectForm = z.infer<typeof projectSchema>;

export default function EditProjectPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [states, setStates] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProjectForm>({
    resolver: zodResolver(projectSchema),
  });

  useEffect(() => {
    const load = async () => {
      const [statesRes, managersRes, projectRes] = await Promise.all([
        supabase.from('states').select('*').eq('is_active', true),
        supabase.from('users').select('id, full_name').in('role', ['super_admin', 'state_admin']),
        supabase.from('projects').select('*').eq('id', params.id).single(),
      ]);
      if (statesRes.data) setStates(statesRes.data);
      if (managersRes.data) setManagers(managersRes.data);
      if (projectRes.data) {
        const p = projectRes.data;
        setValue('name', p.name);
        setValue('description', p.description || '');
        setValue('state_id', p.state_id);
        setValue('manager_id', p.manager_id || '');
        setValue('priority', p.priority);
        setValue('status', p.status);
        setValue('start_date', p.start_date ? p.start_date.split('T')[0] : '');
        setValue('end_date', p.end_date ? p.end_date.split('T')[0] : '');
        setValue('budget', p.budget ? String(p.budget) : '');
        setValue('tags', p.tags?.join(', ') || '');
      }
      setLoading(false);
    };
    load();
  }, [params.id]);

  const onSubmit = async (data: ProjectForm) => {
    setSaving(true);
    const { error } = await supabase.from('projects').update({
      name: data.name,
      description: data.description || null,
      state_id: data.state_id,
      manager_id: data.manager_id || null,
      priority: data.priority as PriorityLevel,
      status: data.status as ProjectStatus,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget ? Number(data.budget) : null,
      tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
    }).eq('id', params.id);

    if (error) {
      toast.error('Erro ao atualizar projeto');
    } else {
      toast.success('Projeto atualizado com sucesso');
      router.push('/projects');
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Editar Projeto</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Informações do Projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input id="name" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
                      <SelectItem key={s.id} value={s.id}>{s.name} ({s.uf})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Responsável</Label>
                <Select onValueChange={(v) => setValue('manager_id', v ?? '')} value={watch('manager_id')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione">
                      {(value: string | null) => {
                        if (!value) return 'Sem responsável';
                        const found = managers.find(m => m.id === value);
                        return found ? found.full_name : value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem responsável</SelectItem>
                    {managers.map((m) => (
                      <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="space-y-2">
                <Label>Status</Label>
                <Select onValueChange={(v) => v && setValue('status', v)} value={watch('status')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planejamento</SelectItem>
                    <SelectItem value="active">Em Andamento</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="completed">Finalizado</SelectItem>
                    <SelectItem value="canceled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input type="date" {...register('start_date')} />
              </div>
              <div className="space-y-2">
                <Label>Prazo Final</Label>
                <Input type="date" {...register('end_date')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Orçamento (R$)</Label>
                <Input type="number" step="0.01" {...register('budget')} />
              </div>
              <div className="space-y-2">
                <Label>Tags (separadas por vírgula)</Label>
                <Input placeholder="ex: infraestrutura, educação" {...register('tags')} />
              </div>
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
