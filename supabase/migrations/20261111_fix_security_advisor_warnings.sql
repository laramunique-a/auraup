-- ==============================================================================
-- Migração: Correção de Avisos do Security Advisor (AuraUP)
-- Data: 2026-11-11
-- ------------------------------------------------------------------------------
-- 1. Fixa search_path em todas as funções públicas (elimina function_search_path_mutable)
-- 2. Restringe políticas RLS da tabela public.feedback (elimina rls_policy_always_true)
-- 3. Revoga execução anônima (anon/PUBLIC) de funções SECURITY DEFINER
-- 4. Converte protect_profile_changes para SECURITY INVOKER e restringe
--    handle_new_user apenas para triggers internos do banco
-- ==============================================================================

-- 1. Converte protect_profile_changes para SECURITY INVOKER e fixa search_path
CREATE OR REPLACE FUNCTION public.protect_profile_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions, auth
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o nível de acesso (role).';
    END IF;

    IF NEW.is_active IS DISTINCT FROM OLD.is_active THEN
      RAISE EXCEPTION 'Apenas administradores podem alterar o status de ativação da conta.';
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
      RAISE EXCEPTION 'Alteração de e-mail não permitida diretamente no perfil.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 2. Converte is_admin e add_user_reward para SECURITY INVOKER (RLS de profiles já permite SELECT/UPDATE para o próprio usuário ou admin) e fixa search_path
ALTER FUNCTION public.is_admin()
  SECURITY INVOKER
  SET search_path = public, extensions, auth;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, extensions, auth;

ALTER FUNCTION public.add_user_reward(UUID, INTEGER, INTEGER)
  SECURITY INVOKER
  SET search_path = public, extensions, auth;

ALTER FUNCTION public.admin_delete_user(UUID)
  SET search_path = public, extensions, auth;

ALTER FUNCTION public.admin_create_student(TEXT, TEXT, TEXT, TEXT, INTEGER)
  SET search_path = public, extensions, auth;

ALTER FUNCTION public.admin_update_user_password(UUID, TEXT)
  SET search_path = public, extensions, auth;

-- 3. Revoga execução por usuários não autenticados (PUBLIC e anon)
REVOKE EXECUTE ON FUNCTION public.add_user_reward(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_student(TEXT, TEXT, TEXT, TEXT, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_user(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.protect_profile_changes() FROM PUBLIC, anon;

-- handle_new_user é apenas trigger de auth.users (não deve ser chamada via API por anon nem authenticated)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Garante que authenticated e service_role continuem executando as funções necessárias no app
GRANT EXECUTE ON FUNCTION public.add_user_reward(UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_create_student(TEXT, TEXT, TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_user(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_update_user_password(UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.protect_profile_changes() TO authenticated, service_role;

-- 4. Políticas RLS seguras para public.feedback (remove políticas permissivas USING/WITH CHECK true)
DROP POLICY IF EXISTS "Allow anonymous delete on feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow anonymous insert on feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow anonymous update on feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow anonymous select on feedback" ON public.feedback;
DROP POLICY IF EXISTS "Qualquer usuário pode enviar feedback" ON public.feedback;
DROP POLICY IF EXISTS "Usuários autenticados podem ler feedbacks" ON public.feedback;
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar status de feedbacks" ON public.feedback;
DROP POLICY IF EXISTS "Usuários autenticados podem excluir feedbacks" ON public.feedback;
DROP POLICY IF EXISTS "Usuarios autenticados enviam seu proprio feedback" ON public.feedback;
DROP POLICY IF EXISTS "Leitura de feedbacks pelo autor ou admin" ON public.feedback;
DROP POLICY IF EXISTS "Apenas admins atualizam feedbacks" ON public.feedback;
DROP POLICY IF EXISTS "Apenas admins excluem feedbacks" ON public.feedback;

CREATE POLICY "Usuarios autenticados enviam seu proprio feedback"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id::text = auth.uid()::text));

CREATE POLICY "Leitura de feedbacks pelo autor ou admin"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (user_id IS NULL OR user_id::text = auth.uid()::text OR public.is_admin());

CREATE POLICY "Apenas admins atualizam feedbacks"
  ON public.feedback FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Apenas admins excluem feedbacks"
  ON public.feedback FOR DELETE
  TO authenticated
  USING (public.is_admin());
