-- CODEX-005: every objective is a contract, with immutable history and evidence.
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  parent_contract_id uuid references public.contracts(id) on delete restrict,
  contract_type text not null check (contract_type in ('diario', 'semanal', 'mensual', 'campana', 'gran_destino', 'obra_magna', 'especial', 'recuperacion', 'dinamico')),
  objective text not null check (char_length(trim(objective)) > 0),
  state text not null check (state in ('disponible', 'activo', 'completado', 'fallido', 'expirado', 'cancelado', 'archivado')),
  difficulty text not null check (difficulty in ('muy_facil', 'facil', 'normal', 'dificil', 'heroico', 'legendario')),
  priority text not null check (priority in ('baja', 'media', 'alta', 'critica')),
  categories text[] not null check (cardinality(categories) > 0),
  origin text not null check (origin in ('manual', 'motor')),
  rewards jsonb not null,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (expires_at > starts_at)
);

create table public.contract_history (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete restrict,
  previous_state text,
  next_state text not null,
  reason text,
  rules_version text not null,
  recorded_at timestamptz not null default now()
);

create table public.contract_evidence (
  contract_id uuid not null references public.contracts(id) on delete restrict,
  world_event_id uuid not null references public.world_events(id) on delete restrict,
  rationale text,
  validated_at timestamptz not null default now(),
  primary key (contract_id, world_event_id)
);

create index contracts_player_display_idx on public.contracts (player_id, state, priority, expires_at);
create index contracts_categories_idx on public.contracts using gin (categories);
create index contract_history_contract_idx on public.contract_history (contract_id, recorded_at desc);

create function public.prevent_contract_history_deletion() returns trigger
language plpgsql
as $$ begin raise exception 'contract history is append-only'; end; $$;

create trigger prevent_contract_history_delete before delete on public.contract_history
for each row execute function public.prevent_contract_history_deletion();

alter table public.contracts enable row level security;
alter table public.contract_history enable row level security;
alter table public.contract_evidence enable row level security;

create policy "players read own contracts" on public.contracts for select using (player_id = auth.uid());
create policy "players read own contract history" on public.contract_history for select using (contract_id in (select id from public.contracts where player_id = auth.uid()));
create policy "players read own contract evidence" on public.contract_evidence for select using (contract_id in (select id from public.contracts where player_id = auth.uid()));
