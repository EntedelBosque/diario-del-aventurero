-- ============================================================
-- Reset del progreso del Aventurero (uso personal, un solo jugador)
-- Ejecutar en: Supabase Studio -> SQL Editor -> pegar -> Run.
-- NO borra tu diario ni tus entidades del mundo (tus memorias se conservan);
-- solo pone en cero XP, nivel, estadísticas, maestría de gremios y monedas.
-- ============================================================

update public.players            set experience = 0, level = 1;
update public.player_stats        set value = case when stat_key = 'disciplina' then 50 else 0 end;
update public.player_guild_progress set mastery = 0;
update public.currency_wallets     set balance = 0;

-- OPCIONAL: si además quieres que el Mundo se rehaga desde cero (para que las
-- entidades se regeneren con alias épico y semblanza), descomenta estas dos líneas.
-- Ojo: borra las entidades ya descubiertas (no tus entradas del diario).
-- delete from public.entity_history;
-- delete from public.world_entities;
