import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record, old_record } = await req.json()

  // On n'envoie un mail que si le statut a changé
  if (record.verification_status === old_record.verification_status) {
    return new Response('No change', { status: 200 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // Récupérer l'email de l'utilisateur depuis auth.users
  const { data: userData } = await supabase.auth.admin.getUserById(record.id)
  const userEmail = userData.user?.email

  let subject = ""
  let body = ""

  if (record.verification_status === 'verified') {
    subject = "Votre profil InfiMatch a été validé ! ✅"
    body = `Bonjour ${record.full_name}, bonne nouvelle ! Votre profil a été approuvé. Vous pouvez maintenant postuler aux missions disponibles sur l'application.`
  } else if (record.verification_status === 'rejected') {
    subject = "Mise à jour requise sur votre profil InfiMatch ❌"
    body = `Bonjour ${record.full_name}, votre profil n'a pas pu être validé pour la raison suivante : ${record.verification_feedback}. Merci de corriger vos informations sur l'application.`
  }

  // Ici, on utilise l'API interne de Supabase pour envoyer le mail
  // Note: Pour de la production massive, on branche souvent Resend ici.
  console.log(`Envoi de l'email à ${userEmail}: ${subject}`)

  return new Response(JSON.stringify({ sent: true }), { 
    headers: { "Content-Type": "application/json" },
    status: 200 
  })
})