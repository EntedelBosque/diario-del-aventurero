-- CODEX-009: deterministic Director observations and proposals; only the Motor executes them.
create table public.director_observations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  cadence text not null check (cadence in ('evento', 'diaria', 'semanal', 'mensual')),
  snapshot jsonb not null,
  rules_version text not null,
  observed_at timestamptz not null default now()
);

create table public.director_proposals (
  id uuid primary key default gen_random_uuid(),
  observation_id uuid not null references public.director_observations(id) on delete restrict,
  proposal_type text not null check (proposal_type in ('reduce_load', 'recovery_contract', 'balance_contract', 'boss_review', 'seasonal_event_review')),
  payload jsonb not null,
  status text not null default 'propuesta' check (status in ('propuesta', 'ejecutada', 'descartada')),
  executed_event_id uuid references public.world_events(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index director_observations_player_idx on public.director_observations (player_id, observed_at desc);
create index director_proposals_status_idx on public.director_proposals (status, created_at desc);

create function public.prevent_director_observation_deletion() returns trigger language plpgsql as $$
begin raise exception 'director observations are append-only'; end; $$;
create trigger prevent_director_observation_delete before delete on public.director_observations
for each row execute function public.prevent_director_observation_deletion();
create trigger prevent_director_proposal_delete before delete on public.director_proposals
for each row execute function public.prevent_director_observation_deletion();

create function public.bump_director_proposal_version() returns trigger language plpgsql as $$
begin new.version := old.version + 1; return new; end; $$;
create trigger bump_director_proposal_version_before_update before update on public.director_proposals
for each row execute function public.bump_director_proposal_version();

alter table public.director_observations enable row level security;
alter table public.director_proposals enable row level security;
create policy "players read own director observations" on public.director_observations for select using (player_id = auth.uid());
create policy "players read own director proposals" on public.director_proposals for select using (observation_id in (select id from public.director_observations where player_id = auth.uid()));
