-- GovBrasil - Database Schema
-- Migration for Supabase PostgreSQL

-- ===================== ENUMS =====================
CREATE TYPE user_role AS ENUM ('super_admin', 'state_admin', 'executor', 'viewer');
CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'validation', 'completed', 'delayed', 'canceled');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'paused', 'completed', 'canceled');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- ===================== TABLES =====================

-- States (Brazilian states)
CREATE TABLE IF NOT EXISTS states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  uf VARCHAR(2) NOT NULL UNIQUE,
  region VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(30),
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'executor',
  state_id UUID REFERENCES states(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  state_id UUID NOT NULL REFERENCES states(id),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  manager_id UUID REFERENCES users(id),
  priority priority_level NOT NULL DEFAULT 'medium',
  status project_status NOT NULL DEFAULT 'planning',
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  start_date DATE,
  end_date DATE,
  budget NUMERIC(12,2),
  tags TEXT[] DEFAULT '{}',
  is_archived BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  state_id UUID NOT NULL REFERENCES states(id),
  title VARCHAR(250) NOT NULL,
  description TEXT,
  author_id UUID REFERENCES users(id),
  executor_id UUID REFERENCES users(id),
  reviewer_id UUID REFERENCES users(id),
  priority priority_level NOT NULL DEFAULT 'medium',
  status task_status NOT NULL DEFAULT 'pending',
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  estimated_hours INTEGER,
  actual_hours INTEGER,
  progress_percent INTEGER DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  tags TEXT[] DEFAULT '{}',
  location VARCHAR(200),
  requires_validation BOOLEAN DEFAULT false,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_type VARCHAR(30),
  parent_task_id UUID REFERENCES tasks(id),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

-- Task Comments
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Task Attachments
CREATE TABLE IF NOT EXISTS task_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100),
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  type VARCHAR(50) NOT NULL,
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  related_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT false,
  sent_email BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Activity Logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address VARCHAR(100),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User Permissions
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  module VARCHAR(100) NOT NULL,
  can_view BOOLEAN DEFAULT false,
  can_create BOOLEAN DEFAULT false,
  can_edit BOOLEAN DEFAULT false,
  can_delete BOOLEAN DEFAULT false,
  can_export BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, module)
);

-- ===================== INDEXES =====================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_state_id ON users(state_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_state_id ON projects(state_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_state_id ON tasks(state_id);
CREATE INDEX IF NOT EXISTS idx_tasks_executor_id ON tasks(executor_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity_type ON activity_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);

-- ===================== ROW LEVEL SECURITY =====================
ALTER TABLE states ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper function to get user's state_id
CREATE OR REPLACE FUNCTION public.get_user_state_id()
RETURNS UUID AS $$
  SELECT state_id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- States RLS
CREATE POLICY "states_read_all" ON states FOR SELECT TO authenticated USING (true);
CREATE POLICY "states_write_admin" ON states FOR ALL TO authenticated 
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

-- Users RLS
CREATE POLICY "users_read_own" ON users FOR SELECT TO authenticated 
  USING (auth_user_id = auth.uid() OR public.get_user_role() = 'super_admin' 
    OR (public.get_user_role() = 'state_admin' AND state_id = public.get_user_state_id()));
CREATE POLICY "users_write_super_admin" ON users FOR ALL TO authenticated 
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

-- Projects RLS
CREATE POLICY "projects_read" ON projects FOR SELECT TO authenticated 
  USING (
    public.get_user_role() = 'super_admin' 
    OR state_id = public.get_user_state_id()
    OR manager_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
  );
CREATE POLICY "projects_write" ON projects FOR INSERT TO authenticated 
  WITH CHECK (
    public.get_user_role() = 'super_admin' 
    OR (public.get_user_role() = 'state_admin' AND state_id = public.get_user_state_id())
  );
CREATE POLICY "projects_update" ON projects FOR UPDATE TO authenticated 
  USING (
    public.get_user_role() = 'super_admin' 
    OR (public.get_user_role() = 'state_admin' AND state_id = public.get_user_state_id())
  );
CREATE POLICY "projects_delete" ON projects FOR DELETE TO authenticated 
  USING (public.get_user_role() = 'super_admin');

-- Tasks RLS
CREATE POLICY "tasks_read" ON tasks FOR SELECT TO authenticated 
  USING (
    public.get_user_role() = 'super_admin' 
    OR state_id = public.get_user_state_id()
    OR executor_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
    OR author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
  );
CREATE POLICY "tasks_insert" ON tasks FOR INSERT TO authenticated 
  WITH CHECK (
    public.get_user_role() = 'super_admin' 
    OR (public.get_user_role() IN ('state_admin', 'executor') AND state_id = public.get_user_state_id())
  );
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated 
  USING (
    public.get_user_role() = 'super_admin' 
    OR (public.get_user_role() = 'state_admin' AND state_id = public.get_user_state_id())
    OR executor_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
  );
CREATE POLICY "tasks_delete" ON tasks FOR DELETE TO authenticated 
  USING (public.get_user_role() IN ('super_admin', 'state_admin'));

-- Task Comments RLS
CREATE POLICY "comments_read" ON task_comments FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND (
      t.state_id = public.get_user_state_id() 
      OR t.executor_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
      OR public.get_user_role() = 'super_admin'
    ))
  );
CREATE POLICY "comments_insert" ON task_comments FOR INSERT TO authenticated 
  WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));

-- Task Attachments RLS
CREATE POLICY "attachments_read" ON task_attachments FOR SELECT TO authenticated 
  USING (
    EXISTS (SELECT 1 FROM tasks t WHERE t.id = task_id AND (
      t.state_id = public.get_user_state_id() 
      OR public.get_user_role() = 'super_admin'
    ))
  );
CREATE POLICY "attachments_insert" ON task_attachments FOR INSERT TO authenticated 
  WITH CHECK (uploaded_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));

-- Notifications RLS
CREATE POLICY "notifications_read" ON notifications FOR SELECT TO authenticated 
  USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));
CREATE POLICY "notifications_update" ON notifications FOR UPDATE TO authenticated 
  USING (user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));

-- Activity Logs RLS
CREATE POLICY "activity_logs_read" ON activity_logs FOR SELECT TO authenticated 
  USING (
    public.get_user_role() = 'super_admin' 
    OR user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
  );

-- User Permissions RLS
CREATE POLICY "permissions_read" ON user_permissions FOR SELECT TO authenticated 
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
    OR public.get_user_role() = 'super_admin'
  );
CREATE POLICY "permissions_write" ON user_permissions FOR ALL TO authenticated 
  USING (public.get_user_role() = 'super_admin')
  WITH CHECK (public.get_user_role() = 'super_admin');

-- ===================== TRIGGER FUNCTIONS =====================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_projects_updated_at
  BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_tasks_updated_at
  BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Log activity on changes
CREATE OR REPLACE FUNCTION log_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_data, new_data)
  VALUES (
    (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD)::jsonb ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW)::jsonb ELSE NULL END
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===================== SEED DATA: 27 STATES =====================
INSERT INTO states (name, uf, region) VALUES
  ('Acre', 'AC', 'Norte'),
  ('Alagoas', 'AL', 'Nordeste'),
  ('Amapá', 'AP', 'Norte'),
  ('Amazonas', 'AM', 'Norte'),
  ('Bahia', 'BA', 'Nordeste'),
  ('Ceará', 'CE', 'Nordeste'),
  ('Distrito Federal', 'DF', 'Centro-Oeste'),
  ('Espírito Santo', 'ES', 'Sudeste'),
  ('Goiás', 'GO', 'Centro-Oeste'),
  ('Maranhão', 'MA', 'Nordeste'),
  ('Mato Grosso', 'MT', 'Centro-Oeste'),
  ('Mato Grosso do Sul', 'MS', 'Centro-Oeste'),
  ('Minas Gerais', 'MG', 'Sudeste'),
  ('Pará', 'PA', 'Norte'),
  ('Paraíba', 'PB', 'Nordeste'),
  ('Paraná', 'PR', 'Sul'),
  ('Pernambuco', 'PE', 'Nordeste'),
  ('Piauí', 'PI', 'Nordeste'),
  ('Rio de Janeiro', 'RJ', 'Sudeste'),
  ('Rio Grande do Norte', 'RN', 'Nordeste'),
  ('Rio Grande do Sul', 'RS', 'Sul'),
  ('Rondônia', 'RO', 'Norte'),
  ('Roraima', 'RR', 'Norte'),
  ('Santa Catarina', 'SC', 'Sul'),
  ('São Paulo', 'SP', 'Sudeste'),
  ('Sergipe', 'SE', 'Nordeste'),
  ('Tocantins', 'TO', 'Norte')
ON CONFLICT (uf) DO NOTHING;
