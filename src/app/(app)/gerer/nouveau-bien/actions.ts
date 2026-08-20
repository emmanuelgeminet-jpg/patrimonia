"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

const TYPE_MAP: Record<string, string> = {
  Immeuble: "immeuble",
  Maison: "maison",
  "Appartement isolé": "appartement_isole",
  Garage: "garage",
  "Local commercial": "local_commercial",
};

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

function toIntOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

export async function creerBien(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) return { error: "Profil introuvable." };
  const householdId = profile.household_id as string;

  const adresse = String(formData.get("adresse") ?? "").trim();
  if (!adresse) return { error: "L'adresse est obligatoire." };

  const typeLabel = String(formData.get("type") ?? "Immeuble");
  const type = TYPE_MAP[typeLabel] ?? "appartement_isole";
  const modeDetention = String(formData.get("mode_detention") ?? "");
  const enSci = modeDetention.startsWith("SCI");

  let sciId: string | null = null;
  if (enSci) {
    const { data: associe } = await supabase
      .from("sci_associes")
      .select("sci_id")
      .eq("household_id", householdId)
      .limit(1)
      .maybeSingle();
    if (!associe) return { error: "Ton foyer n'est associé à aucune SCI pour l'instant — choisis \"Bien propre\" ou crée d'abord une SCI." };
    sciId = associe.sci_id as string;
  }

  const nombreLots = toIntOrNull(formData.get("nombre_lots"));

  const { data: bien, error } = await supabase
    .from("biens")
    .insert({
      type,
      owner_type: enSci ? "sci" : "propre",
      sci_id: enSci ? sciId : null,
      household_id: enSci ? null : householdId,
      adresse,
      date_acquisition: formData.get("date_acquisition") || null,
      prix_acquisition_cents: toCentsOrNull(formData.get("prix_acquisition")),
      nombre_lots: nombreLots,
      mode_detention: modeDetention || null,
      mode_location: formData.get("mode_location") || null,
      regime_fiscal: formData.get("regime_fiscal") || null,
    })
    .select("id")
    .single();

  if (error || !bien) return { error: "Erreur lors de l'enregistrement." };

  // On crée tout de suite au moins un lot pour pouvoir y rattacher un locataire — plusieurs
  // "Lot 1", "Lot 2"... pour un immeuble à plusieurs unités, un seul "Logement" sinon.
  // Renommables ensuite depuis "Par appartement" (SCI) ou la fiche du bien propre.
  const nbLotsACreer = type === "immeuble" ? Math.max(1, nombreLots ?? 1) : 1;
  const lots =
    nbLotsACreer > 1
      ? Array.from({ length: nbLotsACreer }, (_, i) => ({ bien_id: bien.id, nom: `Lot ${i + 1}` }))
      : [{ bien_id: bien.id, nom: "Logement" }];
  await supabase.from("lots").insert(lots);

  revalidatePath("/gerer/sci/immeuble");
  revalidatePath("/gerer/sci/vision-globale");
  revalidatePath("/gerer/nouveau-bien");
  revalidatePath("/gerer/biens-propres");
  return { success: true };
}
