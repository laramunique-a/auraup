-- ==============================================================================
-- Migração: Coluna Calculada cards_count em public.official_decks (AuraUP)
-- Data: 2026-11-11
-- ------------------------------------------------------------------------------
-- Contexto: Quando getOfficialDecks foi otimizado para não transferir a coluna
-- pesada `cards` (JSONB) na listagem, os baralhos passavam a exibir "0 cards".
-- Esta coluna gerada automaticamente pelo PostgreSQL mantém a contagem real e
-- exata de cards sem trafegar o conteúdo dos cards pela rede.
-- ==============================================================================

ALTER TABLE public.official_decks
  ADD COLUMN IF NOT EXISTS cards_count INTEGER
  GENERATED ALWAYS AS (
    CASE
      WHEN jsonb_typeof(cards) = 'array' THEN jsonb_array_length(cards)
      ELSE 0
    END
  ) STORED;

