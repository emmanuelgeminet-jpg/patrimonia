"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function getHouseholdId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) throw new Error("Profil introuvable");
  return { supabase, householdId: profile.household_id as string };
}

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

function toPlainIntOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

export type SaveState = { error?: string; success?: boolean };

export async function saveSituation(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, householdId } = await getHouseholdId();
  const { error } = await supabase
    .from("profil_investisseur")
    .upsert(
      {
        household_id: householdId,
        composition_foyer: formData.get("composition_foyer"),
        regime_matrimonial: formData.get("regime_matrimonial"),
        donation_entre_epoux: formData.get("donation_entre_epoux") === "Oui",
        nb_enfants: toPlainIntOrNull(formData.get("nb_enfants")),
        ages_conjoints: formData.get("ages_conjoints"),
        situation_professionnelle: formData.get("situation_professionnelle"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" }
    );

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/investir/profil");
  return { success: true };
}

export async function saveObjectifs(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, householdId } = await getHouseholdId();
  const { error } = await supabase
    .from("profil_investisseur")
    .upsert(
      {
        household_id: householdId,
        horizon_investissement: formData.get("horizon_investissement"),
        objectif_principal: formData.get("objectif_principal"),
        appetence_risque: formData.get("appetence_risque"),
        capacite_apport: formData.get("capacite_apport"),
        epargne_precaution_cents: toCentsOrNull(formData.get("epargne_precaution")),
        objectif_libelle: formData.get("objectif_libelle") || null,
        objectif_montant_cents: toCentsOrNull(formData.get("objectif_montant")),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" }
    );

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/investir/profil");
  return { success: true };
}

export async function savePatrimoineImmobilier(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, householdId } = await getHouseholdId();
  const { error } = await supabase
    .from("profil_investisseur")
    .upsert(
      {
        household_id: householdId,
        residence_principale_valeur_cents: toCentsOrNull(formData.get("residence_principale")) ?? 0,
        residence_secondaire_valeur_cents: toCentsOrNull(formData.get("residence_secondaire")) ?? 0,
        biens_locatifs_valeur_cents: toCentsOrNull(formData.get("biens_locatifs")) ?? 0,
        scpi_valeur_cents: toCentsOrNull(formData.get("scpi")) ?? 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "household_id" }
    );

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/investir/profil");
  return { success: true };
}

const CATEGORIES_FINANCIERES = ["livret", "pea", "assurance_vie", "per", "compte_courant", "autre"] as const;

export async function addPatrimoineLigne(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const categorie = String(formData.get("categorie") ?? "");
  if (!CATEGORIES_FINANCIERES.includes(categorie as (typeof CATEGORIES_FINANCIERES)[number])) {
    return { error: "Catégorie invalide." };
  }

  const { supabase, householdId } = await getHouseholdId();
  const { error } = await supabase.from("profil_patrimoine_financier_lignes").insert({
    household_id: householdId,
    categorie,
    etablissement: formData.get("etablissement") || null,
    type_produit: formData.get("type_produit") || null,
    titulaire: formData.get("titulaire") || null,
    valeur_cents: toCentsOrNull(formData.get("valeur")) ?? 0,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/investir/profil");
  return { success: true };
}

export async function deletePatrimoineLigne(id: string) {
  const { supabase } = await getHouseholdId();
  await supabase.from("profil_patrimoine_financier_lignes").delete().eq("id", id);
  revalidatePath("/investir/profil");
}

export async function addEmprunt(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, householdId } = await getHouseholdId();
  const objet = String(formData.get("objet") ?? "").trim();
  if (!objet) return { error: "Donne un nom à cet emprunt." };

  const { error } = await supabase.from("profil_emprunts").insert({
    household_id: householdId,
    objet,
    capital_emprunte_cents: toCentsOrNull(formData.get("capital")),
    taux_pct: formData.get("taux") ? parseFloat(String(formData.get("taux")).replace(",", ".")) : null,
    duree_mois: toPlainIntOrNull(formData.get("duree_mois")),
    mensualite_cents: toCentsOrNull(formData.get("mensualite")),
    crd_cents: toCentsOrNull(formData.get("crd")),
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/investir/profil");
  return { success: true };
}

export async function deleteEmprunt(id: string) {
  const { supabase } = await getHouseholdId();
  await supabase.from("profil_emprunts").delete().eq("id", id);
  revalidatePath("/investir/profil");
}
