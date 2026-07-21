-- CODEX-006: persistent real-life obstacles with Motor-only damage and immutable history.
create table public.bosses (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  name text not null,
  description text not null,
  categories text[] not null check (cardinality(categories) > 0),
  level integer not null check (level >= 1),
  max_health integer not null check (max_health > 0),
  current_health integer not null check (current_health between 0 and max_health),
  difficulty text not null check (difficulty in ('normal', 'epico', 'legendario', 'mitico')),
  state text not null check (state in ('descubierto', 'activo', 'debilitado', 'derrotado', 'archivado')),
  appeared_at timestamptz not null,
  estimated_at timestamptz,
  defeated_at timestamptz,
  rewards jsonb not null,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, name)
);

create table public.boss_campaigns (
  boss_id uuid not null references public.bosses(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  primary key (boss_id, contract_id)
);

create table public.boss_contracts (
  boss_id uuid not null references public.bosses(id) on delete restrict,
  contract_id uuid not null references public.contracts(id) on delete restrict,
  primary key (boss_id, contract_id)
);

create table public.boss_damage_history (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid not null references public.bosses(id) on delete restrict,
  world_event_id uuid references public.world_events(id) on delete restrict,
  contract_id uuid references public.contracts(id) on delete restrict,
  damage integer not null check (damage > 0),
  previous_health integer not null check (previous_health >= 0),
  new_health integer not null check (new_health >= 0),
  rules_version text not null,
  recorded_at timestamptz not null default now(),
  check (world_event_id is not null or contract_id is not null),
  check (new_health <= previous_health)
);

create table public.boss_history (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid not null references public.bosses(id) on delete restrict,
  previous_state text,
  next_state text not null,
  reason text,
  recorded_at timestamptz not null default now()
);

create index bosses_player_state_idx on public.bosses (player_id, state, updated_at desc);
create index bosses_categories_idx on public.bosses using gin (categories);
create index boss_damage_history_boss_idx on public.boss_damage_history (boss_id, recorded_at desc);

create function public.bump_boss_version() returns trigger language plpgsql as $$
begin new.version := old.version + 1; new.updated_at := now(); return new; end; $$;
create trigger bump_boss_version_before_update before update on public.bosses
for each row execute function public.bump_boss_version();

create function public.prevent_boss_history_deletion() returns trigger language plpgsql as $$
begin raise exception 'boss history is append-only'; end; $$;
create trigger prevent_boss_damage_delete before delete on public.boss_damage_history
for each row execute function public.prevent_boss_history_deletion();
create trigger prevent_boss_history_delete before delete on public.boss_history
for each row execute function public.prevent_boss_history_deletion();

alter table public.bosses enable row level security;
alter table public.boss_campaigns enable row level security;
alter table public.boss_contracts enable row level security;
alter table public.boss_damage_history enable row level security;
alter table public.boss_history enable row level security;

create policy "players read own bosses" on public.bosses for select using (player_id = auth.uid());
create policy "players read own boss campaigns" on public.boss_campaigns for select using (boss_id in (select id from public.bosses where player_id = auth.uid()));
create policy "players read own boss contracts" on public.boss_contracts for select using (boss_id in (select id from public.bosses where player_id = auth.uid()));
create policy "players read own boss damage" on public.boss_damage_history for select using (boss_id in (select id from public.bosses where player_id = auth.uid()));
create policy "players read own boss history" on public.boss_history for select using (boss_id in (select id from public.bosses where player_id = auth.uid()));
