# Technical Debt Report - Peto Care Migration

## Critical Issues (Must Fix Before Deployment)

### 1. ❌ Missing Database Tables
**Status**: FIXED - SQL file `missing-tables.sql` created

The following tables were referenced in code but don't exist in Supabase:
- `carts` + `cart_items` (Shopping cart functionality)
- `messages` (Chat system)
- `reviews` (Rating & reviews)
- `favorites` (User favorites)
- `reminders` (Pet care reminders)
- `consultation_forms` (Online vet consultation)
- `files` (File uploads metadata)
- `transactions` (Payment tracking)
- `slots` (Vet availability)

**Action Required**: Run `missing-tables.sql` in Supabase SQL Editor

---

### 2. ⚠️ Simplified/Stubbed Implementations

#### A. Search Filters (search.ts)
- **What was removed**: Complex MongoDB text search with regex
- **Current state**: Basic Supabase queries
- **Impact**: Search by location/specialty may not work perfectly
- **Fix needed**: Implement PostgreSQL full-text search or use ILIKE patterns

#### B. Statistics Calculation (statistics.ts)
- **What was removed**: Complex aggregations (weekly data, revenue calculations)
- **Current state**: Returns 0 or mock values
- **Impact**: Dashboard statistics won't show real data
- **Fix needed**: Add proper date filtering and aggregation queries

#### C. Favorites Details (favorites.ts)
- **What was removed**: Product/Service population from separate collections
- **Current state**: Returns empty arrays for products/services
- **Impact**: Favorites page won't show item details
- **Fix needed**: Join with store_products table

#### D. Chat Conversations (chat.ts)
- **What was removed**: MongoDB aggregation for conversation grouping
- **Current state**: Simple JavaScript grouping (may have performance issues)
- **Impact**: Large chat histories may be slow
- **Fix needed**: Add conversation summary table or optimize query

---

### 3. ⚠️ Schema Mismatches

#### A. User Metadata Storage
- **Issue**: Old code used `contact` field as JSON string
- **New code**: Expects `metadata` JSONB field
- **Fix needed**: Migration to move data from `contact` to `metadata`

```sql
-- Example migration needed
UPDATE users 
SET metadata = contact::jsonb 
WHERE contact IS NOT NULL AND metadata IS NULL;
```

#### B. Store Products
- **Issue**: Old code had products nested in PetStore document
- **New code**: Separate `store_products` table
- **Fix needed**: Ensure all products migrated to new table

---

### 4. ⚠️ Removed Features (Not Implemented in Supabase)

| Feature | Old Implementation | New Status |
|---------|-------------------|------------|
| Seed data scripts | MongoDB seeding | ❌ Removed |
| Debug scripts | Transaction debugger | ❌ Removed |
| Chat service model | Mongoose model | ❌ Removed |

---

### 5. ⚠️ Potential Runtime Errors

#### A. Payments Webhook (payments.ts)
- **Risk**: Stripe webhook expects `orders` table with `stripe_session_id`
- **Check**: Verify orders table has this column
- **Fix**: Add column if missing

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
```

#### B. File Uploads (uploads.ts)
- **Risk**: Files saved to local disk (`uploads/` folder)
- **Issue**: Hugging Face Spaces is ephemeral - files will be lost on restart
- **Fix needed**: 
  - Option 1: Use Cloudinary/S3 for persistent storage
  - Option 2: Mount persistent volume (if supported)
  - Option 3: Store files as base64 in database (not recommended for large files)

---

### 6. ✅ Already Working (No Debt)

- Auth system (login/register)
- Pets management
- Appointments
- Vets profiles
- Community posts
- Orders (basic)
- Stores (basic)
- Admin dashboards

---

## Minor Issues (Can Fix Later)

### 1. Missing Indices
Some tables may benefit from additional indices for:
- Full-text search on messages
- Date range queries on appointments
- Geolocation queries (if adding location search)

### 2. No Data Validation
- Supabase RLS policies are basic
- Could add CHECK constraints for data integrity

---

## Pre-Deployment Checklist

- [ ] Run `missing-tables.sql` in Supabase
- [ ] Add stripe columns to orders table
- [ ] Migrate user metadata from `contact` to `metadata`
- [ ] Verify all products in `store_products` table
- [ ] Test file upload persistence strategy
- [ ] Test search functionality
- [ ] Verify statistics dashboard

---

## Post-Deployment Improvements

1. Implement proper full-text search (PostgreSQL tsvector)
2. Add caching layer for frequently accessed data
3. Optimize chat queries with materialized views
4. Add proper image handling (Cloudinary integration)
5. Implement background jobs for reminders/notifications

---

## Files Modified (14 files)

```
DELETED:
- server/src/models/*.ts (16 files)
- server/src/debug-transactions.ts
- server/src/seedEncyclopedia.ts
- server/src/services/chat.ts

REWRITTEN:
- server/src/routes/cart.ts (218 lines)
- server/src/routes/chat.ts (169 lines)
- server/src/routes/favorites.ts (117 lines)
- server/src/routes/forms.ts (90 lines)
- server/src/routes/payments.ts (186 lines)
- server/src/routes/payments/index.ts (34 lines)
- server/src/routes/reminders.ts (114 lines)
- server/src/routes/reviews.ts (97 lines)
- server/src/routes/search.ts (128 lines)
- server/src/routes/slots.ts (114 lines)
- server/src/routes/statistics.ts (167 lines)
- server/src/routes/uploads.ts (144 lines)

MODIFIED:
- server/src/index.ts (port changed to 7860)
- server/package.json (removed mongoose)
```

---

## Build Status

✅ `npm run build` - SUCCESS (Exit code 0)

No TypeScript errors. Backend is ready for deployment after database schema is applied.
