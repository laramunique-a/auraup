-- Tabela para Decks Oficiais Padrões Administráveis

CREATE TABLE IF NOT EXISTS public.official_decks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Geral',
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  cards JSONB DEFAULT '[]'::jsonb
);

-- Habilitar RLS
ALTER TABLE public.official_decks ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
DROP POLICY IF EXISTS "Leitura pública de decks oficiais" ON public.official_decks;
CREATE POLICY "Leitura pública de decks oficiais" ON public.official_decks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestão total de decks oficiais" ON public.official_decks;
CREATE POLICY "Gestão total de decks oficiais" ON public.official_decks FOR ALL USING (true);
