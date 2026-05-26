'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { createClient } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, User, Clock } from 'lucide-react';
import { TaskWithRelations, TaskStatus, PRIORITY_COLORS, Project, State } from '@/types/database';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const columns: { id: TaskStatus; title: string }[] = [
  { id: 'pending', title: 'Pendente' },
  { id: 'in_progress', title: 'Em Execução' },
  { id: 'validation', title: 'Validação' },
  { id: 'completed', title: 'Concluído' },
];

const priorityLabels: Record<string, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente',
};

export default function KanbanPage() {
  const [tasks, setTasks] = useState<TaskWithRelations[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const supabase = createClient();

  const kanbanStatuses: TaskStatus[] = ['pending', 'in_progress', 'validation', 'completed'];

  useEffect(() => {
    fetchData();
    fetchStates();
  }, []);

  async function fetchData() {
    const { data } = await supabase
      .from('tasks')
      .select('*, project:projects(*), state:states(*), author:users!tasks_author_id_fkey(*), executor:users!tasks_executor_id_fkey(*)')
      .in('status', kanbanStatuses)
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

  async function fetchProjects(stateId?: string) {
    let query = supabase
      .from('projects')
      .select('*')
      .eq('is_archived', false)
      .is('deleted_at', null)
      .order('name');

    if (stateId && stateId !== 'all') {
      query = query.eq('state_id', stateId);
    }

    const { data } = await query;
    if (data) setProjects(data);
  }

  useEffect(() => {
    fetchProjects(stateFilter);
  }, [stateFilter]);

  const filteredTasks = tasks.filter((task) => {
    const matchesState = stateFilter === 'all' || task.state_id === stateFilter;
    const matchesProject = projectFilter === 'all' || task.project_id === projectFilter;
    return matchesState && matchesProject;
  });

  const getColumnTasks = useCallback(
    (status: TaskStatus) => filteredTasks.filter((t) => t.status === status),
    [filteredTasks]
  );

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const newStatus = destination.droppableId as TaskStatus;

    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: newStatus } : t))
    );

    const { error } = await supabase
      .from('tasks')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        ...(newStatus === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', draggableId);

    if (error) {
      toast.error('Erro ao mover tarefa');
      fetchData();
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kanban</h1>
          <p className="text-sm text-muted-foreground mt-1">Arraste as tarefas entre as colunas</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="size-4" />
            Nova Tarefa
          </Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <Select value={stateFilter} onValueChange={(v) => { if (v) setStateFilter(v); setProjectFilter('all'); }}>
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
            <SelectItem value="all">Todos os Estados</SelectItem>
            {states.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={projectFilter} onValueChange={(v) => { if (v) setProjectFilter(v); }}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Projeto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Projetos</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((column) => {
            const columnTasks = getColumnTasks(column.id);
            return (
              <div key={column.id} className="flex flex-col w-72 shrink-0">
                <CardHeader className="px-0 py-0 pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span>{column.title}</span>
                    <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                      {columnTasks.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex flex-col gap-2 min-h-[200px] rounded-lg p-2 transition-colors ${
                        snapshot.isDraggingOver ? 'bg-muted/50' : 'bg-muted/20'
                      }`}
                    >
                      {columnTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <p className="text-xs text-muted-foreground">Nenhuma tarefa</p>
                        </div>
                      )}
                      {columnTasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <motion.div
                                initial={false}
                                animate={{
                                  scale: snapshot.isDragging ? 1.05 : 1,
                                  rotate: snapshot.isDragging ? 2 : 0,
                                }}
                              >
                                <Link href={`/tasks/${task.id}`}>
                                  <Card size="sm" className="hover:ring-primary/30 transition-shadow cursor-pointer">
                                    <CardContent className="space-y-2 py-3">
                                      <div className="flex items-start justify-between gap-2">
                                        <p className="text-sm font-medium leading-snug line-clamp-2">
                                          {task.title}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Badge className={PRIORITY_COLORS[task.priority]}>
                                          {priorityLabels[task.priority]}
                                        </Badge>
                                      </div>
                                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        {task.executor ? (
                                          <span className="flex items-center gap-1 truncate">
                                            <User className="size-3 shrink-0" />
                                            <span className="truncate">{task.executor.full_name}</span>
                                          </span>
                                        ) : (
                                          <span className="text-xs text-muted-foreground">Sem executor</span>
                                        )}
                                        {task.due_date && (
                                          <span className="flex items-center gap-1 shrink-0">
                                            <Clock className="size-3" />
                                            {format(new Date(task.due_date), "dd/MM", { locale: ptBR })}
                                          </span>
                                        )}
                                      </div>
                                    </CardContent>
                                  </Card>
                                </Link>
                              </motion.div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
