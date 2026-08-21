"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ReviserLoyerResult = { error?: string; warning?: string; nouveauLoyerCents?: number };

/**
 * Formule légale de révision : nouveau loyer = ancien loyer × (IRL du trimestre de référence
 * ÷ IRL du même trimestre l'an dernier). Une seule action partagée SCI/nom propre — la mise à
 * jour ne touche qu'une ligne `locataires`, aucune logique de propriété à résoudre ici.
 */
export async function reviserLoyer(locataireId: string, irlReference: number, irlNouveau: number): Promise<ReviserLoyerResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  if (!irlReference || irlReference <= 0 || !irlNouveau || irlNouveau <= 0) {
    return { error: "Renseigne les deux valeurs d'IRL (nombres positifs)." };
  }

  const { data: locataire } = await supabase.from("locataires").select("loyer_hc_cents").eq("id", locataireId).single();
  if (!locataire) return { error: "Locataire introuvable." };

  const ancienLoyerCents = locataire.loyer_hc_cents as number;
  const nouveauLoyerCents = Math.round(ancienLoyerCents * (irlNouveau / irlReference));

  const { error: updateError } = await supabase.from("locataires").update({ loyer_hc_cents: nouveauLoyerCents }).eq("id", locataireId);
  if (updateError) return { error: "Erreur lors de la mise à jour du loyer." };

  const { error: insertError } = await supabase.from("loyer_revisions").insert({
    locataire_id: locataireId,
    date_revision: new Date().toISOString().slice(0, 10),
    irl_reference: irlReference,
    irl_nouveau: irlNouveau,
    ancien_loyer_hc_cents: ancienLoyerCents,
    nouveau_loyer_hc_cents: nouveauLoyerCents,
    created_by: user.id,
  });

  revalidatePath("/gerer/sci/appartements");
  revalidatePath("/gerer/biens-propres");

  if (insertError) {
    return { nouveauLoyerCents, warning: "Loyer mis à jour, mais l'historique de révision n'a pas pu être enregistré." };
  }
  return { nouveauLoyerCents };
}
