-- A diary entry is the submitted fact; its world event is the immutable Motor source.
alter table public.diary_entries
  add column world_event_id uuid references public.world_events(id) on delete restrict;

create unique index diary_entries_world_event_id_idx
  on public.diary_entries (world_event_id) where world_event_id is not null;
