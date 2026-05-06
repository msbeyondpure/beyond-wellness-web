create table if not exists public.saved_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_date date not null,
  title text not null default '',
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists saved_notes_user_id_note_date_idx
  on public.saved_notes (user_id, note_date);

create index if not exists saved_notes_user_id_updated_at_idx
  on public.saved_notes (user_id, updated_at desc);

alter table public.saved_notes enable row level security;

drop policy if exists "Saved notes are viewable by owner" on public.saved_notes;
create policy "Saved notes are viewable by owner"
  on public.saved_notes
  for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Saved notes are insertable by owner" on public.saved_notes;
create policy "Saved notes are insertable by owner"
  on public.saved_notes
  for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Saved notes are editable by owner" on public.saved_notes;
create policy "Saved notes are editable by owner"
  on public.saved_notes
  for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Saved notes are deletable by owner" on public.saved_notes;
create policy "Saved notes are deletable by owner"
  on public.saved_notes
  for delete
  using ((select auth.uid()) = user_id);

create or replace function public.set_saved_notes_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_saved_notes_updated_at on public.saved_notes;
create trigger set_saved_notes_updated_at
  before update on public.saved_notes
  for each row
  execute function public.set_saved_notes_updated_at();
