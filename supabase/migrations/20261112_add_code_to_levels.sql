-- ==============================================================================
-- Migration: Adicionar coluna 'code' na tabela levels e padronizar códigos e cores
-- Data: 2026-11-12
-- Objetivo: Identificadores únicos de turma (H001, C001, E001, I001) e cores oficiais
-- ==============================================================================

-- 1. Cria as colunas code, academic_level e teacher_name se não existirem
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS academic_level TEXT;
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.levels ADD COLUMN IF NOT EXISTS teacher_name TEXT;

-- 2. Padronização dos Níveis Pedagógicos e Cores Institucionais
-- Hello (Básico) -> Cor Azul (#2563EB)
UPDATE public.levels
SET 
  academic_level = 'Hello (Básico)',
  color = '#2563EB'
WHERE academic_level ILIKE '%básico%' 
   OR academic_level ILIKE '%hello%' 
   OR name ILIKE '%hello%' 
   OR name ILIKE '%basic%' 
   OR name ILIKE '%iniciante%'
   OR id = 'lvl_1';

-- Connections (Pré-Intermediário) -> Cor Verde (#10B981)
UPDATE public.levels
SET 
  academic_level = 'Connections (Pré-Intermediário)',
  color = '#10B981'
WHERE academic_level ILIKE '%pré%' 
   OR academic_level ILIKE '%pre%' 
   OR academic_level ILIKE '%connection%' 
   OR name ILIKE '%connection%' 
   OR name ILIKE '%pre%' 
   OR name ILIKE '%pré%'
   OR id = 'lvl_2';

-- Explore (Intermediário) -> Cor Laranja (#F59E0B)
UPDATE public.levels
SET 
  academic_level = 'Explore (Intermediário)',
  color = '#F59E0B'
WHERE (academic_level ILIKE '%interm%' AND academic_level NOT ILIKE '%pré%' AND academic_level NOT ILIKE '%pre%')
   OR academic_level ILIKE '%explore%' 
   OR name ILIKE '%explore%' 
   OR (name ILIKE '%interm%' AND name NOT ILIKE '%pre%' AND name NOT ILIKE '%pré%')
   OR id = 'lvl_3';

-- Independence (Avançado) -> Cor Vermelha (#EF4444)
UPDATE public.levels
SET 
  academic_level = 'Independence (Avançado)',
  color = '#EF4444'
WHERE academic_level ILIKE '%avanç%' 
   OR academic_level ILIKE '%adv%' 
   OR academic_level ILIKE '%independen%' 
   OR name ILIKE '%independen%' 
   OR name ILIKE '%adv%' 
   OR name ILIKE '%avanç%' 
   OR name ILIKE '%master%'
   OR id = 'lvl_4';

-- 3. Atribuição de Códigos Sequenciais Únicos para Turmas sem Código
WITH ranked_levels AS (
  SELECT 
    id,
    academic_level,
    CASE 
      WHEN academic_level ILIKE '%connection%' OR academic_level ILIKE '%pre%' THEN 'C'
      WHEN academic_level ILIKE '%explore%' OR academic_level ILIKE '%interm%' THEN 'E'
      WHEN academic_level ILIKE '%independen%' OR academic_level ILIKE '%avanç%' OR academic_level ILIKE '%adv%' THEN 'I'
      ELSE 'H'
    END AS prefix,
    ROW_NUMBER() OVER (
      PARTITION BY (
        CASE 
          WHEN academic_level ILIKE '%connection%' OR academic_level ILIKE '%pre%' THEN 'C'
          WHEN academic_level ILIKE '%explore%' OR academic_level ILIKE '%interm%' THEN 'E'
          WHEN academic_level ILIKE '%independen%' OR academic_level ILIKE '%avanç%' OR academic_level ILIKE '%adv%' THEN 'I'
          ELSE 'H'
        END
      )
      ORDER BY min_xp ASC, name ASC, id ASC
    ) AS seq
  FROM public.levels
  WHERE code IS NULL OR code = ''
)
UPDATE public.levels l
SET code = r.prefix || LPAD(r.seq::TEXT, 3, '0')
FROM ranked_levels r
WHERE l.id = r.id
  AND (l.code IS NULL OR l.code = '');

