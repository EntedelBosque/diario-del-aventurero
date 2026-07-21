-- CODEX-004: persistent, searchable world memory. Entities and historical events are append-only.
create table public.world_entities (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  entity_type text not null,
  canonical_name text not null,
  aliases text[] not null default '{}',
  category text,
  status text not null default 'activo',
  importance_level integer not null default 0 check (importance_level >= 0),
  observations text,
  discovery_event_id uuid not null references public.world_events(id) on delete restrict,
  discovered_at timestamptz not null,
  last_interaction_at timestamptz,
  merged_into_entity_id uuid references public.world_entities(id) on delete restrict,
  created_at timestamptz not null default now(),
  check (id <> merged_into_entity_id),
  unique (player_id, entity_type, canonical_name)
);

create table public.entity_history (
  id uuid primary key default gen_random_uuid(),
  entity_id uuid not null references public.world_entities(id) on delete restrict,
  source_event_id uuid references public.world_events(id) on delete restrict,
  change_type text not null,
  before_state jsonb,
  after_state jsonb not null,
  recorded_at timestamptz not null default now()
);

create table public.entity_relationships (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  from_entity_id uuid not null references public.world_entities(id) on delete restrict,
  to_entity_id uuid not null references public.world_entities(id) on delete restrict,
  relationship_type text not null,
  source_event_id uuid references public.world_events(id) on delete restrict,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_entity_id <> to_entity_id),
  unique (from_entity_id, to_entity_id, relationship_type)
);

create table public.locations (
  entity_id uuid primary key references public.world_entities(id) on delete restrict,
  category text not null,
  visit_count integer not null default 0 check (visit_count >= 0),
  first_visit_at timestamptz not null,
  last_visit_at timestamptz
);

create table public.knowledge (
  entity_id uuid primary key references public.world_entities(id) on delete restrict,
  category text not null,
  source text,
  last_used_at timestamptz
);

create table public.tools (
  entity_id uuid primary key references public.world_entities(id) on delete restrict,
  category text not null,
  first_used_at timestamptz not null,
  last_used_at timestamptz,
  usage_count integer not null default 0 check (usage_count >= 0)
);

create table public.objects (
  entity_id uuid primary key references public.world_entities(id) on delete restrict,
  category text,
  relevance_note text
);

create table public.organizations (
  entity_id uuid primary key references public.world_entities(id) on delete restrict,
  category text,
  last_interaction_at timestamptz
);

alter table public.characters
  add column entity_id uuid unique references public.world_entities(id) on delete restrict,
  add column status text not null default 'activo',
  add column observations text,
  add column last_interaction_at timestamptz;

create table public.event_details (
  world_event_id uuid primary key references public.world_events(id) on delete restrict,
  original_description text not null,
  rpg_version text,
  location_entity_id uuid references public.world_entities(id) on delete restrict,
  duration_minutes integer check (duration_minutes is null or duration_minutes >= 0),
  categories jsonb not null default '[]',
  experience_award_id uuid unique references public.experience_awards(id) on delete restrict
);

create table public.event_participants (
  world_event_id uuid not null references public.world_events(id) on delete restrict,
  entity_id uuid not null references public.world_entities(id) on delete restrict,
  primary key (world_event_id, entity_id)
);

create index world_entities_search_idx on public.world_entities (player_id, entity_type, canonical_name);
create index world_entities_aliases_idx on public.world_entities using gin (aliases);
create index world_entities_discovered_at_idx on public.world_entities (player_id, discovered_at desc);
create index entity_relationships_lookup_idx on public.entity_relationships (player_id, relationship_type, from_entity_id, to_entity_id);
create index entity_history_entity_idx on public.entity_history (entity_id, recorded_at desc);

create function public.prevent_world_memory_deletion() returns trigger
language plpgsql
as $$ begin raise exception 'world memory is append-only'; end; $$;

create trigger prevent_world_event_delete before delete on public.world_events
for each row execute function public.prevent_world_memory_deletion();
create trigger prevent_world_event_update before update on public.world_events
for each row execute function public.prevent_world_memory_deletion();
create trigger prevent_world_entity_delete before delete on public.world_entities
for each row execute function public.prevent_world_memory_deletion();
create trigger prevent_entity_history_delete before delete on public.entity_history
for each row execute function public.prevent_world_memory_deletion();

alter table public.world_entities enable row level security;
alter table public.entity_history enable row level security;
alter table public.entity_relationships enable row level security;
alter table public.locations enable row level security;
alter table public.knowledge enable row level security;
alter table public.tools enable row level security;
alter table public.objects enable row level security;
alter table public.organizations enable row level security;
alter table public.event_details enable row level security;
alter table public.event_participants enable row level security;

drop policy "players access own world events" on public.world_events;
drop policy "players access own characters" on public.characters;
drop policy "players access own relationships" on public.relationships;
create policy "players read own world events" on public.world_events for select using (player_id = auth.uid());
create policy "players read own characters" on public.characters for select using (player_id = auth.uid());
create policy "players read own relationships" on public.relationships for select using (player_id = auth.uid());

create policy "players read own entities" on public.world_entities for select using (player_id = auth.uid());
create policy "players read own entity history" on public.entity_history for select using (entity_id in (select id from public.world_entities where player_id = auth.uid()));
create policy "players read own entity relationships" on public.entity_relationships for select using (player_id = auth.uid());
create policy "players read own locations" on public.locations for select using (entity_id in (select id from public.world_entities where player_id = auth.uid()));
create policy "players read own knowledge" on public.knowledge for select using (entity_id in (select id from public.world_entities where player_id = auth.uid()));
create policy "players read own tools" on public.tools for select using (entity_id in (select id from public.world_entities where player_id = auth.uid()));
create policy "players read own objects" on public.objects for select using (entity_id in (select id from public.world_entities where player_id = auth.uid()));
create policy "players read own organizations" on public.organizations for select using (entity_id in (select id from public.world_entities where player_id = auth.uid()));
create policy "players read own event details" on public.event_details for select using (world_event_id in (select id from public.world_events where player_id = auth.uid()));
create policy "players read own event participants" on public.event_participants for select using (world_event_id in (select id from public.world_events where player_id = auth.uid()));
