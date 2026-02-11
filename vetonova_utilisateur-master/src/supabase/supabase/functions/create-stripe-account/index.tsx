import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2026-01-28.clover',          // ← recommandé
});

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // 1. Récupérer l'utilisateur
    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Non autorisé')

    // 2. Créer un compte Stripe Connect Express
    const account = await stripe.accounts.create({
      type: 'express',
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: { supabase_id: user.id }
    })

    // 3. Stocker l'ID Stripe dans ton profil Supabase
    await supabaseClient
      .from('profiles')
      .update({ stripe_connect_id: account.id })
      .eq('id', user.id)

    // 4. Créer le lien d'onboarding (où le véto saisit son IBAN)
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'vetonova://onboarding-retry',
      return_url: 'vetonova://(facility-tabs)',
      type: 'account_onboarding',
    })

    return new Response(JSON.stringify({ url: accountLink.url }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})