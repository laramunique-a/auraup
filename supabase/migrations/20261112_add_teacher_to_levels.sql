-- ==============================================================================
-- Migration: Adicionar coluna 'teacher_name' na tabela levels
-- Data: 2026-11-12
-- Objetivo: Atrelar turmas ao professor responsável e propagar aos alunos
-- ==============================================================================

-- 1. Cria a coluna teacher_name se não existir
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- 2. Vincula alunos existentes ao professor da turma quando definido
-- (Será gerenciado automaticamente pela aplicação ao definir o professor na turma)
