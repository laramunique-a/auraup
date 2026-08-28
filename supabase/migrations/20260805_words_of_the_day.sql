-- Migration for words_of_the_day table
CREATE TABLE IF NOT EXISTS public.words_of_the_day (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word TEXT NOT NULL,
  phonetic TEXT,
  type TEXT,
  translation TEXT NOT NULL,
  definition TEXT NOT NULL,
  example TEXT NOT NULL,
  example_translation TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.words_of_the_day ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read words_of_the_day" ON public.words_of_the_day 
  FOR SELECT USING (true);

CREATE POLICY "Allow admin all words_of_the_day" ON public.words_of_the_day 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );
