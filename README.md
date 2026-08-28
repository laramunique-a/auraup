# Uply — Flashcards com Repetição Espaçada

PWA de estudo com algoritmo SM-2, inspirado no Anki. Dark mode, minimalista, pronto para deploy na Vercel.

## 🚀 Rodando localmente

```bash
# 1. Instalar dependências
npm install --legacy-peer-deps

# 2. Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:5173`

> Os dados são armazenados no **localStorage** do navegador. Nenhum backend necessário para rodar localmente.

---

## 🗄️ Migração para Supabase (quando disponível)

### 1. Criar projeto no Supabase
Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → New Project.

### 2. Executar o schema SQL
No SQL Editor do Supabase, execute:

```sql
-- Habilitar UUID
create extension if not exists "pgcrypto";

-- Baralhos
create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamptz default now()
);

-- Cards
create table cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid references decks(id) on delete cascade not null,
  front text not null,
  back text not null,
  created_at timestamptz default now()
);

-- Reviews (repetição espaçada)
create table reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  card_id uuid references cards(id) on delete cascade not null,
  repetitions int default 0,
  interval int default 1,
  ease_factor float default 2.5,
  due_date date default current_date,
  last_reviewed timestamptz,
  unique(user_id, card_id)
);

-- RLS
alter table decks enable row level security;
alter table cards enable row level security;
alter table reviews enable row level security;

create policy "Users see own decks" on decks for all using (auth.uid() = user_id);
create policy "Users see cards of own decks" on cards for all using (
  exists (select 1 from decks where decks.id = cards.deck_id and decks.user_id = auth.uid())
);
create policy "Users see own reviews" on reviews for all using (auth.uid() = user_id);
```

### 3. Configurar variáveis de ambiente
Edite o arquivo `.env.local`:

```env
VITE_LOCAL_MODE=false
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key
```

---

## 🌐 Deploy na Vercel

### 1. Subir no GitHub
```bash
git init
git add .
git commit -m "feat: Uply PWA inicial"
git branch -M main
git remote add origin https://github.com/seu-usuario/uply.git
git push -u origin main
```

### 2. Conectar na Vercel
1. Acesse [vercel.com](https://vercel.com) → Add New Project
2. Importe seu repositório GitHub
3. Framework detectado automaticamente: **Vite**
4. Build command: `npm run build`
5. Output directory: `dist`

### 3. Variáveis de ambiente na Vercel
No painel do projeto → Settings → Environment Variables:

| Nome | Valor |
|------|-------|
| `VITE_LOCAL_MODE` | `false` |
| `VITE_SUPABASE_URL` | `https://xxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` |

---

## 📁 Estrutura do projeto

```
src/
  components/
    layout/    → Navbar
    study/     → FlashCard (flip animation)
    ui/        → Button, Modal, Toast, EmptyState
  contexts/    → AuthContext
  hooks/       → useDecks, useCards, useStudySession
  lib/         → sm2.ts (algoritmo SM-2)
  pages/       → AuthPage, DashboardPage, DeckPage, StudyPage
  services/    → auth, deck, card, review, storage
  types/       → index.ts
```

## 🧠 Algoritmo SM-2

| Resposta | Repetições | Intervalo |
|----------|-----------|----------|
| Errei    | Reset (0) | 1 dia    |
| Difícil  | +1        | Cresce devagar |
| Fácil    | +1        | × ease_factor (padrão 2.5) |

## ✅ Funcionalidades

- [x] Autenticação (login/cadastro local ou Supabase)
- [x] Dashboard com estatísticas
- [x] Criar/editar/excluir baralhos
- [x] Criar/editar/excluir flashcards
- [x] Sessão de estudo com repetição espaçada (SM-2)
- [x] Animação de virar card
- [x] PWA (instalável no celular)
- [x] Dark mode
- [x] Pronto para deploy na Vercel
