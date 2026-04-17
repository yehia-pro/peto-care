import { Router } from 'express';
import Stripe from 'stripe';
import { supabaseAdmin } from '../../lib/supabase';

const router = Router();
const stripe = new Stripe(process.env.STRIPE_KEY || 'sk_test_xxx', { apiVersion: '2022-11-15' });

router.post('/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd', userId } = req.body;
  try {
    const pi = await stripe.paymentIntents.create({ amount, currency });

    // Record transaction in Supabase
    if (userId) {
      await supabaseAdmin.from('transactions').insert({
        user_id: userId,
        type: 'payment',
        amount: amount / 100,
        currency,
        status: 'pending',
        stripe_payment_intent_id: pi.id,
        description: 'Payment Intent Created',
        payment_method: 'card'
      });
    }

    res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Stripe error', details: String(err) });
  }
});

export default router;
