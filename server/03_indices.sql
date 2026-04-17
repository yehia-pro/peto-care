-- ============================================================================
-- BLOCK 3: INDICES ONLY
-- Create all indices for performance
-- Run this after Block 2
-- ============================================================================

-- ============================================================================
-- Base tables indices
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_stores_user_id ON public.stores(user_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner_user_id ON public.stores(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_pets_user_id ON public.pets(user_id);
CREATE INDEX IF NOT EXISTS idx_pets_owner_user_id ON public.pets(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_vet_id ON public.appointments(vet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_pet_id ON public.appointments(pet_id);

-- ============================================================================
-- New tables indices
-- ============================================================================

-- Carts indices
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON public.carts(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON public.cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON public.cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_store_id ON public.cart_items(store_id);

-- Messages indices
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_appointment_id ON public.messages(appointment_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Reviews indices
CREATE INDEX IF NOT EXISTS idx_reviews_target_id ON public.reviews(target_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_id ON public.reviews(reviewer_id);

-- Favorites indices
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- Reminders indices
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_pet_id ON public.reminders(pet_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON public.reminders(due_date);

-- Files indices
CREATE INDEX IF NOT EXISTS idx_files_user_id ON public.files(user_id);

-- Consultation forms indices
CREATE INDEX IF NOT EXISTS idx_consultation_forms_user_id ON public.consultation_forms(user_id);
CREATE INDEX IF NOT EXISTS idx_consultation_forms_vet_id ON public.consultation_forms(vet_id);

-- Transactions indices
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON public.transactions(stripe_payment_intent_id);

-- Orders indices
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);

-- Store products indices
CREATE INDEX IF NOT EXISTS idx_store_products_store_id ON public.store_products(store_id);
CREATE INDEX IF NOT EXISTS idx_store_products_category ON public.store_products(category);

-- Slots indices
CREATE INDEX IF NOT EXISTS idx_slots_vet_id ON public.slots(vet_id);
CREATE INDEX IF NOT EXISTS idx_slots_date ON public.slots(date);
CREATE INDEX IF NOT EXISTS idx_slots_is_booked ON public.slots(is_booked);
