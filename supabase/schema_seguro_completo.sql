-- ==============================================================================
-- AuraUP - Schema Seguro Completo e Políticas RLS (Supabase)
-- ==============================================================================
-- Este script define a estrutura completa de banco de dados para o AuraUP,
-- garantindo Row Level Security (RLS) estrito para que nenhum usuário comum
-- consiga alterar dados administrativos, outros perfis ou decks oficiais.
-- ==============================================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

-- Turmas iniciais padrão do sistema
INSERT INTO public.levels (id, name, min_xp, color) VALUES
  ('lvl_1', 'Nível 1: Hello', 0, '#FF8A00'),
  ('lvl_2', 'Nível 2: Connections', 500, '#00E676'),
  ('lvl_3', 'Nível 3: Discovery', 1500, '#00A3FF'),
  ('lvl_4', 'Nível 4: Master', 3000, '#8B5CF6')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 4. MIGRAÇÃO SEGURA & TABELA DE PERFIS DE USUÁRIOS (public.profiles)
-- ==============================================================================

-- Se profiles antiga existir com id TEXT (legado sem auth.users), recria para o padrão seguro
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND data_type = 'text' AND column_name = 'id'
  ) THEN
    DROP TABLE IF EXISTS public.reviews CASCADE;
    DROP TABLE IF EXISTS public.cards CASCADE;
    DROP TABLE IF EXISTS public.decks CASCADE;
    DROP TABLE IF EXISTS public.profiles CASCADE;
  END IF;
END $$;

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

-- Usuário edita seu próprio perfil ou admin edita qualquer perfil
DROP POLICY IF EXISTS "Usuário edita seu próprio perfil ou admin edita qualquer um" ON public.profiles;
CREATE POLICY "Usuário edita seu próprio perfil ou admin edita qualquer um"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Inserção permitida para o próprio usuário ou admin
DROP POLICY IF EXISTS "Permitir inserção de perfil" ON public.profiles;
CREATE POLICY "Permitir inserção de perfil"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- Apenas o admin pode deletar perfis
DROP POLICY IF EXISTS "Apenas admin pode deletar perfis" ON public.profiles;
CREATE POLICY "Apenas admin pode deletar perfis"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- Trava de segurança para impedir escalação de privilégios ou adulteração de status por não-admins
CREATE OR REPLACE FUNCTION public.protect_profile_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o usuário NÃO for administrador (ou seja, for um aluno ou usuário comum)
  IF NOT public.is_admin() THEN
    -- 1. Impede escalação de privilégio para admin
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o nível de acesso (role).';
    END IF;

    -- 2. Impede que o aluno reative uma conta desativada pelo admin
    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o status de ativação da conta.';
    END IF;

    -- 3. Impede alteração de email pelo endpoint de profiles
    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Alteração de e-mail não permitida diretamente no perfil.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_protect_profile_changes ON public.profiles;
CREATE TRIGGER trg_protect_profile_changes
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_changes();

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
-- 5. CONTA OFICIAL DO PROFESSOR (auraenglish7@gmail.com / @ura2026)
-- ==============================================================================
DO $$
DECLARE
  admin_uuid UUID := gen_random_uuid();
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'auraenglish7@gmail.com') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud,
      confirmation_token
    ) VALUES (
      admin_uuid,
      '00000000-0000-0000-0000-000000000000',
      'auraenglish7@gmail.com',
      crypt('@ura2026', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Professor Aura"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      ''
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = crypt('@ura2026', gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = 'auraenglish7@gmail.com';
  END IF;
END $$;

INSERT INTO public.profiles (
  id,
  email,
  full_name,
  nickname,
  role,
  avatar_id,
  xp,
  coins,
  streak,
  is_active,
  must_change_password
)
SELECT
  id,
  email,
  'Professor Aura',
  'Professor',
  'admin',
  'admin',
  5000,
  500,
  30,
  true,
  false
FROM auth.users
WHERE email = 'auraenglish7@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Professor Aura',
  nickname = 'Professor',
  avatar_id = 'admin',
  is_active = true,
  must_change_password = false;

-- ==============================================================================
-- 6. TABELA DE DECKS OFICIAIS (public.official_decks)
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

DROP POLICY IF EXISTS "Leitura de decks oficiais" ON public.official_decks;
CREATE POLICY "Leitura de decks oficiais"
  ON public.official_decks FOR SELECT
  TO authenticated
  USING (is_published = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Gestão de decks oficiais restrita a admin" ON public.official_decks;
CREATE POLICY "Gestão de decks oficiais restrita a admin"
  ON public.official_decks FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. TABELA DE PALAVRAS DO DIA (public.words_of_the_day)
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
-- 8. TABELAS DE FLASHCARDS PESSOAIS (public.decks, public.cards, public.reviews)
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

-- ==============================================================================
-- 9. TABELA DE ATIVIDADE DIÁRIA (public.activity)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  count INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuário gerencia sua própria atividade" ON public.activity;
CREATE POLICY "Usuário gerencia sua própria atividade"
  ON public.activity FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ==============================================================================
-- 10. RPC: AJUSTE DE SALDO DE ALUNO (add_user_reward)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.add_user_reward(
  user_id UUID,
  xp_to_add INTEGER,
  coins_to_add INTEGER
)
RETURNS VOID AS $$
BEGIN
  -- Permite apenas que o próprio usuário receba seus pontos OU que um admin os conceda
  IF auth.uid() != user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Não autorizado a alterar recompensas de outro usuário.';
  END IF;

  UPDATE public.profiles
  SET 
    xp = GREATEST(0, xp + xp_to_add),
    coins = GREATEST(0, coins + coins_to_add),
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 11. RPC: ADMIN REDEFINIR SENHA DE ALUNO (admin_update_user_password)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem redefinir a senha de outros usuários.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = crypt(new_password, gen_salt('bf')),
      updated_at = NOW()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 12. RPC: ADMIN EXCLUIR USUÁRIO DEFINITIVAMENTE (admin_delete_user)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id UUID)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem excluir usuários.';
  END IF;

  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 13. RPC: ADMIN CRIAR OU RESTAURAR ALUNO (admin_create_student)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.admin_create_student(
  student_email TEXT,
  student_password TEXT,
  student_name TEXT,
  student_level_id TEXT DEFAULT 'lvl_1',
  student_xp INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  target_user_id UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem cadastrar alunos.';
  END IF;

  -- 1. Verifica se o e-mail já existe em auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(student_email));

  IF target_user_id IS NOT NULL THEN
    -- Atualiza a senha no auth.users e garante metadados
    UPDATE auth.users
    SET encrypted_password = crypt(student_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        raw_user_meta_data = jsonb_build_object('name', student_name),
        updated_at = NOW()
    WHERE id = target_user_id;

    -- Garante / Restaura o perfil em public.profiles
    INSERT INTO public.profiles (
      id, email, full_name, nickname, role, level_id, xp, coins, streak, is_active, must_change_password, updated_at
    ) VALUES (
      target_user_id,
      LOWER(TRIM(student_email)),
      TRIM(student_name),
      split_part(TRIM(student_name), ' ', 1),
      'user',
      student_level_id,
      COALESCE(student_xp, 0),
      0,
      1,
      true,
      true,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      nickname = EXCLUDED.nickname,
      role = 'user',
      level_id = EXCLUDED.level_id,
      is_active = true,
      must_change_password = true,
      updated_at = NOW();

    RETURN target_user_id;
  ELSE
    -- 2. Não existe: Cria do zero no auth.users
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      LOWER(TRIM(student_email)),
      crypt(student_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('name', student_name),
      NOW(),
      NOW()
    ) RETURNING id INTO target_user_id;

    -- Cria o perfil no public.profiles
    INSERT INTO public.profiles (
      id, email, full_name, nickname, role, level_id, xp, coins, streak, is_active, must_change_password, created_at, updated_at
    ) VALUES (
      target_user_id,
      LOWER(TRIM(student_email)),
      TRIM(student_name),
      split_part(TRIM(student_name), ' ', 1),
      'user',
      student_level_id,
      COALESCE(student_xp, 0),
      0,
      1,
      true,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      nickname = EXCLUDED.nickname,
      role = 'user',
      level_id = EXCLUDED.level_id,
      is_active = true,
      must_change_password = true,
      updated_at = NOW();

    RETURN target_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 14. SINCRONIZAÇÃO DE USUÁRIOS ÓRFÃOS (Resgata perfis ausentes de auth.users)
-- ==============================================================================
INSERT INTO public.profiles (
  id, email, full_name, nickname, role, level_id, xp, coins, streak, is_active, must_change_password
)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)),
  split_part(COALESCE(u.raw_user_meta_data->>'name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), ' ', 1),
  CASE WHEN LOWER(u.email) = 'auraenglish7@gmail.com' THEN 'admin' ELSE 'user' END,
  'lvl_1',
  0,
  0,
  1,
  true,
  true
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;


