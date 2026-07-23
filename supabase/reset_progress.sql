-- ============================================================
-- Reset del progreso del Aventurero (uso personal, un solo jugador)
-- Ejecutar en: Supabase Studio -> SQL Editor -> pegar -> Run.
-- Pone en cero XP, nivel, estadísticas, maestría de gremios y monedas.
-- NO toca tu diario ni tu mundo (tus memorias se conservan; la memoria del
-- mundo es "append-only" por diseño y no se borra).
-- ============================================================

update public.players             set experience = 0, level = 1;
update public.player_stats        set value = case when stat_key = 'disciplina' then 50 else 0 end;
update public.player_guild_progress set mastery = 0;
update public.currency_wallets     set balance = 0;

-- Nota: las entidades ya descubiertas se conservan. Sus alias épicos y su
-- semblanza se irán enriqueciendo automáticamente cada vez que las menciones
-- en nuevas entradas del diario; no hace falta borrarlas.
