import { Router } from 'express';
import Stripe from 'stripe';
const router = Router();
const stripe = new Stripe(process.env.STRIPE_KEY || 'sk_test_xxx', { apiVersion: '2022-11-15' });

router.post('/create-payment-intent', async (req, res) => {
  const { amount, currency = 'usd', userId } = req.body; // UserId should ideally come from auth middleware
  try {
    const pi = await stripe.paymentIntents.create({ amount, currency });

    // Record transaction
    if (userId) {
      const { default: Transaction } = await import('../../models/Transaction');
      await Transaction.create({
        userId,
        type: 'payment',
        amount: amount / 100, // Stripe uses cents
        currency,
        status: 'pending',
        stripePaymentIntentId: pi.id,
        description: 'Payment Intent Created',
        paymentMethod: 'card'
      });
    }

    res.json({ clientSecret: pi.client_secret });
  } catch (err) {
    console.error('Stripe error:', err);
    res.status(500).json({ error: 'Stripe error', details: String(err) });
  }
});

export default router;
