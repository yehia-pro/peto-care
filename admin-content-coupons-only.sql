-- Run on Supabase SQL editor if you already applied an older database-setup.sql
-- Adds pet_guides, diseases, admin_coupons + RLS policies

begin;

create table if not exists public.pet_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  image_url text not null default '',
  care_tips jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.diseases (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  symptoms jsonb not null default '[]'::jsonb,
  image_url text not null default '',
  is_rare boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric not null,
  expires_at timestamptz,
  min_order_amount numeric not null default 0,
  max_uses int not null default 0,
  used_count int not null default 0,
  is_active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_coupons_code_lower_idx on public.admin_coupons ((lower(code)));

alter table public.pet_guides enable row level security;
alter table public.diseases enable row level security;
alter table public.admin_coupons enable row level security;

do $$ begin
  create policy "pet_guides_select_public" on public.pet_guides for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "diseases_select_public" on public.diseases for select using (true);
exception when duplicate_object then null; end $$;

commit;
