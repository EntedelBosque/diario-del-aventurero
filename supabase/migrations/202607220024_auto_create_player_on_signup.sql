-- Fix: nothing was linking a new Supabase Auth user to public.players, so
-- signups never got progression rows (stats, guild progress, wallet) and
-- diary_entries failed its foreign key. This trigger closes that gap and
-- backfills any auth user created before this migration existed.

create or replace function public.handle_new_auth_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.players (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger handle_new_auth_user_after_insert
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Backfill: any auth user that already exists but has no matching players row.
insert into public.players (id)
  select id from auth.users
  where id not in (select id from public.players)
  on conflict (id) do nothing;
