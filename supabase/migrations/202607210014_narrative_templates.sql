-- ADDENDUM-003: official, versioned narrative templates. Text seeds arrive separately.
create table public.narrative_templates (
  id uuid primary key default gen_random_uuid(),
  content_type text not null check (content_type in (
    'entry_registered', 'contract_completed', 'contract_progress', 'contract_unresolved',
    'contract_expired', 'mission_completed', 'mission_expired', 'boss_discovered',
    'boss_weakened', 'boss_defeated', 'great_destination_progress',
    'great_destination_completed', 'guild_level_up', 'player_level_up',
    'achievement_unlocked', 'new_character_discovered', 'relationship_level_up',
    'new_tool_discovered', 'new_knowledge_discovered', 'market_purchase', 'system_milestone'
  )),
  slug text not null unique,
  title text not null,
  template_body text not null,
  variables text[] not null default '{}',
  language text not null default 'es-MX',
  version integer not null default 1 check (version > 0),
  status text not null check (status in ('activa', 'inactiva', 'archivada')),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.narrative_template_usage (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  template_id uuid not null references public.narrative_templates(id) on delete restrict,
  used_at timestamptz not null default now()
);

-- The invalid content_type_lookup expression proposed in the addendum is intentionally not used.
create index narrative_template_usage_recent_idx on public.narrative_template_usage (player_id, template_id, used_at desc);

create function public.bump_narrative_template_version() returns trigger language plpgsql as $$
begin new.version := old.version + 1; new.updated_at := now(); return new; end; $$;
create trigger bump_narrative_template_version_before_update before update on public.narrative_templates
for each row execute function public.bump_narrative_template_version();

create function public.prevent_narrative_template_usage_deletion() returns trigger language plpgsql as $$
begin raise exception 'narrative template usage is append-only'; end; $$;
create trigger prevent_narrative_template_usage_delete before delete on public.narrative_template_usage
for each row execute function public.prevent_narrative_template_usage_deletion();

alter table public.narrative_templates enable row level security;
alter table public.narrative_template_usage enable row level security;
create policy "players read narrative templates" on public.narrative_templates for select using (auth.uid() is not null);
create policy "players read own template usage" on public.narrative_template_usage for select using (player_id = auth.uid());
