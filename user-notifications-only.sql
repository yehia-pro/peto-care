-- Run in Supabase SQL Editor (standalone). Safe to re-run: uses IF NOT EXISTS / duplicate policy guard.
-- Requires public.profiles to exist.

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text,
  message text,
  type text not null default 'info',
  link text,
  is_read boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists user_notifications_user_idx
  on public.user_notifications(user_id);

create index if not exists user_notifications_unread_idx
  on public.user_notifications(user_id, is_read);

alter table public.user_notifications enable row level security;

do $$ begin
  create policy "user_notifications_own"
    on public.user_notifications
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception when duplicate_object then null;
end $$;
