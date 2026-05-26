'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
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
  Plus,
  Search,
  FolderKanban,
  MapPin,
  Trash2,
  Calendar,
  ArrowUpRight,
  MoreHorizontal,
} from 'lucide-react';
import { ProjectWithManager, PRIORITY_COLORS } from '@/types/database';
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

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectWithManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*, manager:users!manager_id(*), state:states(*)')
      .is('deleted_at', null)
      .order('name', { ascending: true });

    if (data) setProjects(data as unknown as ProjectWithManager[]);
    setLoading(false);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', deleteId);

    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Projeto excluído' });
      setProjects((prev) => prev.filter((p) => p.id !== deleteId));
    }
    setDeleting(false);
    setDeleteId(null);
  }

  const filtered = useMemo(
    () =>
      projects.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.state?.name.toLowerCase().includes(search.toLowerCase()) ||
          p.state?.uf.toLowerCase().includes(search.toLowerCase())
      ),
    [projects, search]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projetos</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie todos os projetos do GovBrasil
          </p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Projeto
          </Button>
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, estado ou UF..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted">
            <FolderKanban className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">
            {search ? 'Nenhum projeto encontrado' : 'Nenhum projeto ainda'}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {search
              ? 'Tente ajustar sua busca'
              : 'Crie seu primeiro projeto para começar'}
          </p>
          {!search && (
            <Link href="/projects/new">
              <Button className="mt-4">
                <Plus className="mr-1 h-4 w-4" />
                Novo Projeto
              </Button>
            </Link>
          )}
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filtered.map((project) => (
            <motion.div key={project.id} variants={cardVariants}>
              <Link href={`/projects/${project.id}`} className="group block">
                <Card className="cursor-pointer transition-colors hover:border-primary/30">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="line-clamp-1 text-base">
                        {project.name}
                      </CardTitle>
                      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={
                          PROJECT_STATUS_COLORS[project.status] ||
                          'bg-gray-500/10 text-gray-500'
                        }
                      >
                        {STATUS_LABEL[project.status] || project.status}
                      </Badge>
                      <Badge
                        className={
                          PRIORITY_COLORS[project.priority] ||
                          'bg-gray-500/10 text-gray-500'
                        }
                      >
                        {PRIORITY_LABEL[project.priority] || project.priority}
                      </Badge>
                    </div>

                    {project.state && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          {project.state.name} ({project.state.uf})
                        </span>
                      </div>
                    )}

                    {project.manager && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                          {project.manager.full_name
                            ?.split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2) || '?'}
                        </div>
                        <span>{project.manager.full_name}</span>
                      </div>
                    )}

                    <Progress value={project.progress_percent}>
                      <ProgressLabel>Progresso</ProgressLabel>
                      <ProgressValue />
                    </Progress>

                    {project.end_date && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {new Date(project.end_date).toLocaleDateString(
                            'pt-BR'
                          )}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
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
              onClick={() => setDeleteId(null)}
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
