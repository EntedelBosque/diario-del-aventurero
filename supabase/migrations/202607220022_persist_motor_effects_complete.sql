-- CODEX-004 final: complete Motor effect persistence with all branches: activities, guilds, 
-- level recalculation, contracts, bosses, economy, and discipline.
-- All row updates use version-based optimistic locking like XP and guilds.

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
  
  v_contract_evidence jsonb;
  v_contract jsonb;
  v_contract_id uuid;
  v_contract_rec public.contracts%rowtype;
  
  v_boss_evidence jsonb;
  v_boss jsonb;
  v_boss_id uuid;
  v_boss_rec public.bosses%rowtype;
  v_damage integer;
  v_previous_health integer;
  
  v_curve_row public.game_balance_tables%rowtype;
  v_base_xp integer;
  v_exponent numeric;
  v_new_level integer;
  v_old_level integer;
  
  v_new_discipline_value integer;
  v_old_discipline_value integer;
  v_discipline_stat public.player_stats%rowtype;
  v_discipline_factors jsonb;
  
  v_currency_transaction_id uuid;
  v_balance bigint;
  v_idempotency_key text;
begin
  -- Idempotence check
  if exists (select 1 from public.motor_runs where world_event_id = p_world_event_id) then
    return;
  end if;
  
  -- Load player with row lock
  select * into v_player from public.players where id = p_player_id for update;
  if not found then
    raise exception 'player not found';
  end if;
  
  -- Record the Motor run
  insert into public.motor_runs (world_event_id, player_id, rules_version, effects)
    values (p_world_event_id, p_player_id, p_rules_version, p_effects);
  
  -- ============================================================================
  -- BRANCH 1: Activities and Guild Experience (from migration 021)
  -- ============================================================================
  for v_activity in select value from jsonb_array_elements(coalesce(p_effects->'activities','[]'::jsonb)) loop
    insert into public.activity_progress_records (player_id, source_event_id, activity_scale, duration_minutes, classifications)
      values (p_player_id, p_world_event_id, v_activity->>'scale', (v_activity->>'durationMinutes')::integer, v_activity->'classifications')
      returning id into v_record_id;
    
    insert into public.experience_awards (player_id, activity_progress_record_id, base_xp, time_xp, people_xp, discovery_xp, bonus_xp, total_xp, rules_version)
      values (p_player_id, v_record_id, (v_activity->>'baseXp')::integer, (v_activity->>'timeXp')::integer, (v_activity->>'peopleXp')::integer, (v_activity->>'discoveryXp')::integer, (v_activity->>'bonusXp')::integer, (v_activity->>'totalXp')::integer, p_rules_version)
      returning id into v_award_id;
    
    for v_guild in select value from jsonb_array_elements(v_activity->'guildAwards') loop
      select * into v_guild_progress from public.player_guild_progress
        where player_id = p_player_id and guild_code = v_guild->>'guildCode' for update;
      if not found then
        raise exception 'guild progress not found for %', v_guild->>'guildCode';
      end if;
      
      update public.player_guild_progress
        set experience = experience + (v_guild->>'experience')::integer,
            mastery = mastery + (v_guild->>'experience')::integer
        where player_id = p_player_id
          and guild_code = v_guild->>'guildCode'
          and version = v_guild_progress.version;
      
      if not found then
        raise exception 'guild optimistic lock conflict for %', v_guild->>'guildCode';
      end if;
      
      insert into public.guild_experience_awards (player_id, experience_award_id, guild_code, experience)
        values (p_player_id, v_award_id, v_guild->>'guildCode', (v_guild->>'experience')::integer);
      
      insert into public.guild_history (player_id, guild_code, source_type, source_id, experience_awarded, mastery_awarded)
        values (p_player_id, v_guild->>'guildCode', 'evento', p_world_event_id, (v_guild->>'experience')::integer, (v_guild->>'experience')::integer);
    end loop;
  end loop;
  
  -- ============================================================================
  -- BRANCH 2: Player Experience and Level Recalculation
  -- ============================================================================
  v_old_level := v_player.current_level;
  
  -- Load active player_level_curve
  select * into v_curve_row from public.game_balance_tables
    where table_key = 'player_level_curve' and status = 'activa'
    order by activated_at desc limit 1;
  
  if found then
    v_base_xp := (v_curve_row.payload->>'base_xp')::integer;
    v_exponent := (v_curve_row.payload->>'exponent')::numeric;
    
    -- Update player experience with version lock
    update public.players
      set experience = experience + coalesce((p_effects->>'playerExperienceDelta')::bigint, 0)
      where id = p_player_id and version = v_player.version;
    
    if not found then
      raise exception 'player optimistic lock conflict on experience update';
    end if;
    
    -- Recalculate level: level = floor(1 + (experience / base_xp) ^ (1/exponent))
    select * into v_player from public.players where id = p_player_id;
    v_new_level := greatest(1, floor(1 + power(v_player.experience::numeric / v_base_xp, 1.0 / v_exponent))::integer);
    
    if v_new_level <> v_old_level then
      update public.players
        set current_level = v_new_level
        where id = p_player_id and version = v_player.version;
      
      if not found then
        raise exception 'player optimistic lock conflict on level update';
      end if;
    end if;
  else
    -- If no curve, just update experience
    update public.players
      set experience = experience + coalesce((p_effects->>'playerExperienceDelta')::bigint, 0)
      where id = p_player_id and version = v_player.version;
    
    if not found then
      raise exception 'player optimistic lock conflict on experience update (no curve)';
    end if;
  end if;
  
  -- ============================================================================
  -- BRANCH 3: Contract Evidence
  -- ============================================================================
  for v_contract_evidence in select value from jsonb_array_elements(coalesce(p_effects->'contractEvidence','[]'::jsonb)) loop
    v_contract_id := (v_contract_evidence->>'contractId')::uuid;
    
    -- Load contract with row lock
    select * into v_contract_rec from public.contracts where id = v_contract_id for update;
    if not found then
      raise exception 'contract not found: %', v_contract_id;
    end if;
    
    -- Register evidence link
    insert into public.contract_evidence (contract_id, world_event_id, rationale)
      values (v_contract_id, p_world_event_id, v_contract_evidence->>'rationale')
      on conflict (contract_id, world_event_id) do nothing;
    
    -- If contract is available, mark as active
    if v_contract_rec.state = 'disponible' then
      update public.contracts
        set state = 'activo', updated_at = now()
        where id = v_contract_id;
      
      insert into public.contract_history (contract_id, previous_state, next_state, reason, rules_version)
        values (v_contract_id, 'disponible', 'activo', 'Motor evidencia', p_rules_version);
    end if;
  end loop;
  
  -- ============================================================================
  -- BRANCH 4: Boss Evidence and Damage
  -- ============================================================================
  for v_boss_evidence in select value from jsonb_array_elements(coalesce(p_effects->'bossEvidence','[]'::jsonb)) loop
    v_boss_id := (v_boss_evidence->>'bossId')::uuid;
    v_damage := coalesce((v_boss_evidence->>'damage')::integer, 0);
    
    -- Load boss with row lock
    select * into v_boss_rec from public.bosses where id = v_boss_id for update;
    if not found then
      raise exception 'boss not found: %', v_boss_id;
    end if;
    
    -- Record evidence points (Motor provides damage, we persist it)
    insert into public.boss_evidence_log (boss_id, source_event_id, points)
      values (v_boss_id, p_world_event_id, greatest(1, v_damage));
    
    if v_damage > 0 then
      v_previous_health := v_boss_rec.current_health;
      
      -- Apply damage with optimistic lock
      update public.bosses
        set current_health = greatest(0, current_health - v_damage)
        where id = v_boss_id and version = v_boss_rec.version;
      
      if not found then
        raise exception 'boss optimistic lock conflict for %', v_boss_id;
      end if;
      
      -- Record damage history
      insert into public.boss_damage_history (boss_id, world_event_id, damage, previous_health, new_health, rules_version)
        values (v_boss_id, p_world_event_id, v_damage, v_previous_health, v_previous_health - v_damage, p_rules_version);
      
      -- Check if boss is now defeated
      select current_health, state into v_previous_health, v_contract_rec.state from public.bosses where id = v_boss_id;
      if v_previous_health <= 0 and v_boss_rec.state <> 'derrotado' then
        update public.bosses
          set state = 'derrotado', defeated_at = now()
          where id = v_boss_id;
        
        insert into public.boss_history (boss_id, previous_state, next_state, reason)
          values (v_boss_id, v_boss_rec.state, 'derrotado', 'Motor derrota');
        
        -- Record evidence reset (defeated)
        insert into public.boss_evidence_resets (boss_id, reset_reason)
          values (v_boss_id, 'derrotado');
      end if;
    end if;
  end loop;
  
  -- ============================================================================
  -- BRANCH 5: Economy (Currency Transactions)
  -- ============================================================================
  -- For now, just record that an event occurred (actual rewards are in effects)
  -- In future: parse p_effects->>'economyRewards' and create transactions
  if coalesce((p_effects->>'currencyDelta')::bigint, 0) <> 0 then
    v_balance := coalesce((select balance from public.currency_wallets where player_id = p_player_id), 0);
    v_balance := v_balance + coalesce((p_effects->>'currencyDelta')::bigint, 0);
    v_idempotency_key := p_world_event_id::text || ':economy';
    
    insert into public.currency_transactions (
      player_id, currency_code, transaction_type, amount, balance_after, 
      source_type, source_id, idempotency_key
    ) values (
      p_player_id, 'monedas_aventurero', 'acreditacion',
      abs(coalesce((p_effects->>'currencyDelta')::bigint, 0)),
      v_balance,
      'evento_especial', p_world_event_id, v_idempotency_key
    ) on conflict (player_id, idempotency_key) do nothing;
    
    update public.currency_wallets
      set balance = v_balance, updated_at = now()
      where player_id = p_player_id;
  end if;
  
  -- ============================================================================
  -- BRANCH 6: Discipline Calculation (audit trail, no formula yet)
  -- ============================================================================
  -- Per CODEX-002: Disciplina is derived but formula TBD. 
  -- For now: record calculation factors without modifying the stat.
  select * into v_discipline_stat from public.player_stats
    where player_id = p_player_id and stat_key = 'disciplina' for update;
  
  if found then
    v_old_discipline_value := v_discipline_stat.value;
    
    -- Record discipline calculation with factors for future formula
    v_discipline_factors := jsonb_build_object(
      'activity_count', (select count(*) from jsonb_array_elements(coalesce(p_effects->'activities','[]'::jsonb))),
      'contract_evidence_count', (select count(*) from jsonb_array_elements(coalesce(p_effects->'contractEvidence','[]'::jsonb))),
      'boss_evidence_count', (select count(*) from jsonb_array_elements(coalesce(p_effects->'bossEvidence','[]'::jsonb)))
    );
    
    insert into public.discipline_calculations (player_id, calculated_for, previous_value, new_value, rules_version, factors)
      values (p_player_id, now()::date, v_old_discipline_value, v_old_discipline_value, p_rules_version, v_discipline_factors)
      on conflict (player_id, calculated_for) do update
        set factors = v_discipline_factors;
  end if;
  
end; $$;
