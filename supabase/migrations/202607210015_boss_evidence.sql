-- ADDENDUM-003: append-only boss evidence; resets are temporal markers, never deletions.
create table public.boss_evidence_log (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid not null references public.bosses(id) on delete restrict,
  source_event_id uuid references public.world_events(id) on delete restrict,
  source_contract_id uuid references public.contracts(id) on delete restrict,
  points integer not null check (points > 0),
  recorded_at timestamptz not null default now(),
  check (source_event_id is not null or source_contract_id is not null)
);

create table public.boss_evidence_resets (
  id uuid primary key default gen_random_uuid(),
  boss_id uuid not null references public.bosses(id) on delete restrict,
  reset_reason text not null check (reset_reason in ('derrotado', 'archivado')),
  reset_at timestamptz not null default now()
);

create index boss_evidence_log_boss_idx on public.boss_evidence_log (boss_id, recorded_at desc);
create index boss_evidence_resets_boss_idx on public.boss_evidence_resets (boss_id, reset_at desc);

create function public.prevent_boss_evidence_deletion() returns trigger language plpgsql as $$
begin raise exception 'boss evidence is append-only'; end; $$;
create trigger prevent_boss_evidence_log_delete before delete on public.boss_evidence_log
for each row execute function public.prevent_boss_evidence_deletion();
create trigger prevent_boss_evidence_resets_delete before delete on public.boss_evidence_resets
for each row execute function public.prevent_boss_evidence_deletion();

alter table public.boss_evidence_log enable row level security;
alter table public.boss_evidence_resets enable row level security;
create policy "players read own boss evidence" on public.boss_evidence_log for select using (boss_id in (select id from public.bosses where player_id = auth.uid()));
create policy "players read own boss evidence resets" on public.boss_evidence_resets for select using (boss_id in (select id from public.bosses where player_id = auth.uid()));
