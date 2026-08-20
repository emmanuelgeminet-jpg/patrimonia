"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

function revalidateBien(bienId: string) {
  revalidatePath(`/gerer/biens-propres/${bienId}`);
  revalidatePath("/gerer/biens-propres");
}

export async function saveFinancement(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const bienId = String(formData.get("bien_id") ?? "");
  if (!bienId) return { error: "Bien introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("biens")
    .update({
      prix_acquisition_cents: toCentsOrNull(formData.get("prix_acquisition")),
      date_acquisition: formData.get("date_acquisition") || null,
      credit_mensualite_cents: toCentsOrNull(formData.get("credit_mensualite")),
      assurance_mensuelle_cents: toCentsOrNull(formData.get("assurance_mensuelle")),
      charges_copro_annuelles_cents: toCentsOrNull(formData.get("charges_copro_annuelles")),
    })
    .eq("id", bienId);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidateBien(bienId);
  return { success: true };
}

export async function saveFiche(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const bienId = String(formData.get("bien_id") ?? "");
  if (!bienId) return { error: "Bien introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("biens")
    .update({
      dpe_classe: formData.get("dpe_classe") || null,
      dpe_date: formData.get("dpe_date") || null,
      monopropriete: formData.get("monopropriete") === "oui",
      numero_immatriculation_copropriete: formData.get("numero_immatriculation") || null,
      assurance_pno_compagnie: formData.get("assurance_compagnie") || null,
      assurance_pno_police: formData.get("assurance_police") || null,
      notes: formData.get("notes") || null,
    })
    .eq("id", bienId);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidateBien(bienId);
  return { success: true };
}

export async function addLocataire(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const lotId = String(formData.get("lot_id") ?? "");
  const bienId = String(formData.get("bien_id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  if (!lotId) return { error: "Logement manquant." };
  if (!nom) return { error: "Le nom du locataire est obligatoire." };

  const supabase = await createClient();
  const { error } = await supabase.from("locataires").insert({
    lot_id: lotId,
    nom,
    email: formData.get("email") || null,
    date_entree: formData.get("date_entree") || null,
    loyer_hc_cents: toCentsOrNull(formData.get("loyer_hc")) ?? 0,
    charges_cents: toCentsOrNull(formData.get("charges")) ?? 0,
    depot_garantie_cents: toCentsOrNull(formData.get("depot_garantie")),
    depot_garantie_date: formData.get("depot_garantie_date") || null,
    depot_garantie_mode: formData.get("depot_garantie_mode") || null,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidateBien(bienId);
  return { success: true };
}

export async function markLocataireSorti(id: string, bienId: string) {
  const supabase = await createClient();
  await supabase
    .from("locataires")
    .update({ date_sortie: new Date().toISOString().slice(0, 10) })
    .eq("id", id);
  revalidateBien(bienId);
}

export async function deleteLocataire(id: string, bienId: string) {
  const supabase = await createClient();
  await supabase.from("locataires").delete().eq("id", id);
  revalidateBien(bienId);
}
