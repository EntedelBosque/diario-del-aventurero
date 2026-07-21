-- ADDENDUM-003 / CONTENT-SPEC-001: stable handles and tags for official content.
-- Slugs are assigned once by the Motor at creation and never regenerated from later name edits.
alter table public.contracts add column slug text unique, add column tags text[] not null default '{}';
alter table public.bosses add column slug text unique, add column tags text[] not null default '{}';
alter table public.market_rewards add column slug text unique, add column tags text[] not null default '{}';
alter table public.achievements add column slug text unique, add column tags text[] not null default '{}';
alter table public.guilds add column slug text unique, add column tags text[] not null default '{}';
alter table public.player_titles add column slug text unique, add column tags text[] not null default '{}';
