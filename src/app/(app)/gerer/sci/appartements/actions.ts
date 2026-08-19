"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

const PATH_APPARTEMENTS = "/gerer/sci/appartements";
const PATH_VISION_GLOBALE = "/gerer/sci/vision-globale";

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

export async function addLocataire(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const lotId = String(formData.get("lot_id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  if (!lotId) return { error: "Lot manquant." };
  if (!nom) return { error: "Le nom du locataire est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from("locataires").insert({
    lot_id: lotId,
    nom,
    date_entree: formData.get("date_entree") || null,
    loyer_hc_cents: toCentsOrNull(formData.get("loyer_hc")) ?? 0,
    charges_cents: toCentsOrNull(formData.get("charges")) ?? 0,
    depot_garantie_cents: toCentsOrNull(formData.get("depot_garantie")),
    depot_garantie_date: formData.get("depot_garantie_date") || null,
    depot_garantie_mode: formData.get("depot_garantie_mode") || null,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(PATH_APPARTEMENTS);
  revalidatePath(PATH_VISION_GLOBALE);
  return { success: true };
}

export async function markLocataireSorti(id: string) {
  const supabase = await createClient();
  await supabase
    .from("locataires")
    .update({ date_sortie: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  revalidatePath(PATH_APPARTEMENTS);
  revalidatePath(PATH_VISION_GLOBALE);
}

export async function deleteLocataire(id: string) {
  const supabase = await createClient();
  await supabase.from("locataires").delete().eq("id", id);
  revalidatePath(PATH_APPARTEMENTS);
  revalidatePath(PATH_VISION_GLOBALE);
}
