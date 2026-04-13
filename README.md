---
title: Peto Care Server
emoji: 🐾
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
---

Veterinary Network Platform - Full scaffold
-------------------------------------------
After extracting:

SERVER
1. cd server
2. npm install
3. Edit .env with real DB credentials and API keys (STRIPE_KEY, GEMINI_API_KEY)
4. Run migrations:
   psql -h ${DB_HOST} -U ${DB_USER} -d ${DB_NAME} -f migrations/001_create_tables.sql
5. Start server:
   npx ts-node --loader ts-node/esm src/index.ts

CLIENT
1. cd client
2. npm install
3. npm run dev

NOTES
- Auth: /api/auth/register and /api/auth/login (returns JWT)
- Payments: /api/payments/create-payment-intent (Stripe)
- AI: services/ai/gemini.ts is a stub; replace with real Gemini/LLM integration.
