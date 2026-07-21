-- CODEX-007: Motor-owned virtual currency, immutable ledger, and personal market.
create table public.currency_wallets (
  player_id uuid not null references public.players(id) on delete cascade,
  currency_code text not null default 'monedas_aventurero',
  balance bigint not null default 0 check (balance >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, currency_code)
);

create table public.currency_transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  currency_code text not null default 'monedas_aventurero',
  transaction_type text not null check (transaction_type in ('acreditacion', 'canje')),
  amount bigint not null check (amount > 0),
  balance_after bigint not null check (balance_after >= 0),
  source_type text not null check (source_type in ('contrato_completado', 'boss_derrotado', 'gran_destino_completado', 'obra_magna', 'evento_especial', 'logro', 'bonificacion_motor', 'mercado')),
  source_id uuid,
  idempotency_key text not null,
  recorded_at timestamptz not null default now(),
  unique (player_id, idempotency_key)
);

create table public.market_rewards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  name text not null,
  description text not null,
  cost bigint not null check (cost > 0),
  category text not null,
  status text not null check (status in ('activa', 'inactiva', 'archivada')),
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(trim(name)) > 0 and char_length(trim(description)) > 0)
);

create table public.market_redemptions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  market_reward_id uuid not null references public.market_rewards(id) on delete restrict,
  currency_transaction_id uuid not null unique references public.currency_transactions(id) on delete restrict,
  idempotency_key text not null,
  redeemed_at timestamptz not null default now(),
  unique (player_id, idempotency_key)
);

create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create table public.player_achievements (
  player_id uuid not null references public.players(id) on delete cascade,
  achievement_id uuid not null references public.achievements(id) on delete restrict,
  source_event_id uuid references public.world_events(id) on delete restrict,
  awarded_at timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

create table public.player_titles (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  title text not null,
  source_event_id uuid references public.world_events(id) on delete restrict,
  awarded_at timestamptz not null default now(),
  unique (player_id, title)
);

insert into public.currency_wallets (player_id)
  select id from public.players
  on conflict do nothing;

create function public.initialize_adventurer_wallet() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.currency_wallets (player_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger initialize_adventurer_wallet_after_insert
after insert on public.players
for each row execute function public.initialize_adventurer_wallet();

create function public.bump_market_reward_version() returns trigger language plpgsql as $$
begin new.version := old.version + 1; new.updated_at := now(); return new; end; $$;
create trigger bump_market_reward_version_before_update before update on public.market_rewards
for each row execute function public.bump_market_reward_version();

create index currency_transactions_player_idx on public.currency_transactions (player_id, recorded_at desc);
create index market_rewards_player_status_idx on public.market_rewards (player_id, status, category);

create function public.prevent_economy_history_deletion() returns trigger language plpgsql as $$
begin raise exception 'economy history is append-only'; end; $$;
create trigger prevent_currency_transaction_delete before delete on public.currency_transactions
for each row execute function public.prevent_economy_history_deletion();
create trigger prevent_market_redemption_delete before delete on public.market_redemptions
for each row execute function public.prevent_economy_history_deletion();

alter table public.currency_wallets enable row level security;
alter table public.currency_transactions enable row level security;
alter table public.market_rewards enable row level security;
alter table public.market_redemptions enable row level security;
alter table public.achievements enable row level security;
alter table public.player_achievements enable row level security;
alter table public.player_titles enable row level security;

create policy "players read own wallet" on public.currency_wallets for select using (player_id = auth.uid());
create policy "players read own transactions" on public.currency_transactions for select using (player_id = auth.uid());
create policy "players read own market rewards" on public.market_rewards for select using (player_id = auth.uid());
create policy "players read own redemptions" on public.market_redemptions for select using (player_id = auth.uid());
create policy "players read achievements" on public.achievements for select using (auth.uid() is not null);
create policy "players read own achievements" on public.player_achievements for select using (player_id = auth.uid());
create policy "players read own titles" on public.player_titles for select using (player_id = auth.uid());
