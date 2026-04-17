-- ============================================================================
-- BLOCK 2: ALTER EXISTING TABLES ONLY
-- IMPORTANT: Every FK column is added (IF NOT EXISTS) immediately before FK
-- ============================================================================

-- profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS syndicate_card_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS contact JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS owner_user_id UUID;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS brands TEXT[] DEFAULT '{}';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_user_id_fkey;
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_owner_user_id_fkey;
ALTER TABLE public.stores ADD CONSTRAINT stores_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.stores ADD CONSTRAINT stores_owner_user_id_fkey
FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- pets
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS owner_user_id UUID;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS medical_history JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_user_id_fkey;
ALTER TABLE public.pets DROP CONSTRAINT IF EXISTS pets_owner_user_id_fkey;
ALTER TABLE public.pets ADD CONSTRAINT pets_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.pets ADD CONSTRAINT pets_owner_user_id_fkey
FOREIGN KEY (owner_user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS vet_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS pet_id UUID;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_user_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_vet_id_fkey;
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_pet_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_vet_id_fkey
FOREIGN KEY (vet_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_pet_id_fkey
FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL;

-- carts
ALTER TABLE public.carts ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.carts DROP CONSTRAINT IF EXISTS carts_user_id_fkey;
ALTER TABLE public.carts ADD CONSTRAINT carts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- cart_items
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS cart_id UUID;
ALTER TABLE public.cart_items ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_cart_id_fkey;
ALTER TABLE public.cart_items DROP CONSTRAINT IF EXISTS cart_items_store_id_fkey;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_cart_id_fkey
FOREIGN KEY (cart_id) REFERENCES public.carts(id) ON DELETE CASCADE;
ALTER TABLE public.cart_items ADD CONSTRAINT cart_items_store_id_fkey
FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- messages
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS sender_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS receiver_id UUID;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_receiver_id_fkey;
ALTER TABLE public.messages DROP CONSTRAINT IF EXISTS messages_appointment_id_fkey;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey
FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_receiver_id_fkey
FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;

-- reviews
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reviewer_id UUID;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_user_id_fkey;
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_reviewer_id_fkey;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD CONSTRAINT reviews_reviewer_id_fkey
FOREIGN KEY (reviewer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- favorites
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.favorites ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.favorites DROP CONSTRAINT IF EXISTS favorites_user_id_fkey;
ALTER TABLE public.favorites ADD CONSTRAINT favorites_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- reminders
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.reminders ADD COLUMN IF NOT EXISTS pet_id UUID;
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_user_id_fkey;
ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_pet_id_fkey;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.reminders ADD CONSTRAINT reminders_pet_id_fkey
FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL;

-- consultation_forms
ALTER TABLE public.consultation_forms ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.consultation_forms ADD COLUMN IF NOT EXISTS pet_id UUID;
ALTER TABLE public.consultation_forms ADD COLUMN IF NOT EXISTS vet_id UUID;
ALTER TABLE public.consultation_forms DROP CONSTRAINT IF EXISTS consultation_forms_user_id_fkey;
ALTER TABLE public.consultation_forms DROP CONSTRAINT IF EXISTS consultation_forms_pet_id_fkey;
ALTER TABLE public.consultation_forms DROP CONSTRAINT IF EXISTS consultation_forms_vet_id_fkey;
ALTER TABLE public.consultation_forms ADD CONSTRAINT consultation_forms_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.consultation_forms ADD CONSTRAINT consultation_forms_pet_id_fkey
FOREIGN KEY (pet_id) REFERENCES public.pets(id) ON DELETE SET NULL;
ALTER TABLE public.consultation_forms ADD CONSTRAINT consultation_forms_vet_id_fkey
FOREIGN KEY (vet_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- files
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.files DROP CONSTRAINT IF EXISTS files_user_id_fkey;
ALTER TABLE public.files ADD CONSTRAINT files_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- transactions
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_user_id_fkey;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_user_id_fkey;
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD CONSTRAINT orders_store_id_fkey
FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE SET NULL;

-- store_products
ALTER TABLE public.store_products ADD COLUMN IF NOT EXISTS store_id UUID;
ALTER TABLE public.store_products DROP CONSTRAINT IF EXISTS store_products_store_id_fkey;
ALTER TABLE public.store_products ADD CONSTRAINT store_products_store_id_fkey
FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;

-- slots
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS vet_id UUID;
ALTER TABLE public.slots ADD COLUMN IF NOT EXISTS appointment_id UUID;
ALTER TABLE public.slots DROP CONSTRAINT IF EXISTS slots_vet_id_fkey;
ALTER TABLE public.slots DROP CONSTRAINT IF EXISTS slots_appointment_id_fkey;
ALTER TABLE public.slots ADD CONSTRAINT slots_vet_id_fkey
FOREIGN KEY (vet_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.slots ADD CONSTRAINT slots_appointment_id_fkey
FOREIGN KEY (appointment_id) REFERENCES public.appointments(id) ON DELETE SET NULL;
