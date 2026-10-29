-- ==============================================================================
-- Migração: Cria/corrige a RPC admin_update_user_password (AuraUP)
-- ------------------------------------------------------------------------------
-- Contexto: a função não existia em produção, então a redefinição de senha pelo
-- painel admin falhava silenciosamente (apenas o perfil era atualizado).
-- No Supabase o pgcrypto fica no schema "extensions", por isso as chamadas de
-- crypt/gen_salt são qualificadas e o search_path é fixado.
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  target_user_id UUID,
  new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Apenas administradores podem redefinir a senha de outros usuários.';
  END IF;

  IF new_password IS NULL OR length(trim(new_password)) < 6 THEN
    RAISE EXCEPTION 'A nova senha deve ter no mínimo 6 caracteres.';
  END IF;

  UPDATE auth.users
  SET encrypted_password = extensions.crypt(new_password, extensions.gen_salt('bf')),
      email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
      updated_at = NOW()
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado no Auth (id %).', target_user_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(UUID, TEXT) TO authenticated;
