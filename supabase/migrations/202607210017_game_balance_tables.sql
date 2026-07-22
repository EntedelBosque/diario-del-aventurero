-- Sprint E2E ticket 0: versioned balance is data, never a silent code default.
create table public.game_balance_tables (
  id uuid primary key default gen_random_uuid(),
  table_key text not null,
  version integer not null check (version > 0),
  status text not null check (status in ('activa', 'borrador', 'archivada')),
  payload jsonb not null,
  notes text,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  unique (table_key, version)
);

create index game_balance_tables_key_status_idx on public.game_balance_tables (table_key, status);

alter table public.game_balance_tables enable row level security;
create policy "players read active game balance" on public.game_balance_tables
  for select using (status = 'activa' and auth.uid() is not null);
