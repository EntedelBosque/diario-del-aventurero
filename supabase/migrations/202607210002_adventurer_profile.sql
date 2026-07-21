-- CODEX-002 El Aventurero: persistent player profile and extensible progression data.
alter table public.players
  add column display_name text not null default 'Fernando',
  add column initial_title text not null default 'El Aventurero',
  add column character_class text not null default 'Aventurero',
  add column level integer not null default 1 check (level >= 1),
  add column experience bigint not null default 0 check (experience >= 0),
  add column state text not null default 'activo' check (state in ('activo', 'descansando', 'vacaciones', 'recuperacion', 'lesionado', 'enfermo')),
  add column started_at timestamptz;

create table public.stat_definitions (
  stat_key text primary key,
  display_name text not null,
  visibility text not null check (visibility in ('visible', 'hidden')),
  behavior text not null check (behavior in ('permanent', 'dynamic', 'derived')),
  is_active boolean not null default true
);

insert into public.stat_definitions (stat_key, display_name, visibility, behavior) values
  ('arte', 'Arte', 'visible', 'permanent'),
  ('tecnologia', 'Tecnologia', 'visible', 'permanent'),
  ('vitalidad', 'Vitalidad', 'visible', 'dynamic'),
  ('social', 'Social', 'visible', 'dynamic'),
  ('sabiduria', 'Sabiduria', 'visible', 'permanent'),
  ('disciplina', 'Disciplina', 'hidden', 'derived');

create table public.player_stats (
  player_id uuid not null references public.players(id) on delete cascade,
  stat_key text not null references public.stat_definitions(stat_key),
  value bigint not null default 0 check (value >= 0),
  last_activity_at timestamptz,
  grace_period_days integer check (grace_period_days is null or grace_period_days >= 0),
  updated_at timestamptz not null default now(),
  primary key (player_id, stat_key)
);

create table public.stat_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  stat_key text not null references public.stat_definitions(stat_key),
  previous_value bigint not null check (previous_value >= 0),
  new_value bigint not null check (new_value >= 0),
  world_event_id uuid references public.world_events(id) on delete set null,
  recorded_at timestamptz not null default now()
);

create table public.guilds (
  code text primary key,
  official_name text not null unique,
  primary_stat_key text not null references public.stat_definitions(stat_key),
  is_active boolean not null default true
);

insert into public.guilds (code, official_name, primary_stat_key) values
  ('arte', 'El Taller de los Escultores Eternos', 'arte'),
  ('tecnologia', 'La Forja del Acero del Futuro', 'tecnologia'),
  ('vitalidad', 'La Orden del Cuerpo Indomable', 'vitalidad'),
  ('social', 'La Hermandad de los Caminantes', 'social'),
  ('sabiduria', 'El Archivo de los Sabios Eternos', 'sabiduria');

create table public.player_guild_progress (
  player_id uuid not null references public.players(id) on delete cascade,
  guild_code text not null references public.guilds(code),
  mastery bigint not null default 0 check (mastery >= 0),
  title text,
  updated_at timestamptz not null default now(),
  primary key (player_id, guild_code)
);

create table public.characters (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  name text not null,
  alias text,
  role text,
  discovery_date date not null,
  created_at timestamptz not null default now(),
  unique (id, player_id)
);

create table public.relationships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  character_id uuid not null,
  affinity_score bigint not null default 0 check (affinity_score >= 0),
  discovery_date date not null,
  last_interaction_at timestamptz,
  shared_adventures integer not null default 0 check (shared_adventures >= 0),
  shared_time_minutes integer not null default 0 check (shared_time_minutes >= 0),
  importance_level integer not null default 0 check (importance_level >= 0),
  foreign key (character_id, player_id) references public.characters (id, player_id) on delete cascade,
  unique (player_id, character_id)
);

create function public.initialize_adventurer_progress() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_stats (player_id, stat_key)
    select new.id, stat_key from public.stat_definitions;
  insert into public.player_guild_progress (player_id, guild_code)
    select new.id, code from public.guilds where is_active;
  return new;
end;
$$;

create trigger initialize_adventurer_progress_after_insert
after insert on public.players
for each row execute function public.initialize_adventurer_progress();

create function public.set_adventurer_start_date() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.players
    set started_at = coalesce(started_at, new.occurred_at)
    where id = new.player_id;
  return new;
end;
$$;

create trigger set_adventurer_start_date_after_diary_entry
after insert on public.diary_entries
for each row execute function public.set_adventurer_start_date();

alter table public.stat_definitions enable row level security;
alter table public.player_stats enable row level security;
alter table public.stat_history enable row level security;
alter table public.guilds enable row level security;
alter table public.player_guild_progress enable row level security;
alter table public.characters enable row level security;
alter table public.relationships enable row level security;

create policy "read stat definitions" on public.stat_definitions for select using (auth.uid() is not null);
create policy "read guilds" on public.guilds for select using (auth.uid() is not null);
create policy "players access own stats" on public.player_stats for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "players access own stat history" on public.stat_history for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "players access own guild progress" on public.player_guild_progress for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "players access own characters" on public.characters for all using (player_id = auth.uid()) with check (player_id = auth.uid());
create policy "players access own relationships" on public.relationships for all using (player_id = auth.uid()) with check (player_id = auth.uid());
