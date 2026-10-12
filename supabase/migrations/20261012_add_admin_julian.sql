-- ==============================================================================
-- Migração: Adicionar Julian Tessaro como Administrador Oficial (AuraUP)
-- E-mail: juliantessaro@outlook.com
-- Senha padrão inicial: @ura2026
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Atualiza a função auxiliar de verificação de admin (RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    LOWER(COALESCE(auth.jwt()->>'email', '')) IN ('auraenglish7@gmail.com', 'juliantessaro@outlook.com')
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Cria ou atualiza o usuário no auth.users do Supabase
DO $$
DECLARE
  new_admin_uuid UUID := gen_random_uuid();
  target_email TEXT := 'juliantessaro@outlook.com';
  default_pass TEXT := '@ura2026';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE LOWER(email) = LOWER(target_email)) THEN
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
      new_admin_uuid,
      '00000000-0000-0000-0000-000000000000',
      target_email,
      crypt(default_pass, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Julian Tessaro"}',
      NOW(),
      NOW(),
      'authenticated',
      'authenticated',
      ''
    );
  ELSE
    UPDATE auth.users
    SET 
      encrypted_password = crypt(default_pass, gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"name":"Julian Tessaro"}'::jsonb
    WHERE LOWER(email) = LOWER(target_email);
  END IF;
END $$;

-- 3. Cria ou atualiza o perfil em public.profiles com role='admin'
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
  'Julian Tessaro',
  'Julian',
  'admin',
  'admin',
  5000,
  500,
  30,
  true,
  false
FROM auth.users
WHERE LOWER(email) = LOWER('juliantessaro@outlook.com')
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  full_name = 'Julian Tessaro',
  nickname = 'Julian',
  avatar_id = 'admin',
  is_active = true,
  must_change_password = false;
