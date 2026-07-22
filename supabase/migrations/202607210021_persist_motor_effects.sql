-- The Motor calculates deltas in TypeScript; this RPC only persists them atomically.
create table public.motor_runs (
  world_event_id uuid primary key references public.world_events(id) on delete restrict,
  player_id uuid not null references public.players(id) on delete cascade,
  rules_version text not null,
  effects jsonb not null,
  recorded_at timestamptz not null default now()
);

create or replace function public.persist_motor_effects(
  p_world_event_id uuid,
  p_player_id uuid,
  p_rules_version text,
  p_effects jsonb
) returns void language plpgsql security definer set search_path = public as $$
declare
  v_player public.players%rowtype;
  v_activity jsonb;
  v_record_id uuid;
  v_award_id uuid;
  v_guild jsonb;
  v_guild_progress public.player_guild_progress%rowtype;
begin
  if exists (select 1 from public.motor_runs where world_event_id = p_world_event_id) then return; end if;
  select * into v_player from public.players where id = p_player_id for update;
  if not found then raise exception 'player not found'; end if;
  insert into public.motor_runs (world_event_id, player_id, rules_version, effects) values (p_world_event_id, p_player_id, p_rules_version, p_effects);
  for v_activity in select value from jsonb_array_elements(coalesce(p_effects->'activities','[]'::jsonb)) loop
    insert into public.activity_progress_records (player_id, source_event_id, activity_scale, duration_minutes, classifications)
      values (p_player_id, p_world_event_id, v_activity->>'scale', (v_activity->>'durationMinutes')::integer, v_activity->'classifications')
      returning id into v_record_id;
    insert into public.experience_awards (player_id, activity_progress_record_id, base_xp, time_xp, people_xp, discovery_xp, bonus_xp, total_xp, rules_version)
      values (p_player_id, v_record_id, (v_activity->>'baseXp')::integer, (v_activity->>'timeXp')::integer, (v_activity->>'peopleXp')::integer, (v_activity->>'discoveryXp')::integer, (v_activity->>'bonusXp')::integer, (v_activity->>'totalXp')::integer, p_rules_version)
      returning id into v_award_id;
    for v_guild in select value from jsonb_array_elements(v_activity->'guildAwards') loop
      select * into v_guild_progress from public.player_guild_progress where player_id = p_player_id and guild_code = v_guild->>'guildCode' for update;
      if not found then raise exception 'guild progress not found'; end if;
      update public.player_guild_progress set experience = experience + (v_guild->>'experience')::integer, mastery = mastery + (v_guild->>'experience')::integer where player_id = p_player_id and guild_code = v_guild->>'guildCode' and version = v_guild_progress.version;
      if not found then raise exception 'guild optimistic lock conflict'; end if;
      insert into public.guild_experience_awards (player_id, experience_award_id, guild_code, experience) values (p_player_id, v_award_id, v_guild->>'guildCode', (v_guild->>'experience')::integer);
      insert into public.guild_history (player_id, guild_code, source_type, source_id, experience_awarded, mastery_awarded) values (p_player_id, v_guild->>'guildCode', 'evento', p_world_event_id, (v_guild->>'experience')::integer, (v_guild->>'experience')::integer);
    end loop;
  end loop;
  update public.players set experience = experience + coalesce((p_effects->>'playerExperienceDelta')::bigint, 0) where id = p_player_id and version = v_player.version;
  if not found then raise exception 'player optimistic lock conflict'; end if;
end; $$;

alter table public.motor_runs enable row level security;
create policy "players read own motor runs" on public.motor_runs for select using (player_id = auth.uid());
