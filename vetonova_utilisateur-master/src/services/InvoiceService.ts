import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/src/lib/supabase';
import { decode } from 'base64-arraybuffer';

export const generateAndUploadInvoice = async (mission: any, total: number, extraFees: number, surcharge: number) => {
  const basePrice = mission?.price_estimate || 0;
  const date = new Date().toLocaleDateString('fr-FR');
  const timestamp = Date.now();
  
  // On récupère l'ID de l'utilisateur connecté pour le chemin du fichier
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié");

  const fileName = `reçu_${mission?.pet_name || 'animal'}_${timestamp}.pdf`;
  const filePath = `${user.id}/${fileName}`; // Organisation par dossier ID Utilisateur

  const htmlContent = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #333; }
          .header { border-bottom: 2px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; }
          .logo { color: #10b981; font-size: 24px; font-weight: bold; }
          .details { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th { text-align: left; color: #94a3b8; font-size: 12px; text-transform: uppercase; padding-bottom: 10px; }
          td { padding: 15px 0; border-bottom: 1px solid #f1f5f9; }
          .total-section { margin-top: 40px; text-align: right; }
          .total-row { font-size: 20px; font-weight: bold; color: #1e293b; }
          .footer { margin-top: 50px; font-size: 10px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">VET-HOME REÇU</div>
          <div>Date: ${date}</div>
        </div>
        <div class="details">
          <p><strong>Vétérinaire :</strong> ${mission?.vet_name || 'Vétérinaire Mission-Home'}</p>
          <p><strong>Client :</strong> ${mission?.owner_name || 'Propriétaire'}</p>
          <p><strong>Animal :</strong> ${mission?.pet_name} (${mission?.service_type || 'Soin'})</p>
        </div>
        <table>
          <thead>
            <tr><th>Description</th><th>Montant</th></tr>
          </thead>
          <tbody>
            <tr><td>Consultation à domicile (Base)</td><td>${basePrice}€</td></tr>
            ${surcharge > 0 ? `<tr><td>Majoration Weekend / Jour férié</td><td>${surcharge}€</td></tr>` : ''}
            ${extraFees > 0 ? `<tr><td>Actes médicaux supplémentaires</td><td>${extraFees}€</td></tr>` : ''}
          </tbody>
        </table>
        <div class="total-section">
          <div class="total-row">Total réglé : ${total}€</div>
          <p style="font-size: 12px; color: #64748b;">Payé via Stripe</p>
        </div>
        <div class="footer">
          <p>Ce document sert de preuve de paiement pour votre assurance santé animale.</p>
        </div>
      </body>
    </html>
  `;

  try {
    // 1. Génération du PDF
    const { uri } = await Print.printToFileAsync({ html: htmlContent });

    // 2. Conversion en Base64 pour Supabase
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    
    // 3. Upload vers Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('invoices')
      .upload(filePath, decode(base64), {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    // 4. Récupération de l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('invoices')
      .getPublicUrl(filePath);

    // 5. Mise à jour de l'enregistrement du rendez-vous
    await supabase
      .from('appointments')
      .update({ 
        invoice_url: publicUrl,
        final_price: total 
      })
      .eq('id', mission.id);

    // 6. Partage local
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });

    return publicUrl;
  } catch (error) {
    console.error("Erreur complète du processus facture:", error);
  }
};