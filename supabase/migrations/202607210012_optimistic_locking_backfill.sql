-- Backfill: mutable tables created before the DEV Spec rule need optimistic locking.
alter table public.players add column if not exists updated_at timestamptz not null default now();
alter table public.characters add column if not exists updated_at timestamptz not null default now();
alter table public.relationships add column if not exists updated_at timestamptz not null default now();
alter table public.world_entities add column if not exists updated_at timestamptz not null default now();

alter table public.players add column if not exists version integer not null default 1 check (version > 0);
alter table public.player_stats add column if not exists version integer not null default 1 check (version > 0);
alter table public.player_guild_progress add column if not exists version integer not null default 1 check (version > 0);
alter table public.currency_wallets add column if not exists version integer not null default 1 check (version > 0);
alter table public.characters add column if not exists version integer not null default 1 check (version > 0);
alter table public.relationships add column if not exists version integer not null default 1 check (version > 0);
alter table public.world_entities add column if not exists version integer not null default 1 check (version > 0);
alter table public.guilds add column if not exists version integer not null default 1 check (version > 0);

create function public.bump_version_generic() returns trigger
language plpgsql
as $$
begin
  new.version := old.version + 1;
  if to_jsonb(new) ? 'updated_at' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger bump_players_version_before_update before update on public.players
for each row execute function public.bump_version_generic();
create trigger bump_player_stats_version_before_update before update on public.player_stats
for each row execute function public.bump_version_generic();
create trigger bump_player_guild_progress_version_before_update before update on public.player_guild_progress
for each row execute function public.bump_version_generic();
create trigger bump_currency_wallets_version_before_update before update on public.currency_wallets
for each row execute function public.bump_version_generic();
create trigger bump_characters_version_before_update before update on public.characters
for each row execute function public.bump_version_generic();
create trigger bump_relationships_version_before_update before update on public.relationships
for each row execute function public.bump_version_generic();
create trigger bump_world_entities_version_before_update before update on public.world_entities
for each row execute function public.bump_version_generic();
create trigger bump_guilds_version_before_update before update on public.guilds
for each row execute function public.bump_version_generic();
