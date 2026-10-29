-- ==============================================================================
-- Migração: Índices de Performance e Redução de Leitura em Disco (AuraUP)
-- ------------------------------------------------------------------------------
-- Contexto: As colunas de chave estrangeira (deck_id, user_id, card_id) não
-- possuíam índices secundários, forçando o PostgreSQL a realizar varreduras
-- sequenciais completas (seq_scans) na tabela public.cards (150 MB) a cada
-- abertura de baralho ou revisão.
-- Esta migração é 100% aditiva e segura (não altera nem remove nenhum dado).
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_decks_user_id
  ON public.decks (user_id);

CREATE INDEX IF NOT EXISTS idx_cards_deck_id
  ON public.cards (deck_id);

CREATE INDEX IF NOT EXISTS idx_cards_deck_id_created_at
  ON public.cards (deck_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON public.reviews (user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_card_id
  ON public.reviews (card_id);

CREATE INDEX IF NOT EXISTS idx_reviews_user_card
  ON public.reviews (user_id, card_id);
