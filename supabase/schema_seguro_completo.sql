-- ==============================================================================
-- AuraUP - Schema Seguro Completo e Políticas RLS (Supabase)
-- ==============================================================================
-- Este script define a estrutura completa de banco de dados para o AuraUP,
-- garantindo Row Level Security (RLS) estrito para que nenhum usuário comum
-- consiga alterar dados administrativos, outros perfis ou decks oficiais.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. FUNÇÃO AUXILIAR DE VERIFICAÇÃO DE ADMIN (Previne recursão em RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 3. TABELA DE NÍVEIS / TURMAS (public.levels)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.levels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  min_xp INTEGER DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT 'Sparkles',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de turmas por usuários autenticados" ON public.levels;
CREATE POLICY "Leitura de turmas por usuários autenticados"
  ON public.levels FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Gestão de turmas apenas por admins" ON public.levels;
CREATE POLICY "Gestão de turmas apenas por admins"
  ON public.levels FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 4. TABELA DE PERFIS DE USUÁRIOS (public.profiles)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  nickname TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  avatar_id TEXT DEFAULT 'avatar_1',
  xp INTEGER DEFAULT 0,
  coins INTEGER DEFAULT 0,
  streak INTEGER DEFAULT 0,
  level_id TEXT REFERENCES public.levels(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  must_change_password BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem visualizar os perfis para rankings e turmas
DROP POLICY IF EXISTS "Perfis visíveis para autenticados" ON public.profiles;
CREATE POLICY "Perfis visíveis para autenticados"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Apenas o próprio usuário ou o administrador pode atualizar os dados
DROP POLICY IF EXISTS "Usuário edita seu próprio perfil ou admin edita qualquer um" ON public.profiles;
CREATE POLICY "Usuário edita seu próprio perfil ou admin edita qualquer um"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Apenas o admin pode deletar perfis
DROP POLICY IF EXISTS "Apenas admin pode deletar perfis" ON public.profiles;
CREATE POLICY "Apenas admin pode deletar perfis"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Trigger para criar perfil automaticamente no primeiro login / cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nickname, role, avatar_id, xp, coins, streak, is_active)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'avatar_1',
    0,
    0,
    0,
    true
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 5. TABELA DE DECKS OFICIAIS (public.official_decks)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.official_decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Geral',
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  cards JSONB DEFAULT '[]'::jsonb
);

ALTER TABLE public.official_decks ENABLE ROW LEVEL SECURITY;

-- Alunos só podem ver se estiver publicado; Admins podem ver todos (mesmo ocultos)
DROP POLICY IF EXISTS "Leitura de decks oficiais" ON public.official_decks;
CREATE POLICY "Leitura de decks oficiais"
  ON public.official_decks FOR SELECT
  TO authenticated
  USING (is_published = TRUE OR public.is_admin());

-- Apenas admins podem criar, editar ou excluir decks oficiais
DROP POLICY IF EXISTS "Gestão de decks oficiais restrita a admin" ON public.official_decks;
CREATE POLICY "Gestão de decks oficiais restrita a admin"
  ON public.official_decks FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 6. TABELA DE PALAVRAS DO DIA (public.words_of_the_day)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.words_of_the_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  phonetic TEXT,
  type TEXT,
  translation TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT NOT NULL,
  example_translation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.words_of_the_day ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de palavras do dia" ON public.words_of_the_day;
CREATE POLICY "Leitura pública de palavras do dia"
  ON public.words_of_the_day FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Gestão de palavras do dia restrita a admin" ON public.words_of_the_day;
CREATE POLICY "Gestão de palavras do dia restrita a admin"
  ON public.words_of_the_day FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. TABELAS DE FLASHCARDS PESSOAIS (public.decks, public.cards, public.reviews)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia seus próprios decks" ON public.decks;
CREATE POLICY "Usuário gerencia seus próprios decks"
  ON public.decks FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  front_image TEXT,
  back_image TEXT,
  front_lang TEXT DEFAULT 'en-US',
  back_lang TEXT DEFAULT 'pt-BR',
  front_audio BOOLEAN DEFAULT TRUE,
  back_audio BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia cartões de seus decks" ON public.cards;
CREATE POLICY "Usuário gerencia cartões de seus decks"
  ON public.cards FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id AND decks.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.decks
      WHERE decks.id = cards.deck_id AND decks.user_id = auth.uid()
    )
  );

CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  repetitions INTEGER DEFAULT 0,
  interval INTEGER DEFAULT 0,
  ease_factor NUMERIC(4, 2) DEFAULT 2.50,
  due_date DATE NOT NULL,
  last_reviewed TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia apenas suas próprias revisões" ON public.reviews;
CREATE POLICY "Usuário gerencia apenas suas próprias revisões"
  ON public.reviews FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
