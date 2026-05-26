'use client';

import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ExternalLink } from 'lucide-react';

export default function RepositorioPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6"
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Repositório</h1>
        <p className="text-sm text-muted-foreground">
          Repositório da K2inova
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center py-16 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <p className="mb-2 text-lg font-medium">
            Acesse aqui ao Repositório da K2inova
          </p>
          <p className="mb-8 max-w-md text-sm text-muted-foreground">
            Links para sites, vídeos e documentação sobre IA-Politicas e Escola-IA.
          </p>
          <a href="https://k2inova.com/repositorio2" target="_blank" rel="noopener noreferrer">
            <Button size="lg">
              <ExternalLink className="mr-2 h-4 w-4" />
              Acesse aqui Repositório
            </Button>
          </a>
        </CardContent>
      </Card>
    </motion.div>
  );
}
