"use server";

import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { formatMonthLabel } from "@/lib/budget";

export type ApercuEnvoiState = {
  error?: string;
  toEmail?: string;
  subject?: string;
  message?: string;
  pdfUrl?: string;
};

/**
 * Prépare l'aperçu avant envoi : destinataire deviné, objet et message par défaut, lien vers le
 * PDF déjà généré — tout reste modifiable côté formulaire, l'email du locataire est une
 * correspondance best-effort (la quittance ne référence pas de locataire_id, seulement son nom
 * au moment de la génération) puisqu'un lot peut avoir eu plusieurs locataires successifs.
 */
export async function preparerEnvoiQuittance(quittanceId: string): Promise<ApercuEnvoiState> {
  const supabase = await createClient();
  const { data: q } = await supabase
    .from("quittances")
    .select("mois, bien_adresse, lot_nom, locataire_nom, lot_id, storage_path")
    .eq("id", quittanceId)
    .single();
  if (!q) return { error: "Quittance introuvable." };

  let toEmail = "";
  if (q.lot_id) {
    const { data: locataire } = await supabase
      .from("locataires")
      .select("email")
      .eq("lot_id", q.lot_id)
      .eq("nom", q.locataire_nom)
      .not("email", "is", null)
      .order("date_entree", { ascending: false })
      .limit(1)
      .maybeSingle();
    toEmail = (locataire?.email as string | null) ?? "";
  }

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(q.storage_path as string, 3600);
  const moisLabel = formatMonthLabel(q.mois as string);

  return {
    toEmail,
    subject: `Quittance de loyer — ${moisLabel} — ${q.bien_adresse}`,
    message: `Bonjour ${q.locataire_nom},\n\nVeuillez trouver ci-joint votre quittance de loyer pour ${moisLabel} (${q.bien_adresse} — ${q.lot_nom}).\n\nCordialement,`,
    pdfUrl: signed?.signedUrl,
  };
}

export type EnvoiQuittanceState = { error?: string; success?: boolean; toEmail?: string; sentAt?: string };

export async function envoyerQuittanceParEmail(
  _prevState: EnvoiQuittanceState,
  formData: FormData
): Promise<EnvoiQuittanceState> {
  const quittanceId = String(formData.get("quittance_id") ?? "");
  const toEmail = String(formData.get("to_email") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!quittanceId) return { error: "Quittance introuvable." };
  if (!toEmail || !toEmail.includes("@")) return { error: "Adresse email invalide." };
  if (!subject) return { error: "L'objet ne peut pas être vide." };

  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM_ADDRESS;
  if (!apiKey || !fromAddress) {
    return { error: "L'envoi par email n'est pas encore configuré sur ce site (clé Resend ou adresse d'expédition manquante)." };
  }

  const supabase = await createClient();
  const { data: q } = await supabase.from("quittances").select("mois, storage_path").eq("id", quittanceId).single();
  if (!q?.storage_path) return { error: "Fichier de la quittance introuvable." };

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(q.storage_path as string, 600);
  if (!signed?.signedUrl) return { error: "Impossible de préparer le fichier à joindre." };

  const resend = new Resend(apiKey);
  const { error: sendError } = await resend.emails.send({
    from: fromAddress,
    to: [toEmail],
    subject,
    text: message,
    attachments: [{ path: signed.signedUrl, filename: `Quittance_${q.mois}.pdf` }],
  });
  if (sendError) return { error: "Erreur lors de l'envoi — réessaie dans un instant." };

  const sentAt = new Date().toISOString();
  await supabase.from("quittances").update({ email_envoye_a: toEmail, email_envoye_le: sentAt }).eq("id", quittanceId);

  return { success: true, toEmail, sentAt };
}
