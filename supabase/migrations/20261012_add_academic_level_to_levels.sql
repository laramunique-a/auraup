-- Migration: Adicionar academic_level na tabela levels
-- Data: 2026-10-12
-- Objetivo: Vincular turmas a níveis pedagógicos para permitir os 3 rankings (Global, Nível, Turma)

ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS academic_level TEXT;

-- Atualizar turmas existentes com seus respectivos níveis pedagógicos padrão
UPDATE public.levels 
SET academic_level = 'Básico' 
WHERE academic_level IS NULL 
  AND (id = 'lvl_1' OR name ILIKE '%basic%' OR name ILIKE '%hello%' OR name ILIKE '%iniciante%');

UPDATE public.levels 
SET academic_level = 'Pré-Intermediário' 
WHERE academic_level IS NULL 
  AND (id = 'lvl_2' OR name ILIKE '%pre%' OR name ILIKE '%pré%');

UPDATE public.levels 
SET academic_level = 'Intermediário' 
WHERE academic_level IS NULL 
  AND (id = 'lvl_3' OR name ILIKE '%explore%' OR (name ILIKE '%interm%' AND name NOT ILIKE '%pre%' AND name NOT ILIKE '%pré%'));

UPDATE public.levels 
SET academic_level = 'Avançado' 
WHERE academic_level IS NULL 
  AND (id = 'lvl_4' OR name ILIKE '%adv%' OR name ILIKE '%avanç%' OR name ILIKE '%independen%');

-- Fallback para qualquer outra turma que ainda não tenha nível pedagógico
UPDATE public.levels 
SET academic_level = 'Básico' 
WHERE academic_level IS NULL;
