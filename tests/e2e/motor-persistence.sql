-- E2E Test: Complete Motor effect persistence with all branches
-- This script executes the persist_motor_effects RPC with a complete test case
-- and reports all rows created across all related tables.

-- Test constants
\set test_player_id '550e8400-e29b-41d4-a716-446655440000'
\set test_world_event_id '880e8400-e29b-41d4-a716-446655440001'
\set test_contract_id '660e8400-e29b-41d4-a716-446655440001'
\set test_boss_id '770e8400-e29b-41d4-a716-446655440001'

-- ============================================================================
-- SETUP: Create test player, contract, and boss
-- ============================================================================
INSERT INTO public.players (id, username, email, current_level, experience, version)
  VALUES (:'test_player_id'::uuid, 'e2e_test_player', 'e2e@test.local', 1, 0, 1)
  ON CONFLICT DO NOTHING;

INSERT INTO public.contracts (
  id, player_id, contract_type, objective, state, difficulty, priority, categories,
  origin, rewards, starts_at, expires_at
) VALUES (
  :'test_contract_id'::uuid,
  :'test_player_id'::uuid,
  'diario',
  'Complete E2E test',
  'disponible',
  'normal',
  'alta',
  array['testing'],
  'motor',
  '{"xp": 100}'::jsonb,
  now(),
  now() + interval '7 days'
) ON CONFLICT DO NOTHING;

INSERT INTO public.bosses (
  id, player_id, name, description, categories, level, max_health, current_health,
  difficulty, state, appeared_at, rewards
) VALUES (
  :'test_boss_id'::uuid,
  :'test_player_id'::uuid,
  'E2E Test Boss',
  'A boss for testing Motor effects',
  array['testing'],
  5,
  100,
  100,
  'normal',
  'descubierto',
  now(),
  '{"xp": 50}'::jsonb
) ON CONFLICT DO NOTHING;

-- Ensure player has guild progress for all active guilds
INSERT INTO public.player_guild_progress (player_id, guild_code)
  SELECT :'test_player_id'::uuid, code
  FROM public.guilds
  WHERE is_active
  ON CONFLICT DO NOTHING;

-- Create test world event
INSERT INTO public.world_events (id, player_id, event_type, source_description, recorded_at)
  VALUES (:'test_world_event_id'::uuid, :'test_player_id'::uuid, 'diary_entry_intake', 'E2E Test Motor Execution', now())
  ON CONFLICT DO NOTHING;

-- ============================================================================
-- EXECUTE: Call persist_motor_effects with complete test case
-- ============================================================================
SELECT public.persist_motor_effects(
  :'test_world_event_id'::uuid,
  :'test_player_id'::uuid,
  'player_level_curve@2,boss_damage_curve@1,discipline_weights@1,director_thresholds@1',
  jsonb_build_object(
    'playerId', :'test_player_id',
    'worldEventId', :'test_world_event_id',
    'playerExperienceDelta', 250,
    'currencyDelta', 50,
    'activities', jsonb_build_array(
      jsonb_build_object(
        'category', 'testing',
        'scale', 'media',
        'durationMinutes', 60,
        'classifications', jsonb_build_object('type', 'e2e_test'),
        'baseXp', 50,
        'timeXp', 50,
        'peopleXp', 50,
        'discoveryXp', 50,
        'bonusXp', 0,
        'totalXp', 200,
        'guildAwards', jsonb_build_array(
          jsonb_build_object('guildCode', 'creatividad', 'experience', 100),
          jsonb_build_object('guildCode', 'conocimiento', 'experience', 100)
        )
      )
    ),
    'contractEvidence', jsonb_build_array(
      jsonb_build_object(
        'contractId', :'test_contract_id',
        'rationale', 'E2E test contract evidence - Player engaged in testing activities'
      )
    ),
    'bossEvidence', jsonb_build_array(
      jsonb_build_object(
        'bossId', :'test_boss_id',
        'damage', 25,
        'rationale', 'E2E test boss damage - Successfully tested Motor execution'
      )
    )
  )
);

-- ============================================================================
-- REPORT: Query all affected tables and count rows created
-- ============================================================================
\echo '\n📊 MOTOR EFFECTS PERSISTENCE REPORT\n'

\echo '📌 activity_progress_records:'
SELECT COUNT(*) as count
FROM public.activity_progress_records
WHERE player_id = :'test_player_id'::uuid AND source_event_id = :'test_world_event_id'::uuid;

\echo '\n📌 experience_awards:'
SELECT COUNT(*) as count
FROM public.experience_awards
WHERE player_id = :'test_player_id'::uuid;

\echo '\n📌 guild_experience_awards:'
SELECT COUNT(*) as count
FROM public.guild_experience_awards
WHERE player_id = :'test_player_id'::uuid;

\echo '\n📌 guild_history:'
SELECT COUNT(*) as count
FROM public.guild_history
WHERE player_id = :'test_player_id'::uuid;

\echo '\n📌 contract_history:'
SELECT COUNT(*) as count
FROM public.contract_history
WHERE contract_id = :'test_contract_id'::uuid;

\echo '\n📌 contract_evidence:'
SELECT COUNT(*) as count
FROM public.contract_evidence
WHERE contract_id = :'test_contract_id'::uuid;

\echo '\n📌 boss_evidence_log:'
SELECT COUNT(*) as count
FROM public.boss_evidence_log
WHERE boss_id = :'test_boss_id'::uuid;

\echo '\n📌 boss_damage_history:'
SELECT COUNT(*) as count
FROM public.boss_damage_history
WHERE boss_id = :'test_boss_id'::uuid;

\echo '\n📌 currency_transactions:'
SELECT COUNT(*) as count
FROM public.currency_transactions
WHERE player_id = :'test_player_id'::uuid;

\echo '\n📌 discipline_calculations:'
SELECT COUNT(*) as count
FROM public.discipline_calculations
WHERE player_id = :'test_player_id'::uuid;

-- ============================================================================
-- VERIFY: Check player, contract, and boss states after Motor execution
-- ============================================================================
\echo '\n👤 Player State After Motor Execution:'
SELECT id, current_level, experience, version
FROM public.players
WHERE id = :'test_player_id'::uuid;

\echo '\n📜 Contract State After Motor Execution:'
SELECT id, state, updated_at
FROM public.contracts
WHERE id = :'test_contract_id'::uuid;

\echo '\n🐉 Boss State After Motor Execution:'
SELECT id, current_health, state, version
FROM public.bosses
WHERE id = :'test_boss_id'::uuid;

\echo '\n✅ E2E Test Complete\n'
