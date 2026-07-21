-- CODEX-002 revision: Discipline is a visible, derived statistic owned by the Game Engine.
update public.stat_definitions
  set visibility = 'visible', behavior = 'derived'
  where stat_key = 'disciplina';

alter table public.player_stats
  add column derived_calculated_at timestamptz;

alter table public.player_stats
  add constraint discipline_value_range check (stat_key <> 'disciplina' or value between 0 and 100);

update public.player_stats
  set value = 50, derived_calculated_at = now(), updated_at = now()
  where stat_key = 'disciplina';

create table public.discipline_calculations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  calculated_for date not null,
  previous_value integer not null check (previous_value between 0 and 100),
  new_value integer not null check (new_value between 0 and 100),
  rules_version text not null,
  factors jsonb not null,
  calculated_at timestamptz not null default now(),
  unique (player_id, calculated_for)
);

create or replace function public.initialize_adventurer_progress() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_stats (player_id, stat_key, value, derived_calculated_at)
    select new.id, stat_key,
      case when stat_key = 'disciplina' then 50 else 0 end,
      case when stat_key = 'disciplina' then now() else null end
    from public.stat_definitions;
  insert into public.player_guild_progress (player_id, guild_code)
    select new.id, code from public.guilds where is_active;
  return new;
end;
$$;

alter table public.discipline_calculations enable row level security;

drop policy "players access own stats" on public.player_stats;
drop policy "players access own stat history" on public.stat_history;
create policy "players read own stats" on public.player_stats for select using (player_id = auth.uid());
create policy "players read own stat history" on public.stat_history for select using (player_id = auth.uid());
create policy "players read own discipline calculations" on public.discipline_calculations for select using (player_id = auth.uid());
