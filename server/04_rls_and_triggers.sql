-- ============================================================================
-- BLOCK 4: RLS POLICIES & TRIGGERS ONLY
-- Add Row Level Security and triggers
-- Run this last after Block 3
-- ============================================================================

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Create RLS Policies
-- ============================================================================

-- Profiles policies
DROP POLICY IF EXISTS "Profiles can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles can insert own profile" ON public.profiles;

CREATE POLICY "Profiles can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Profiles can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Stores policies
DROP POLICY IF EXISTS "Stores are viewable by everyone" ON public.stores;
DROP POLICY IF EXISTS "Store owners can manage their stores" ON public.stores;
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;

CREATE POLICY "Stores are viewable by everyone"
ON public.stores FOR SELECT
USING (TRUE);

CREATE POLICY "Store owners can manage their stores"
ON public.stores FOR ALL
USING (auth.uid() = user_id OR auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_user_id);

CREATE POLICY "Admins can manage all stores"
ON public.stores FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Pets policies
DROP POLICY IF EXISTS "Owners can manage their pets" ON public.pets;
DROP POLICY IF EXISTS "Vets can view pets for their appointments" ON public.pets;

CREATE POLICY "Owners can manage their pets"
ON public.pets FOR ALL
USING (auth.uid() = user_id OR auth.uid() = owner_user_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = owner_user_id);

CREATE POLICY "Vets can view pets for their appointments"
ON public.pets FOR SELECT
USING (EXISTS (SELECT 1 FROM public.appointments a WHERE a.vet_id = auth.uid() AND a.pet_id = pets.id));

-- Appointments policies
DROP POLICY IF EXISTS "Users can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Vets can view their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Vets can update their appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can manage all appointments" ON public.appointments;

CREATE POLICY "Users can view own appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Vets can view their appointments"
ON public.appointments FOR SELECT
USING (auth.uid() = vet_id);

CREATE POLICY "Users can create appointments"
ON public.appointments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Vets can update their appointments"
ON public.appointments FOR UPDATE
USING (auth.uid() = vet_id)
WITH CHECK (auth.uid() = vet_id);

CREATE POLICY "Admins can manage all appointments"
ON public.appointments FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Carts policies
DROP POLICY IF EXISTS "Users can manage own cart" ON public.carts;
DROP POLICY IF EXISTS "Users can manage own cart items" ON public.cart_items;

CREATE POLICY "Users can manage own cart"
ON public.carts FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own cart items"
ON public.cart_items FOR ALL
USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()));

-- Messages policies
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update read status" ON public.messages;

CREATE POLICY "Users can view messages they sent or received"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status"
ON public.messages FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);

-- Reviews policies
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON public.reviews;

CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews FOR SELECT
USING (TRUE);

CREATE POLICY "Users can create their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.uid() = reviewer_id);

CREATE POLICY "Users can update their own reviews"
ON public.reviews FOR UPDATE
USING (auth.uid() = user_id OR auth.uid() = reviewer_id)
WITH CHECK (auth.uid() = user_id OR auth.uid() = reviewer_id);

CREATE POLICY "Users can delete their own reviews"
ON public.reviews FOR DELETE
USING (auth.uid() = user_id OR auth.uid() = reviewer_id);

-- Favorites policies
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON public.favorites;

CREATE POLICY "Users can view own favorites"
ON public.favorites FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites"
ON public.favorites FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Reminders policies
DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
DROP POLICY IF EXISTS "Users can manage own reminders" ON public.reminders;

CREATE POLICY "Users can view own reminders"
ON public.reminders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own reminders"
ON public.reminders FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Consultation forms policies
DROP POLICY IF EXISTS "Users can view own forms" ON public.consultation_forms;
DROP POLICY IF EXISTS "Users can manage own forms" ON public.consultation_forms;

CREATE POLICY "Users can view own forms"
ON public.consultation_forms FOR SELECT
USING (
    auth.uid() = user_id
    OR auth.uid() = vet_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Users can manage own forms"
ON public.consultation_forms FOR ALL
USING (
    auth.uid() = user_id
    OR auth.uid() = vet_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
    auth.uid() = user_id
    OR auth.uid() = vet_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Files policies
DROP POLICY IF EXISTS "Users can view own files" ON public.files;
DROP POLICY IF EXISTS "Users can manage own files" ON public.files;

CREATE POLICY "Users can view own files"
ON public.files FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Users can manage own files"
ON public.files FOR ALL
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.transactions;

CREATE POLICY "Users can view own transactions"
ON public.transactions FOR SELECT
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

CREATE POLICY "Users can manage own transactions"
ON public.transactions FOR ALL
USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- Orders policies
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Store owners can view their store orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;

CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Store owners can view their store orders"
ON public.orders FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.stores s
        WHERE s.id = orders.store_id
          AND (s.user_id = auth.uid() OR s.owner_user_id = auth.uid())
    )
);

CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- Store products policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON public.store_products;
DROP POLICY IF EXISTS "Store owners can manage their products" ON public.store_products;

CREATE POLICY "Products are viewable by everyone"
ON public.store_products FOR SELECT
USING (TRUE);

CREATE POLICY "Store owners can manage their products"
ON public.store_products FOR ALL
USING (
    EXISTS (
        SELECT 1
        FROM public.stores s
        WHERE s.id = store_products.store_id
          AND (
              s.user_id = auth.uid()
              OR s.owner_user_id = auth.uid()
              OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
          )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.stores s
        WHERE s.id = store_products.store_id
          AND (
              s.user_id = auth.uid()
              OR s.owner_user_id = auth.uid()
              OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
          )
    )
);

-- Slots policies
DROP POLICY IF EXISTS "Slots are viewable by everyone" ON public.slots;
DROP POLICY IF EXISTS "Vets can manage own slots" ON public.slots;

CREATE POLICY "Slots are viewable by everyone"
ON public.slots FOR SELECT
USING (TRUE);

CREATE POLICY "Vets can manage own slots"
ON public.slots FOR ALL
USING (
    auth.uid() = vet_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
)
WITH CHECK (
    auth.uid() = vet_id
    OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
);

-- ============================================================================
-- Create updated_at function and triggers
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS update_stores_updated_at ON public.stores;
DROP TRIGGER IF EXISTS update_pets_updated_at ON public.pets;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
DROP TRIGGER IF EXISTS update_carts_updated_at ON public.carts;
DROP TRIGGER IF EXISTS update_cart_items_updated_at ON public.cart_items;
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
DROP TRIGGER IF EXISTS update_favorites_updated_at ON public.favorites;
DROP TRIGGER IF EXISTS update_reminders_updated_at ON public.reminders;
DROP TRIGGER IF EXISTS update_consultation_forms_updated_at ON public.consultation_forms;
DROP TRIGGER IF EXISTS update_files_updated_at ON public.files;
DROP TRIGGER IF EXISTS update_transactions_updated_at ON public.transactions;
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS update_store_products_updated_at ON public.store_products;
DROP TRIGGER IF EXISTS update_slots_updated_at ON public.slots;

-- Create triggers for all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pets_updated_at BEFORE UPDATE ON public.pets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_favorites_updated_at BEFORE UPDATE ON public.favorites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultation_forms_updated_at BEFORE UPDATE ON public.consultation_forms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_products_updated_at BEFORE UPDATE ON public.store_products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_slots_updated_at BEFORE UPDATE ON public.slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
