'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  FileText, Download, FileSpreadsheet, FileDown,
  BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { STATES_BR } from '@/types/database';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const reportTabs = [
  { value: 'executed', label: 'Tarefas Executadas' },
  { value: 'delayed', label: 'Tarefas Atrasadas' },
  { value: 'productivity', label: 'Produtividade' },
  { value: 'team', label: 'Por Equipe' },
  { value: 'state', label: 'Por Estado' },
  { value: 'managerial', label: 'Gerencial' },
];

const summaryCards = [
  { title: 'Total de Tarefas', value: '', icon: FileText, color: 'text-blue-500' },
  { title: 'Concluídas', value: '', icon: CheckCircle2, color: 'text-green-500' },
  { title: 'Em Atraso', value: '', icon: AlertTriangle, color: 'text-red-500' },
  { title: 'Produtividade', value: '', icon: TrendingUp, color: 'text-purple-500' },
];

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [filters, setFilters] = useState({
    state: '',
    project: '',
    executor: '',
    priority: '',
    status: '',
    dateFrom: '',
    dateTo: '',
  });

  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, [filters]);

  async function loadData() {
    setLoading(true);
    try {
      let query = supabase.from('tasks').select('*, projects(name), executor:users!tasks_executor_id_fkey(full_name)');

      if (filters.state) query = query.eq('state_id', filters.state);
      if (filters.priority) query = query.eq('priority', filters.priority);
      if (filters.status) query = query.eq('status', filters.status);
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);

      const { data: tasks } = await query;

      const { data: projects } = await supabase.from('projects').select('id, name, status');
      const { data: states } = await supabase.from('states').select('id, name, uf');

      const total = tasks?.length || 0;
      const completed = tasks?.filter((t) => t.status === 'completed').length || 0;
      const delayed = tasks?.filter((t) => t.status === 'delayed').length || 0;
      const productivity = total > 0 ? Math.round((completed / total) * 100) : 0;

      const tasksByState = states?.map((s) => ({
        name: s.uf,
        value: tasks?.filter((t) => t.state_id === s.id).length || 0,
      })) || [];

      const tasksByPriority = [
        { name: 'Baixa', value: tasks?.filter((t) => t.priority === 'low').length || 0 },
        { name: 'Média', value: tasks?.filter((t) => t.priority === 'medium').length || 0 },
        { name: 'Alta', value: tasks?.filter((t) => t.priority === 'high').length || 0 },
        { name: 'Urgente', value: tasks?.filter((t) => t.priority === 'urgent').length || 0 },
      ];

      const tasksByStatus = [
        { name: 'Pendente', value: tasks?.filter((t) => t.status === 'pending').length || 0 },
        { name: 'Em Andamento', value: tasks?.filter((t) => t.status === 'in_progress').length || 0 },
        { name: 'Validação', value: tasks?.filter((t) => t.status === 'validation').length || 0 },
        { name: 'Concluída', value: completed },
        { name: 'Atrasada', value: delayed },
        { name: 'Cancelada', value: tasks?.filter((t) => t.status === 'canceled').length || 0 },
      ];

      const delayedTasks = tasks?.filter((t) => t.status === 'delayed') || [];

      setData({
        total, completed, delayed, productivity,
        tasksByState, tasksByPriority, tasksByStatus,
        projects, states, tasks, delayedTasks,
      });
    } catch {
      toast.error('Erro ao carregar relatórios');
    } finally {
      setLoading(false);
    }
  }

  function handleExport(format: string) {
    toast.success(`Exportação iniciada - ${format.toUpperCase()}`);
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
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
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">
            Visualize indicadores e métricas dos projetos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileText className="size-4" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <FileDown className="size-4" />
            CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select value={filters.state} onValueChange={(v) => setFilters({ ...filters, state: v ?? '' })}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Estado">
                  {(value: string | null) => {
                    if (!value) return null;
                    const found = STATES_BR.find(s => s.uf === value);
                    return found ? found.name : value;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {STATES_BR.map((s) => (
                  <SelectItem key={s.uf} value={s.uf}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm"
            />

            <Select value={filters.priority} onValueChange={(v) => setFilters({ ...filters, priority: v ?? '' })}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Prioridade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baixa</SelectItem>
                <SelectItem value="medium">Média</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="urgent">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(v) => setFilters({ ...filters, status: v ?? '' })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluída</SelectItem>
                <SelectItem value="delayed">Atrasada</SelectItem>
                <SelectItem value="canceled">Cancelada</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="ghost" size="sm" onClick={() => setFilters({ state: '', project: '', executor: '', priority: '', status: '', dateFrom: '', dateTo: '' })}>
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        {summaryCards.map((card, i) => {
          const Icon = card.icon;
          const value = i === 0 ? data.total : i === 1 ? data.completed : i === 2 ? data.delayed : `${data.productivity}%`;
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-lg bg-muted p-2 ${card.color}`}>
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{card.title}</p>
                    <p className="text-2xl font-bold">{value}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <Tabs defaultValue="executed">
        <TabsList className="w-full flex-wrap">
          {reportTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className="flex-1">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="executed" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Tarefas por Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.tasksByStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tarefas por Prioridade</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.tasksByPriority}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {data.tasksByPriority.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="delayed" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle>Tarefas Atrasadas ({data.delayed})</CardTitle></CardHeader>
            <CardContent>
              {data.delayedTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma tarefa atrasada.</p>
              ) : (
                <div className="space-y-3">
                  {data.delayedTasks.slice(0, 10).map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.projects?.name}</p>
                      </div>
                      <Badge variant="destructive">Atrasada</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="productivity" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Produtividade Geral</CardTitle></CardHeader>
              <CardContent className="flex flex-col items-center py-8">
                <div className="relative flex h-40 w-40 items-center justify-center">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke="currentColor" strokeWidth="8"
                      strokeDasharray={`${(data.productivity / 100) * 264} 264`}
                      className="text-green-500"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute text-3xl font-bold">{data.productivity}%</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{data.completed} de {data.total} tarefas concluídas</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Tarefas por Estado</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.tasksByState} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis dataKey="name" type="category" className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Desempenho por Equipe</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Selecione um filtro para visualizar os dados por equipe.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="state" className="mt-4">
          <Card>
            <CardHeader><CardTitle>Distribuição por Estado</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.tasksByState}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="managerial" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Relatório Gerencial</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Total de Projetos</span>
                  <span className="text-sm font-bold">{data.projects?.length || 0}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Total de Tarefas</span>
                  <span className="text-sm font-bold">{data.total}</span>
                </div>
                <div className="flex justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Taxa de Conclusão</span>
                  <span className="text-sm font-bold">{data.productivity}%</span>
                </div>
                <div className="flex justify-between rounded-lg bg-muted p-3">
                  <span className="text-sm">Tarefas Atrasadas</span>
                  <span className="text-sm font-bold text-red-500">{data.delayed}</span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Resumo por Prioridade</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.tasksByPriority}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label
                    >
                      {data.tasksByPriority.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
