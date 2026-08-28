-- Trigger automático para criar perfis no Supabase na tabela public.profiles

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nickname, role, avatar_id, xp, coins, streak, is_active)
  VALUES (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    'user',
    'avatar_1',
    0,
    0,
    0,
    true
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger disparado após qualquer cadastro na auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Políticas RLS permissivas para a aplicação
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura de perfis" ON public.profiles;
CREATE POLICY "Leitura de perfis" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inserção de perfis" ON public.profiles;
CREATE POLICY "Inserção de perfis" ON public.profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Atualização de perfis" ON public.profiles;
CREATE POLICY "Atualização de perfis" ON public.profiles FOR UPDATE USING (true);
