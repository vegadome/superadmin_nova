import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const { missionId, paymentIntentId } = await req.json()

  try {
    // 1. On récupère le Payment Intent sur Stripe
    const intent = await stripe.paymentIntents.retrieve(paymentIntentId);

    let result;
    if (intent.status === 'requires_capture') {
      // Si l'argent est juste bloqué (non encore encaissé)
      result = await stripe.paymentIntents.cancel(paymentIntentId);
    } else if (intent.status === 'succeeded') {
      // Si l'argent est déjà encaissé, on fait un refund
      result = await stripe.refunds.create({ payment_intent: paymentIntentId });
    }

    return new Response(JSON.stringify({ success: true, result }), { 
      status: 200, 
      headers: { "Content-Type": "application/json" } 
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})