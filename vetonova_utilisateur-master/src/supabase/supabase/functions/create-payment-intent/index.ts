import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.1.0?target=deno"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2026-01-28.clover',          // ← recommandé
  httpClient: Stripe.createFetchHttpClient(),
});


serve(async (req) => {
  try {
    const { appointmentId } = await req.json();

    // 1. Récupérer les infos de la mission et du véto dans la DB
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: appointment, error } = await supabase
      .from('appointments')
      .select(`
        final_price,
        platform_fee_amount,
        vet:profiles!vet_id (stripe_connect_id)
      `)
      .eq('id', appointmentId)
      .single();

    if (!appointment || !appointment.vet?.stripe_connect_id) {
      throw new Error("Vétérinaire non configuré pour les paiements");
    }

    // 2. Créer le Payment Intent Stripe
    // Stripe travaille en centimes (10.00€ = 1000)
    const amount = Math.round(appointment.final_price * 100);
    const fee = Math.round(appointment.platform_fee_amount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: 'eur',
      payment_method_types: ['card'],
      // C'est ici que la magie Connect opère :
      application_fee_amount: fee, 
      transfer_data: {
        destination: appointment.vet.stripe_connect_id,
      },
      metadata: { appointmentId: appointmentId }
    });

    return new Response(
      JSON.stringify({ 
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id 
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }
})