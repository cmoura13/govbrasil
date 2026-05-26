'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, User, Shield, MapPin, Calendar,
  Edit, Trash2, Search, Mail, Phone,
  CheckCircle, XCircle,
} from 'lucide-react';
import { User as UserType, UserRole, STATES_BR } from '@/types/database';
import { toast } from 'sonner';

const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  state_admin: 'Admin Estadual',
  executor: 'Executor',
  viewer: 'Visualizador',
};

const ROLE_VARIANTS: Record<UserRole, string> = {
  super_admin: 'destructive',
  state_admin: 'default',
  executor: 'secondary',
  viewer: 'outline',
};

const emptyUserForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'executor' as UserRole,
  state_id: '',
  phone: '',
  is_active: true,
};

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [form, setForm] = useState(emptyUserForm);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role !== 'super_admin') {
        toast.error('Acesso restrito a administradores');
        return;
      }
      loadUsers();
    }
  }, [currentUser, authLoading]);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from('users')
      .select('*, state:states(*)')
      .order('created_at', { ascending: false });
    if (data) setUsers(data as any);
    setLoading(false);
  }

  function openCreateDialog() {
    setEditingUser(null);
    setForm(emptyUserForm);
    setFormOpen(true);
  }

  function openEditDialog(user: UserType) {
    setEditingUser(user);
    setForm({
      full_name: user.full_name,
      email: user.email,
      password: '',
      role: user.role,
      state_id: user.state_id || '',
      phone: user.phone || '',
      is_active: user.is_active,
    });
    setFormOpen(true);
  }

  async function handleSave() {
    if (!form.full_name || !form.email) {
      toast.error('Preencha nome e e-mail');
      return;
    }
    setSaving(true);
    try {
      if (editingUser) {
        const updates: any = {
          full_name: form.full_name,
          email: form.email,
          role: form.role,
          state_id: form.state_id || null,
          phone: form.phone || null,
          is_active: form.is_active,
        };
        if (form.password) updates.password = form.password;

        const { error } = await supabase
          .from('users')
          .update(updates)
          .eq('id', editingUser.id);

        if (error) throw error;
        toast.success('Usuário atualizado');
      } else {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: form.email,
          password: form.password || 'temp123456',
          email_confirm: true,
        });
        if (authError) throw authError;

        const { error: profileError } = await supabase.from('users').insert({
          auth_user_id: authData.user?.id,
          full_name: form.full_name,
          email: form.email,
          role: form.role,
          state_id: form.state_id || null,
          phone: form.phone || null,
          is_active: form.is_active,
          created_by: currentUser?.id,
        });
        if (profileError) throw profileError;
        toast.success('Usuário criado');
      }
      setFormOpen(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message || 'Erro ao salvar usuário');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const user = users.find((u) => u.id === id);
      if (user?.auth_user_id) {
        await supabase.auth.admin.deleteUser(user.auth_user_id);
      }
      await supabase.from('users').delete().eq('id', id);
      toast.success('Usuário removido');
      setDeleteConfirm(null);
      loadUsers();
    } catch {
      toast.error('Erro ao remover usuário');
    }
  }

  const filtered = users.filter(
    (u) =>
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (currentUser?.role !== 'super_admin') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Shield className="mb-4 h-12 w-12 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground">Apenas super administradores podem gerenciar usuários.</p>
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
          <h1 className="text-2xl font-bold tracking-tight">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da plataforma</p>
        </div>
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogTrigger onClick={openCreateDialog}>
            <Button>
              <Plus className="size-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Senha {editingUser && '(deixe em branco para manter)'}</Label>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editingUser ? 'Nova senha' : 'Senha'}
                />
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <Select value={form.role} onValueChange={(v) => v && setForm({ ...form, role: v as UserRole })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="state_admin">Admin Estadual</SelectItem>
                    <SelectItem value="executor">Executor</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.state_id} onValueChange={(v) => setForm({ ...form, state_id: v ?? '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estado">
                      {(value: string | null) => {
                        if (!value) return null;
                        const found = STATES_BR.find(s => s.uf === value);
                        return found ? `${found.name} (${found.uf})` : value;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STATES_BR.map((s) => (
                      <SelectItem key={s.uf} value={s.uf}>{s.name} ({s.uf})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="(XX) XXXXX-XXXX"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                <Label>Usuário ativo</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <User className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Nenhum usuário encontrado</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map((u) => (
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{u.full_name}</span>
                        <Badge variant={ROLE_VARIANTS[u.role] as any}>
                          {ROLE_LABELS[u.role]}
                        </Badge>
                        {!u.is_active && (
                          <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {u.email}
                        </span>
                        {u.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {u.phone}
                          </span>
                        )}
                        {u.last_login && (
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(u.last_login).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => openEditDialog(u)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    {u.id !== currentUser?.id && (
                      <>
                        {deleteConfirm === u.id ? (
                          <div className="flex gap-1">
                            <Button variant="destructive" size="xs" onClick={() => handleDelete(u.id)}>
                              Confirmar
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => setDeleteConfirm(null)}>
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <Button variant="ghost" size="icon-sm" onClick={() => setDeleteConfirm(u.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground">
        Total: {users.length} usuário{users.length !== 1 ? 's' : ''}
      </div>
    </motion.div>
  );
}
