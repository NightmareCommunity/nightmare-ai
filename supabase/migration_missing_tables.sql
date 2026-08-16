-- NIGHTMARE AI — Missing tables migration
-- Run this in Supabase SQL Editor to create the remaining tables

-- 1. files (for file uploads)
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime_type text,
  size bigint NOT NULL DEFAULT 0,
  storage_path text,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('uploading','ready','error','deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS files_user_id_created_at_idx ON public.files(user_id, created_at);
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "files_select_own" ON public.files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "files_insert_own" ON public.files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "files_update_own" ON public.files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "files_delete_own" ON public.files FOR DELETE USING (auth.uid() = user_id);

-- 2. projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_user_id_updated_at_idx ON public.projects(user_id, updated_at);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects_select_own" ON public.projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "projects_insert_own" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update_own" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "projects_delete_own" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- 3. favorites
CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('chat','file','presentation','project')),
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_type, item_id)
);
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_select_own" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "favorites_insert_own" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "favorites_delete_own" ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- 4. presentation_jobs
CREATE TABLE IF NOT EXISTS public.presentation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  presentation_id uuid REFERENCES public.presentations(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  provider text NOT NULL DEFAULT 'presenton',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','processing','completed','failed','cancelled')),
  result jsonb,
  error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS presentation_jobs_user_id_idx ON public.presentation_jobs(user_id);
CREATE INDEX IF NOT EXISTS presentation_jobs_status_idx ON public.presentation_jobs(status);
ALTER TABLE public.presentation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "presentation_jobs_select_own" ON public.presentation_jobs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "presentation_jobs_insert_own" ON public.presentation_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "presentation_jobs_update_own" ON public.presentation_jobs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "presentation_jobs_delete_own" ON public.presentation_jobs FOR DELETE USING (auth.uid() = user_id);

-- 5. Storage buckets (private by default)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('user-files', 'user-files', false),
  ('generated-images', 'generated-images', false),
  ('presentations', 'presentations', false)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage RLS policies for user-files bucket
CREATE POLICY "user_files_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user_files_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user_files_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "user_files_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'user-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 7. Storage RLS policies for generated-images bucket
CREATE POLICY "generated_images_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "generated_images_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "generated_images_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "generated_images_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'generated-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 8. Storage RLS policies for presentations bucket
CREATE POLICY "presentations_select_own" ON storage.objects
  FOR SELECT USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "presentations_insert_own" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "presentations_update_own" ON storage.objects
  FOR UPDATE USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "presentations_delete_own" ON storage.objects
  FOR DELETE USING (bucket_id = 'presentations' AND auth.uid()::text = (storage.foldername(name))[1]);

SELECT 'Migration complete' AS status;
