-- E2E Test Setup: Create a complete Motor effects scenario
-- This script sets up a test player with contracts and bosses, then simulates
-- a Motor run with all branches.

-- Create test player (or use existing)
insert into public.players (id, username, email, current_level, experience, version)
  values ('550e8400-e29b-41d4-a716-446655440000'::uuid, 'e2e_test_player', 'e2e@test.local', 1, 0, 1)
  on conflict (id) do nothing;

-- Create test contracts
insert into public.contracts (
  id, player_id, contract_type, objective, state, difficulty, priority, categories,
  origin, rewards, starts_at, expires_at
) values (
  '660e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
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
)
on conflict do nothing;

-- Create test boss
insert into public.bosses (
  id, player_id, name, description, categories, level, max_health, current_health,
  difficulty, state, appeared_at, rewards
) values (
  '770e8400-e29b-41d4-a716-446655440001'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
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
)
on conflict do nothing;

-- Ensure player has guild progress
insert into public.player_guild_progress (player_id, guild_code)
  select '550e8400-e29b-41d4-a716-446655440000'::uuid, code
  from public.guilds
  where is_active
  on conflict do nothing;
