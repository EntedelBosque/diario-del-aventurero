-- Sprint E2E ticket 0.1: Game Director approved balance, version 1.
insert into public.game_balance_tables (table_key, version, status, payload, notes, activated_at) values
  ('player_level_curve', 1, 'activa', '{"base_xp":100,"exponent":1.5,"max_level":100}', 'Game Director approved.', now()),
  ('guild_level_curve', 1, 'activa', '{"base_xp":100,"exponent":1.5,"max_level":50}', 'Game Director approved.', now()),
  ('guild_rank_thresholds', 1, 'activa', '{"1":"Aprendiz","5":"Adepto","10":"Oficial","20":"Maestro","35":"Gran Maestro","50":"Legendario"}', 'Game Director approved.', now()),
  ('discipline_weights', 1, 'activa', '{"window_days":30,"weights":{"completed_contract":5,"completed_daily_mission":2,"journal_entry":1,"great_destination_progress":4,"balanced_day":3,"missed_day":-2,"expired_contract":-3,"inactive_week":-10},"min":0,"max":100}', 'Game Director approved.', now()),
  ('boss_damage_curve', 1, 'activa', '{"multiplier":0.10,"minimum_damage":1,"maximum_damage_per_cycle":25}', 'Game Director approved.', now()),
  ('diminishing_returns', 1, 'activa', '{"1":1.00,"2":0.75,"3":0.50,"4+":0.25}', 'Game Director approved.', now()),
  ('director_thresholds', 1, 'activa', '{"daily_review":true,"max_active_contracts":5,"max_daily_missions":3,"abandonment_days":7,"recovery_priority":true,"adaptive_difficulty":true}', 'Game Director approved.', now()),
  ('influence_pipeline', 1, 'activa', '{"pipeline":["evento","influence","xp","estadisticas","xp_gremios","evidencia","economia","grandes_destinos"],"persists_state":false}', 'Game Director approved.', now());
