-- ADDENDUM-003: globally unique official narrative names. Similarity checks run in the Motor.
create extension if not exists pg_trgm;

create table public.official_name_registry (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('gremio', 'boss', 'gran_destino', 'titulo', 'alias_rpg', 'objeto', 'campana', 'mercado')),
  entity_id uuid not null,
  canonical_name text not null,
  normalized_name text not null unique,
  created_at timestamptz not null default now()
);

create index official_name_registry_trgm_idx on public.official_name_registry using gin (normalized_name gin_trgm_ops);

alter table public.official_name_registry enable row level security;
create policy "players read official name registry" on public.official_name_registry for select using (auth.uid() is not null);
