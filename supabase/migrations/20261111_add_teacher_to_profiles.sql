-- ==============================================================================
-- MIGRAÇÃO: Coluna teacher_name em public.profiles + Índices de Performance (Meus Baralhos)
-- ==============================================================================

-- 1. Adiciona a coluna teacher_name (Professor responsável pelo aluno)
-- Alunos existentes permanecem com NULL (exibido como 'A definir' na interface)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS teacher_name TEXT DEFAULT NULL;

-- 2. Atualiza o nome do perfil Admin principal (auraenglish7@gmail.com) para Juliano
UPDATE public.profiles
SET full_name = 'Juliano',
    nickname = 'Juliano'
WHERE LOWER(email) = 'auraenglish7@gmail.com'
  AND (full_name IN ('Professor Aura', 'Professor') OR nickname IN ('Professor Aura', 'Professor'));

-- 3. Índices de performance para acelerar o carregamento de "Meus Baralhos" dos alunos
CREATE INDEX IF NOT EXISTS idx_decks_user_id ON public.decks(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck_id ON public.cards(deck_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_card_id ON public.reviews(card_id);

-- 4. Atualiza a RPC admin_create_student para suportar o parâmetro student_teacher
DROP FUNCTION IF EXISTS public.admin_create_student(TEXT, TEXT, TEXT, TEXT, INTEGER);

CREATE OR REPLACE FUNCTION public.admin_create_student(
  student_email TEXT,
  student_password TEXT,
  student_name TEXT,
  student_level_id TEXT DEFAULT 'lvl_1',
  student_xp INTEGER DEFAULT 0,
  student_teacher TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
DECLARE
  target_user_id UUID;
  clean_teacher TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem cadastrar alunos.';
  END IF;

  clean_teacher := NULLIF(TRIM(COALESCE(student_teacher, '')), '');

  -- 1. Verifica se o e-mail já existe em auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE LOWER(email) = LOWER(TRIM(student_email));

  IF target_user_id IS NOT NULL THEN
    UPDATE auth.users
    SET encrypted_password = crypt(student_password, gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        confirmation_token = COALESCE(confirmation_token, ''),
        recovery_token = COALESCE(recovery_token, ''),
        email_change_token_new = COALESCE(email_change_token_new, ''),
        email_change = COALESCE(email_change, ''),
        phone_change = COALESCE(phone_change, ''),
        phone_change_token = COALESCE(phone_change_token, ''),
        reauthentication_token = COALESCE(reauthentication_token, ''),
        raw_user_meta_data = jsonb_build_object('name', student_name),
        updated_at = NOW()
    WHERE id = target_user_id;

    INSERT INTO public.profiles (
      id, email, full_name, nickname, role, level_id, teacher_name, xp, coins, streak, is_active, must_change_password, updated_at
    ) VALUES (
      target_user_id,
      LOWER(TRIM(student_email)),
      TRIM(student_name),
      split_part(TRIM(student_name), ' ', 1),
      'user',
      student_level_id,
      clean_teacher,
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
      teacher_name = COALESCE(EXCLUDED.teacher_name, public.profiles.teacher_name),
      is_active = true,
      must_change_password = true,
      updated_at = NOW();

    RETURN target_user_id;
  ELSE
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
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      phone_change,
      phone_change_token,
      reauthentication_token
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
      NOW(),
      '',
      '',
      '',
      '',
      '',
      '',
      ''
    ) RETURNING id INTO target_user_id;

    INSERT INTO public.profiles (
      id, email, full_name, nickname, role, level_id, teacher_name, xp, coins, streak, is_active, must_change_password, created_at, updated_at
    ) VALUES (
      target_user_id,
      LOWER(TRIM(student_email)),
      TRIM(student_name),
      split_part(TRIM(student_name), ' ', 1),
      'user',
      student_level_id,
      clean_teacher,
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
      teacher_name = EXCLUDED.teacher_name,
      is_active = true,
      must_change_password = true,
      updated_at = NOW();

    RETURN target_user_id;
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_student(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_student(TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT) TO authenticated, service_role;

