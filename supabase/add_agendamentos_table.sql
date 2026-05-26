CREATE TABLE IF NOT EXISTS agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  scheduled_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agendamentos_created_by ON agendamentos(created_by);
CREATE INDEX IF NOT EXISTS idx_agendamentos_scheduled_date ON agendamentos(scheduled_date);

ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agendamentos_read" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_insert" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_update" ON agendamentos;
DROP POLICY IF EXISTS "agendamentos_delete" ON agendamentos;

CREATE POLICY "agendamentos_read" ON agendamentos FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "agendamentos_insert" ON agendamentos FOR INSERT TO authenticated
  WITH CHECK (created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "agendamentos_update" ON agendamentos FOR UPDATE TO authenticated
  USING (created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));

CREATE POLICY "agendamentos_delete" ON agendamentos FOR DELETE TO authenticated
  USING (created_by = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1));
