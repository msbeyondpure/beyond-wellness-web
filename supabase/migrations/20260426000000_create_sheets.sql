create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'Untitled Sheet',
  columns jsonb not null default '[]'::jsonb,
  rows jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sheets_user_id_updated_at_idx
  on public.sheets (user_id, updated_at desc);

alter table public.sheets enable row level security;

drop policy if exists "Sheets are viewable by owner" on public.sheets;
create policy "Sheets are viewable by owner"
  on public.sheets
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Sheets are insertable by owner" on public.sheets;
create policy "Sheets are insertable by owner"
  on public.sheets
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Sheets are editable by owner" on public.sheets;
create policy "Sheets are editable by owner"
  on public.sheets
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Sheets are deletable by owner" on public.sheets;
create policy "Sheets are deletable by owner"
  on public.sheets
  for delete
  using ((select auth.uid()) = user_id);

create or replace function public.set_sheets_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_sheets_updated_at on public.sheets;
create trigger set_sheets_updated_at
  before update on public.sheets
  for each row
  execute function public.set_sheets_updated_at();
