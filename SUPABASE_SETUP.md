# FinQuest — Setup do Supabase

## 1. Criar projeto no Supabase

1. Acesse **https://supabase.com** → clique em **Start your project**
2. Crie uma conta gratuita (ou entre com GitHub)
3. Clique em **New project**
4. Preencha:
   - **Name:** finquest
   - **Database Password:** escolha uma senha forte (guarde!)
   - **Region:** South America (São Paulo)
5. Clique em **Create new project** — aguarde ~2 minutos

---

## 2. Criar as tabelas (SQL)

No painel do Supabase, vá em **SQL Editor** → **New query** e execute cada bloco abaixo:

### Tabela: profiles
```sql
create table profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text,
  xp integer not null default 0,
  cash numeric not null default 100000,
  created_at timestamptz not null default now()
);

-- Políticas de segurança
alter table profiles enable row level security;

-- Cada usuário lê/edita só o próprio perfil
create policy "Usuário vê próprio perfil"
  on profiles for select using (auth.uid() = id);

create policy "Usuário atualiza próprio perfil"
  on profiles for update using (auth.uid() = id);

create policy "Usuário cria próprio perfil"
  on profiles for insert with check (auth.uid() = id);

-- Admin pode ver todos os perfis (qualquer usuário autenticado pode listar)
create policy "Admin vê todos os perfis"
  on profiles for select using (auth.role() = 'authenticated');
```

### Tabela: portfolio
```sql
create table portfolio (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  ticker text not null,
  qty integer not null default 0,
  avg_price numeric not null default 0,
  unique(user_id, ticker)
);

alter table portfolio enable row level security;

create policy "Usuário gerencia própria carteira"
  on portfolio for all using (auth.uid() = user_id);
```

### Tabela: trades
```sql
create table trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  ticker text not null,
  qty integer not null,
  price numeric not null,
  type text not null check (type in ('buy', 'sell')),
  profit numeric,
  created_at timestamptz not null default now()
);

alter table trades enable row level security;

create policy "Usuário gerencia próprias ordens"
  on trades for all using (auth.uid() = user_id);
```

### Tabela: progress
```sql
create table progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  course_id text not null,
  module_id text not null,
  unique(user_id, course_id, module_id)
);

alter table progress enable row level security;

create policy "Usuário gerencia próprio progresso"
  on progress for all using (auth.uid() = user_id);
```

Execute cada bloco separadamente. Você verá **"Success. No rows returned"** em cada um — isso é normal.

---

## 3. Pegar as credenciais

1. No painel do Supabase, clique em **Settings** (ícone de engrenagem) → **API**
2. Copie:
   - **Project URL** → ex: `https://abcdefgh.supabase.co`
   - **anon public** key → começa com `eyJhbGci...`

---

## 4. Configurar variáveis de ambiente

### Para rodar local:
Crie um arquivo `.env` na raiz do projeto:
```
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Para o Vercel (produção):
1. No painel do Vercel, vá em seu projeto → **Settings** → **Environment Variables**
2. Adicione as duas variáveis:
   - `VITE_SUPABASE_URL` = sua URL
   - `VITE_SUPABASE_ANON_KEY` = sua chave anon

---

## 5. Testar localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:5173`, crie uma conta e você já deverá ver o usuário no Supabase em **Table Editor → profiles**.

---

## 6. Deploy no Vercel

1. Suba o código para um repositório GitHub
2. No Vercel, importe o repositório
3. Adicione as variáveis de ambiente (passo 4 acima)
4. Clique em **Deploy**

---

## O que fica salvo no Supabase

| Ação do usuário | Salvo em |
|---|---|
| Criar conta | `profiles` (nome, email, xp=0, cash=100000) |
| Comprar ação | `portfolio` (upsert) + `trades` (insert) + `profiles.cash` e `xp` |
| Vender ação | `portfolio` (upsert/delete) + `trades` + `profiles.cash` e `xp` |
| Completar módulo | `progress` (insert) + `profiles.xp` |
| Fazer login | Carrega tudo automaticamente |
