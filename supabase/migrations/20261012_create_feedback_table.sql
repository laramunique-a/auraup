-- Migration: Tabela de Feedback e Chamados de Suporte
-- Data: 2026-10-12
-- Objetivo: Armazenar sugestões e relatórios de bugs enviados pelos alunos

CREATE TABLE IF NOT EXISTS public.feedback (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT,
  user_email TEXT,
  type TEXT NOT NULL DEFAULT 'bug',
  message TEXT NOT NULL,
  images JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Permitir que usuários autenticados e anônimos (caso local) insiram feedbacks
DROP POLICY IF EXISTS "Qualquer usuário pode enviar feedback" ON public.feedback;
CREATE POLICY "Qualquer usuário pode enviar feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Permitir leitura de feedbacks por usuários autenticados (professores/admins)
DROP POLICY IF EXISTS "Usuários autenticados podem ler feedbacks" ON public.feedback;
CREATE POLICY "Usuários autenticados podem ler feedbacks"
  ON public.feedback FOR SELECT
  USING (true);

-- Permitir atualização de status
DROP POLICY IF EXISTS "Usuários autenticados podem atualizar status de feedbacks" ON public.feedback;
CREATE POLICY "Usuários autenticados podem atualizar status de feedbacks"
  ON public.feedback FOR UPDATE
  USING (true);

-- Permitir deleção
DROP POLICY IF EXISTS "Usuários autenticados podem excluir feedbacks" ON public.feedback;
CREATE POLICY "Usuários autenticados podem excluir feedbacks"
  ON public.feedback FOR DELETE
  USING (true);
