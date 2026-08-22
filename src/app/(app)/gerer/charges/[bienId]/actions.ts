"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { computeRegularisation, type ClefRepartition, type ChargeLigne } from "@/lib/charges-regularisation";
import { chargerDonneesBien } from "./data";

export type EnregistrerState = { error?: string; success?: boolean };

/**
 * Ne fait jamais confiance à l'aperçu déjà calculé côté client — recharge les données et
 * recalcule intégralement côté serveur avant d'enregistrer (même principe que la génération
 * d'un bail ou d'une quittance).
 */
export async function enregistrerRegularisation(
  bienId: string,
  periodeDebut: string,
  periodeFin: string,
  clefRepartition: ClefRepartition,
  categoriesExclues: string[]
): Promise<EnregistrerState> {
  if (!periodeDebut || !periodeFin) return { error: "La période est obligatoire." };
  if (periodeFin < periodeDebut) return { error: "La fin de la période doit être après son début." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const donnees = await chargerDonneesBien(bienId);
  if (!donnees) return { error: "Bien introuvable." };

  const exclues = new Set(categoriesExclues);
  const chargeLignes: ChargeLigne[] = donnees.chargeLignes
    .filter((l) => !l.categorie || !exclues.has(l.categorie))
    .map((l) => ({ id: l.id, montantCents: l.montantCents, lotId: l.lotId, periodeDebut: l.periodeDebut, periodeFin: l.periodeFin }));

  const result = computeRegularisation({
    periodeDebut,
    periodeFin,
    clefRepartition,
    chargeLignes,
    lots: donnees.lots,
    occupations: donnees.occupations,
  });

  const { error } = await supabase.from("regularisations_charges").insert({
    sci_id: donnees.isSci ? donnees.sciId : null,
    household_id: donnees.isSci ? null : donnees.householdId,
    bien_id: bienId,
    bien_adresse: donnees.bienAdresse,
    periode_debut: periodeDebut,
    periode_fin: periodeFin,
    cle_repartition: clefRepartition,
    charges_totales_cents: result.chargesTotalesCents,
    donnees: result,
    created_by: user.id,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };

  revalidatePath(`/gerer/charges/${bienId}`);
  return { success: true };
}
