-- NIGHTMARE AI — Supabase schema migration
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

-- Drop legacy capitalized tables if they exist (from previous Prisma push)
DROP TABLE IF EXISTS public."Message" CASCADE;
DROP TABLE IF EXISTS public."Presentation" CASCADE;
DROP TABLE IF EXISTS public."User" CASCADE;
DROP TABLE IF EXISTS public."Post" CASCADE;

-- Drop legacy lowercase tables if they exist (idempotent)
DROP TABLE IF EXISTS public.prompt_library CASCADE;
DROP TABLE IF EXISTS public.presentation_jobs CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.files CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.usage CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.conversations CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1. profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  display_name text,
  avatar_url text,
  provider text NOT NULL DEFAULT 'email',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX profiles_email_idx ON public.profiles(email);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_insert_own ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. folders
CREATE TABLE public.folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY folders_select_own ON public.folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY folders_insert_own ON public.folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY folders_update_own ON public.folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY folders_delete_own ON public.folders FOR DELETE USING (auth.uid() = user_id);

-- 3. conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'New Chat',
  folder_id uuid REFERENCES public.folders(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conversations_user_id_updated_at_idx ON public.conversations(user_id, updated_at);
CREATE INDEX conversations_user_id_pinned_idx ON public.conversations(user_id, pinned);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_select_own ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY conversations_insert_own ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY conversations_update_own ON public.conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY conversations_delete_own ON public.conversations FOR DELETE USING (auth.uid() = user_id);

-- 4. messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system')),
  content text NOT NULL,
  tokens integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX messages_conversation_id_created_at_idx ON public.messages(conversation_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_select_own ON public.messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY messages_insert_own ON public.messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY messages_update_own ON public.messages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY messages_delete_own ON public.messages FOR DELETE USING (auth.uid() = user_id);

-- 5. presentations
CREATE TABLE public.presentations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  topic text NOT NULL,
  audience text,
  language text NOT NULL DEFAULT 'en',
  style text,
  theme text,
  slide_count integer NOT NULL DEFAULT 0,
  prompt text NOT NULL DEFAULT '',
  content jsonb,
  pptx_path text,
  pdf_path text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX presentations_user_id_updated_at_idx ON public.presentations(user_id, updated_at);
ALTER TABLE public.presentations ENABLE ROW LEVEL SECURITY;
CREATE POLICY presentations_select_own ON public.presentations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY presentations_insert_own ON public.presentations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY presentations_update_own ON public.presentations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY presentations_delete_own ON public.presentations FOR DELETE USING (auth.uid() = user_id);

-- 6. prompt_library
CREATE TABLE public.prompt_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prompt_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY prompt_library_select_own ON public.prompt_library FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY prompt_library_insert_own ON public.prompt_library FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY prompt_library_update_own ON public.prompt_library FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY prompt_library_delete_own ON public.prompt_library FOR DELETE USING (auth.uid() = user_id);

-- 7. user_settings (reserved)
CREATE TABLE public.user_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme text,
  language text,
  font_size text,
  response_length text,
  creativity integer,
  streaming boolean,
  notifications boolean,
  selected_model text,
  accent_color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_settings_select_own ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY user_settings_insert_own ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY user_settings_update_own ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

-- 8. usage (reserved)
CREATE TABLE public.usage (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  chat_count integer NOT NULL DEFAULT 0,
  presentation_count integer NOT NULL DEFAULT 0,
  tokens_used bigint NOT NULL DEFAULT 0,
  storage_used bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY usage_select_own ON public.usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY usage_insert_own ON public.usage FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY usage_update_own ON public.usage FOR UPDATE USING (auth.uid() = user_id);

-- 9. Auto-create profile + settings + usage on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'provider', 'email')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_settings (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;
  INSERT INTO public.usage (user_id) VALUES (NEW.id) ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Done
SELECT 'Migration complete' AS status;
