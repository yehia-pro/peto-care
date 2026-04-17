begin;

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('customer', 'vet', 'store_owner', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.appointment_status as enum ('pending', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('draft', 'placed', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.user_role not null default 'customer',
  full_name text,
  phone text,
  country text,
  avatar_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  clinic_name text,
  license_number text,
  specialties text[] not null default '{}'::text[],
  bio text,
  years_experience int,
  verified boolean not null default false,
  location jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  phone text,
  location jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  species text,
  breed text,
  sex text,
  birth_date date,
  medical_history jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references public.profiles(id) on delete cascade,
  pet_id uuid not null references public.pets(id) on delete cascade,
  vet_id uuid not null references public.vets(id) on delete restrict,
  status public.appointment_status not null default 'pending',
  scheduled_at timestamptz not null,
  reason text,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_user_id uuid not null references public.profiles(id) on delete cascade,
  store_id uuid references public.stores(id) on delete set null,
  status public.order_status not null default 'draft',
  currency text not null default 'USD',
  subtotal_cents int not null default 0,
  shipping_cents int not null default 0,
  tax_cents int not null default 0,
  total_cents int not null default 0,
  shipping_address jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  sku text,
  name text not null,
  quantity int not null default 1 check (quantity > 0),
  unit_price_cents int not null default 0 check (unit_price_cents >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists vets_user_id_idx on public.vets(user_id);
create index if not exists vets_verified_idx on public.vets(verified);
create index if not exists stores_owner_user_id_idx on public.stores(owner_user_id);
create index if not exists stores_active_idx on public.stores(is_active);
create index if not exists pets_owner_user_id_idx on public.pets(owner_user_id);
create index if not exists appointments_customer_idx on public.appointments(customer_user_id);
create index if not exists appointments_vet_idx on public.appointments(vet_id);
create index if not exists appointments_scheduled_at_idx on public.appointments(scheduled_at);
create index if not exists appointments_status_idx on public.appointments(status);
create index if not exists orders_customer_idx on public.orders(customer_user_id);
create index if not exists orders_store_idx on public.orders(store_id);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists order_items_order_idx on public.order_items(order_id);

create table if not exists public.store_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id) on delete cascade,
  name text not null,
  description text,
  category text not null default 'food',
  image_url text,
  price_cents int not null default 0 check (price_cents >= 0),
  sale_price_cents int check (sale_price_cents is null or sale_price_cents >= 0),
  sale_expires_at timestamptz,
  stock int not null default 0 check (stock >= 0),
  in_stock boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_products_store_idx on public.store_products(store_id);
create index if not exists store_products_in_stock_idx on public.store_products(store_id, in_stock);

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

create index if not exists user_notifications_user_idx on public.user_notifications(user_id);
create index if not exists user_notifications_unread_idx on public.user_notifications(user_id, is_read);

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

alter table public.profiles enable row level security;
alter table public.vets enable row level security;
alter table public.stores enable row level security;
alter table public.pets enable row level security;
alter table public.appointments enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.user_notifications enable row level security;
alter table public.community_posts enable row level security;
alter table public.store_products enable row level security;

do $$ begin
  create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "profiles_insert_self" on public.profiles for insert with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "pets_owner_all" on public.pets for all using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "vets_select_public" on public.vets for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "vets_owner_write" on public.vets for insert with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "vets_owner_update" on public.vets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "stores_select_public" on public.stores for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "stores_owner_write" on public.stores for insert with check (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "stores_owner_update" on public.stores for update using (auth.uid() = owner_user_id) with check (auth.uid() = owner_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "appointments_customer_all" on public.appointments for all using (auth.uid() = customer_user_id) with check (auth.uid() = customer_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "appointments_vet_select" on public.appointments for select using (
    exists (select 1 from public.vets v where v.id = appointments.vet_id and v.user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "orders_customer_all" on public.orders for all using (auth.uid() = customer_user_id) with check (auth.uid() = customer_user_id);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "order_items_customer_all" on public.order_items for all using (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.orders o where o.id = order_items.order_id and o.customer_user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "user_notifications_own" on public.user_notifications for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;

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

do $$ begin
  create policy "store_products_select_public" on public.store_products for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "store_products_owner_write" on public.store_products for insert with check (
    exists (select 1 from public.stores s where s.id = store_products.store_id and s.owner_user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "store_products_owner_update" on public.store_products for update using (
    exists (select 1 from public.stores s where s.id = store_products.store_id and s.owner_user_id = auth.uid())
  ) with check (
    exists (select 1 from public.stores s where s.id = store_products.store_id and s.owner_user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "store_products_owner_delete" on public.store_products for delete using (
    exists (select 1 from public.stores s where s.id = store_products.store_id and s.owner_user_id = auth.uid())
  );
exception when duplicate_object then null; end $$;

-- Admin content & coupons (Express uses service role; public read for guides/diseases via API)
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