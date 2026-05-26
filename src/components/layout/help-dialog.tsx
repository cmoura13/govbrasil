'use client';

import { useState } from 'react';
import { HelpCircle, X, BookOpen, UserPlus, FileText, BarChart3, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function HelpDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className="rounded-lg gap-2"
        onClick={() => setOpen(true)}
      >
        <HelpCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Ajuda</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <BookOpen className="h-5 w-5" />
              Manual de Operação - GovBrasil
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="intro" className="mt-2">
            <TabsList className="grid grid-cols-4 rounded-lg">
              <TabsTrigger value="intro" className="rounded-md">Introdução</TabsTrigger>
              <TabsTrigger value="modules" className="rounded-md">Módulos</TabsTrigger>
              <TabsTrigger value="users" className="rounded-md">Usuários</TabsTrigger>
              <TabsTrigger value="tips" className="rounded-md">Dicas</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4 pr-4">
              <TabsContent value="intro" className="space-y-4">
                <div>
                  <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    Sobre o Sistema
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    O GovBrasil é uma plataforma de gestão de projetos e tarefas organizada por estado brasileiro.
                    Permite acompanhamento em tempo real das atividades, responsáveis, prazos e status de execução.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2">Como Começar</h3>
                  <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                    <li>Crie usuários no menu <strong>Usuários</strong> (apenas Administradores)</li>
                    <li>Crie projetos no menu <strong>Projetos</strong></li>
                    <li>Crie tarefas vinculadas aos projetos no menu <strong>Tarefas</strong></li>
                    <li>Acompanhe o progresso pelo <strong>Kanban</strong> ou <strong>Relatórios</strong></li>
                  </ol>
                </div>
              </TabsContent>

              <TabsContent value="modules" className="space-y-4">
                <div>
                  <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-primary" />
                    Relatórios
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Visão geral com indicadores, gráficos de evolução, produtividade por estado, 
                    próximos vencimentos e atividades recentes.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2">Projetos</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie projetos por estado com nome, descrição, responsável, prioridade, 
                    prazos, orçamento e percentual de progresso.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2">Tarefas</h3>
                  <p className="text-sm text-muted-foreground">
                    Crie e gerencie tarefas com executor, prioridade, status, anexos, 
                    comentários e timeline de atividades.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2">Kanban</h3>
                  <p className="text-sm text-muted-foreground">
                    Visualização estilo Kanban com arrastar e soltar entre colunas: 
                    Pendente, Em Execução, Validação e Concluído.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-bold mb-2">Relatórios</h3>
                  <p className="text-sm text-muted-foreground">
                    Relatórios com filtros por estado, projeto, data, prioridade e status. 
                    Exportação para PDF, Excel e CSV.
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="users" className="space-y-4">
                <div>
                  <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Tipos de Usuário
                  </h3>
                  <div className="space-y-3">
                    <div className="rounded-lg border p-3">
                      <p className="font-bold text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-destructive" />
                        Administrador Geral
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Acesso total. Gerencia todos os estados, cria usuários, projetos e relatórios globais.
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="font-bold text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        Administrador Estadual
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Acesso apenas ao seu estado. Gerencia equipes, tarefas e relatórios locais.
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="font-bold text-sm">Executor</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Visualiza apenas tarefas atribuídas, atualiza status e comenta atividades.
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="font-bold text-sm">Visualizador</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Apenas leitura. Consulta dashboards e relatórios.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tips" className="space-y-4">
                <div>
                  <h3 className="text-base font-bold mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Dicas de Uso
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2">
                      <strong className="text-foreground">🔍 Pesquisa:</strong>
                      Use a busca global para encontrar tarefas rapidamente
                    </li>
                    <li className="flex gap-2">
                      <strong className="text-foreground">🎯 Prioridades:</strong>
                      Defina prioridades corretas para facilitar a organização
                    </li>
                    <li className="flex gap-2">
                      <strong className="text-foreground">📱 Mobile:</strong>
                      O sistema é otimizado para uso em smartphones
                    </li>
                    <li className="flex gap-2">
                      <strong className="text-foreground">🌙 Tema:</strong>
                      Alterne entre tema claro e escuro pelo botão no topo
                    </li>
                    <li className="flex gap-2">
                      <strong className="text-foreground">📊 Relatórios:</strong>
                      Use os filtros para relatórios mais precisos
                    </li>
                  </ul>
                </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
