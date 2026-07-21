-- The first durable vertical slice: facts are stored even when the Oracle fails.
create table public.players (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.world_events (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  event_type text not null,
  schema_version integer not null check (schema_version > 0),
  rules_version text not null,
  payload jsonb not null,
  occurred_at timestamptz not null,
  recorded_at timestamptz not null default now()
);

create index world_events_player_occurred_at_idx on public.world_events (player_id, occurred_at desc);

create table public.diary_entries (
  id uuid primary key,
  player_id uuid not null references public.players(id) on delete cascade,
  idempotency_key text not null,
  body text not null check (char_length(body) between 1 and 10000),
  occurred_at timestamptz not null,
  submitted_at timestamptz not null,
  oracle_status text not null default 'pending' check (oracle_status in ('pending', 'accepted', 'rejected', 'failed')),
  created_at timestamptz not null default now(),
  unique (player_id, idempotency_key)
);

create table public.oracle_interpretations (
  diary_entry_id uuid primary key references public.diary_entries(id) on delete cascade,
  status text not null check (status in ('accepted', 'rejected', 'failed')),
  response jsonb,
  errors jsonb,
  created_at timestamptz not null default now(),
  check ((status = 'accepted' and response is not null) or (status in ('rejected', 'failed') and errors is not null))
);

alter table public.players enable row level security;
alter table public.world_events enable row level security;
alter table public.diary_entries enable row level security;
alter table public.oracle_interpretations enable row level security;

create policy "players access own profile" on public.players for all using (id = auth.uid()) with check (id = auth.uid());
create policy "players access own world events" on public.world_events for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "players access own diary entries" on public.diary_entries for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "players access own interpretations" on public.oracle_interpretations for all using (diary_entry_id in (select id from public.diary_entries where player_id = auth.uid())) with check (diary_entry_id in (select id from public.diary_entries where player_id = auth.uid()));
