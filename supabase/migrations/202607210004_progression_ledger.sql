-- CODEX-003: audit trail for deterministic XP and independent guild progression.
alter table public.player_guild_progress
  add column experience bigint not null default 0 check (experience >= 0),
  add column level integer not null default 1 check (level >= 1),
  add column rank text;

drop policy "players access own profile" on public.players;
create policy "players read own profile" on public.players for select using (id = auth.uid());

create table public.activity_progress_records (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  source_event_id uuid not null references public.world_events(id) on delete cascade,
  activity_scale text not null check (activity_scale in ('muy_pequena', 'pequena', 'media', 'importante', 'extraordinaria', 'historica')),
  duration_minutes integer not null check (duration_minutes >= 0),
  classifications jsonb not null,
  created_at timestamptz not null default now(),
  unique (player_id, source_event_id)
);

create table public.experience_awards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  activity_progress_record_id uuid not null unique references public.activity_progress_records(id) on delete cascade,
  base_xp integer not null check (base_xp >= 0),
  time_xp integer not null check (time_xp >= 0),
  people_xp integer not null check (people_xp >= 0),
  discovery_xp integer not null check (discovery_xp >= 0),
  bonus_xp integer not null check (bonus_xp >= 0),
  total_xp integer not null check (total_xp >= 0),
  rules_version text not null,
  awarded_at timestamptz not null default now()
);

create table public.guild_experience_awards (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  experience_award_id uuid not null references public.experience_awards(id) on delete cascade,
  guild_code text not null references public.guilds(code),
  experience integer not null check (experience >= 0),
  unique (experience_award_id, guild_code)
);

alter table public.activity_progress_records enable row level security;
alter table public.experience_awards enable row level security;
alter table public.guild_experience_awards enable row level security;

create policy "players read own activity progress" on public.activity_progress_records for select using (player_id = auth.uid());
create policy "players read own experience awards" on public.experience_awards for select using (player_id = auth.uid());
create policy "players read own guild experience awards" on public.guild_experience_awards for select using (player_id = auth.uid());
