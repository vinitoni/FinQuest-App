-- ============================================================
-- FinQuest: nova estrutura de DUELOS (carteiras independentes)
-- ------------------------------------------------------------
-- Cada duelo tem 2 carteiras independentes de R$100.000.
-- Fluxo: criador abre (status 'open') -> oponente aceita (vira
-- 'active' e começa a contar o tempo) -> os dois negociam ações
-- livremente -> no fim ('done') vence quem valorizou mais (%).
--
-- ATENÇÃO: isto APAGA a tabela duels antiga e seus dados de teste.
-- Rode no Supabase: SQL Editor -> New query -> cole tudo -> Run.
-- ============================================================

drop table if exists duels cascade;

create table duels (
  id uuid primary key default gen_random_uuid(),

  creator_id        uuid not null references auth.users(id) on delete cascade,
  creator_name      text,
  opponent_id       uuid references auth.users(id) on delete cascade,
  opponent_name     text,

  duration_label    text   not null,         -- ex: "1 semana"
  duration_ms       bigint not null,         -- duração em milissegundos
  status            text   not null default 'open',  -- open | active | done

  started_at        timestamptz,             -- definido quando o oponente aceita
  end_at            timestamptz,             -- started_at + duration_ms

  -- carteiras independentes (começam com 100k em caixa, sem ações)
  creator_cash      numeric not null default 100000,
  opponent_cash     numeric not null default 100000,
  creator_portfolio jsonb   not null default '{}'::jsonb,  -- { TICKER: { qty, avgPrice } }
  opponent_portfolio jsonb  not null default '{}'::jsonb,

  -- resultado final
  creator_return    numeric,
  opponent_return   numeric,
  winner_id         uuid,
  creator_awarded   boolean default false,   -- XP já creditado ao criador?
  opponent_awarded  boolean default false,

  created_at        timestamptz not null default now()
);

alter table duels enable row level security;

-- Qualquer usuário autenticado pode ver os duelos (lobby aberto + seus duelos).
create policy "duels_select" on duels
  for select using (auth.role() = 'authenticated');

-- Só cria duelo em nome próprio.
create policy "duels_insert" on duels
  for insert with check (auth.uid() = creator_id);

-- Pode atualizar: o criador, o oponente, ou qualquer um aceitando um duelo aberto.
create policy "duels_update" on duels
  for update
  using (
    auth.uid() = creator_id
    or auth.uid() = opponent_id
    or (status = 'open' and opponent_id is null)
  )
  with check (true);

-- O criador pode cancelar (deletar) um duelo ainda aberto.
create policy "duels_delete" on duels
  for delete using (auth.uid() = creator_id);

create index duels_status_idx on duels (status);
create index duels_creator_idx on duels (creator_id);
create index duels_opponent_idx on duels (opponent_id);
