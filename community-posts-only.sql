-- Run in Supabase after profiles exist. Idempotent.

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  image_url text,
  is_edited boolean not null default false,
  likes jsonb not null default '[]'::jsonb,
  comments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists community_posts_author_idx on public.community_posts(author_user_id);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc);

alter table public.community_posts enable row level security;

do $$ begin
  create policy "community_posts_select_all" on public.community_posts for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "community_posts_insert_own" on public.community_posts for insert with check (auth.uid() = author_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "community_posts_update_own" on public.community_posts for update using (auth.uid() = author_user_id) with check (auth.uid() = author_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "community_posts_delete_own" on public.community_posts for delete using (auth.uid() = author_user_id);
exception when duplicate_object then null; end $$;
