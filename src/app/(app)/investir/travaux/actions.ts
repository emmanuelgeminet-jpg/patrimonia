"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

function toNumOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export async function addLigneTravaux(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const analyseId = String(formData.get("analyse_id") ?? "");
  const piece = String(formData.get("piece") ?? "").trim();
  const typeTravaux = String(formData.get("type_travaux") ?? "").trim();
  if (!analyseId) return { error: "Analyse introuvable." };
  if (!piece || !typeTravaux) return { error: "Pièce et type de travaux obligatoires." };

  const surfaceM2 = toNumOrNull(formData.get("surface_m2"));
  const prixM2Cents = toCentsOrNull(formData.get("prix_m2"));
  const sousTotalSaisi = toCentsOrNull(formData.get("sous_total"));
  const sousTotalCents = sousTotalSaisi ?? Math.round((surfaceM2 ?? 0) * (prixM2Cents ?? 0));

  if (!sousTotalCents) return { error: "Renseigne soit surface + prix/m², soit un montant forfaitaire." };

  const supabase = await createClient();
  const { error } = await supabase.from("devis_travaux").insert({
    analyse_id: analyseId,
    piece,
    type_travaux: typeTravaux,
    surface_m2: surfaceM2,
    prix_m2_cents: prixM2Cents,
    sous_total_cents: sousTotalCents,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/investir/travaux");
  return { success: true };
}

export async function deleteLigneTravaux(id: string) {
  const supabase = await createClient();
  await supabase.from("devis_travaux").delete().eq("id", id);
  revalidatePath("/investir/travaux");
}
