-- CODEX-010: official guild identities, independent permanent progress, and auditable history.
alter table public.player_guild_progress drop constraint player_guild_progress_guild_code_fkey;
alter table public.player_guild_progress add constraint player_guild_progress_guild_code_fkey foreign key (guild_code) references public.guilds(code) on update cascade;
alter table public.guild_experience_awards drop constraint guild_experience_awards_guild_code_fkey;
alter table public.guild_experience_awards add constraint guild_experience_awards_guild_code_fkey foreign key (guild_code) references public.guilds(code) on update cascade;

alter table public.guilds add column description text not null default '';

update public.guilds set code = 'forja_acero', official_name = 'La Forja del Acero', description = 'QA, tecnologia, programacion, automatizacion e ingenieria.' where code = 'tecnologia';
update public.guilds set code = 'atelier_bosque', official_name = 'El Atelier del Bosque', description = 'Escultura, arte, modelado, diseno, fotografia y museos.' where code = 'arte';
update public.guilds set code = 'orden_roble', official_name = 'La Orden del Roble', description = 'Salud, entrenamiento, nutricion, descanso y bienestar.' where code = 'vitalidad';
update public.guilds set code = 'vinculos_reino', official_name = 'Los Vinculos del Reino', description = 'Familia, amistades, relaciones y comunidad.' where code = 'social';
update public.guilds set code = 'archivo_eterno', official_name = 'El Archivo Eterno', description = 'Lectura, investigacion, aprendizaje y conocimiento.' where code = 'sabiduria';
insert into public.guilds (code, official_name, primary_stat_key, description) values
  ('caminantes_horizonte', 'Los Caminantes del Horizonte', 'sabiduria', 'Viajes, exploracion, cultura e idiomas.');

create table public.guild_categories (
  guild_code text not null references public.guilds(code) on update cascade on delete restrict,
  category text not null,
  primary key (guild_code, category)
);

insert into public.guild_categories (guild_code, category) values
  ('forja_acero', 'tecnologia'), ('atelier_bosque', 'arte'), ('orden_roble', 'vitalidad'),
  ('caminantes_horizonte', 'viajes'), ('caminantes_horizonte', 'exploracion'), ('caminantes_horizonte', 'cultura'), ('caminantes_horizonte', 'idiomas'),
  ('archivo_eterno', 'sabiduria'), ('vinculos_reino', 'social');

insert into public.player_guild_progress (player_id, guild_code)
  select players.id, guilds.code from public.players players cross join public.guilds guilds
  on conflict do nothing;

create table public.guild_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  guild_code text not null references public.guilds(code) on update cascade on delete restrict,
  source_type text not null check (source_type in ('evento', 'contrato', 'boss', 'logro', 'objeto')),
  source_id uuid,
  experience_awarded integer not null default 0 check (experience_awarded >= 0),
  mastery_awarded integer not null default 0 check (mastery_awarded >= 0),
  recorded_at timestamptz not null default now()
);

create index guild_history_player_idx on public.guild_history (player_id, guild_code, recorded_at desc);
create function public.prevent_guild_history_deletion() returns trigger language plpgsql as $$
begin raise exception 'guild history is append-only'; end; $$;
create trigger prevent_guild_history_delete before delete on public.guild_history
for each row execute function public.prevent_guild_history_deletion();

alter table public.guild_categories enable row level security;
alter table public.guild_history enable row level security;
create policy "players read guild categories" on public.guild_categories for select using (auth.uid() is not null);
create policy "players read own guild history" on public.guild_history for select using (player_id = auth.uid());
