-- Add author_id to notifications for tracking who created it
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS author_id UUID REFERENCES users(id);

-- Update RLS policies
DROP POLICY IF EXISTS "notifications_read" ON notifications;
CREATE POLICY "notifications_read" ON notifications FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid() LIMIT 1)
  );
