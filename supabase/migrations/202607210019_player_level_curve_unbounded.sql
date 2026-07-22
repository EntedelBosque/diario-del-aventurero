-- CODEX-003 is authoritative: general player level has no maximum.
update public.game_balance_tables
  set status = 'archivada'
  where table_key = 'player_level_curve' and status = 'activa';

insert into public.game_balance_tables (table_key, version, status, payload, notes, activated_at)
values ('player_level_curve', 2, 'activa', '{"base_xp":100,"exponent":1.5}', 'CODEX-003: nivel general sin tope.', now());
