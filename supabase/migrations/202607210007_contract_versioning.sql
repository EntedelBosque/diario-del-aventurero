-- Contract state changes are written only by the Game Engine and use optimistic locking.
alter table public.contracts
  add column version integer not null default 1 check (version > 0);

create function public.bump_contract_version() returns trigger
language plpgsql
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger bump_contract_version_before_update
before update on public.contracts
for each row execute function public.bump_contract_version();
