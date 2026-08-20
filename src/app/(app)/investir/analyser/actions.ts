"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

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

function toNumOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

function toIntOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

export async function createAnalyse(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, householdId } = await getHouseholdId();
  const adresse = String(formData.get("adresse") ?? "").trim();
  if (!adresse) return { error: "L'adresse est obligatoire." };

  const { data, error } = await supabase
    .from("analyses_biens")
    .insert({ household_id: householdId, adresse })
    .select("id")
    .single();

  if (error || !data) return { error: "Erreur lors de la création." };

  revalidatePath("/investir/analyser");
  redirect(`/investir/analyser/${data.id}`);
}

export async function deleteAnalyse(id: string) {
  const { supabase } = await getHouseholdId();
  await supabase.from("analyses_biens").delete().eq("id", id);
  revalidatePath("/investir/analyser");
  redirect("/investir/analyser");
}

export async function saveAnalyse(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase } = await getHouseholdId();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Analyse introuvable." };

  const adresse = String(formData.get("adresse") ?? "").trim();
  if (!adresse) return { error: "L'adresse est obligatoire." };

  const { error } = await supabase
    .from("analyses_biens")
    .update({
      adresse,
      statut: String(formData.get("statut") ?? "a_l_etude"),
      prix_annonce_cents: toCentsOrNull(formData.get("prix_annonce")),
      prix_offre_cents: toCentsOrNull(formData.get("prix_offre")),
      frais_notaire_cents: toCentsOrNull(formData.get("frais_notaire")),
      travaux_estimes_cents: toCentsOrNull(formData.get("travaux_estimes")),
      apport_cents: toCentsOrNull(formData.get("apport")),
      montant_emprunte_cents: toCentsOrNull(formData.get("montant_emprunte")),
      taux_pct: toNumOrNull(formData.get("taux")),
      duree_annees: toIntOrNull(formData.get("duree")),
      charges_annuelles_cents: toCentsOrNull(formData.get("charges_annuelles")),
      surface_m2: toNumOrNull(formData.get("surface")),
      notes: formData.get("notes") || null,
    })
    .eq("id", id);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(`/investir/analyser/${id}`);
  return { success: true };
}

export async function addLigneLoyer(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase } = await getHouseholdId();
  const analyseId = String(formData.get("analyse_id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  if (!analyseId) return { error: "Analyse introuvable." };
  if (!nom) return { error: "Le nom du lot est obligatoire." };

  const { error } = await supabase.from("analyses_biens_lots").insert({
    analyse_id: analyseId,
    nom,
    loyer_hc_cents: toCentsOrNull(formData.get("loyer_hc")) ?? 0,
    charges_cents: toCentsOrNull(formData.get("charges")) ?? 0,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(`/investir/analyser/${analyseId}`);
  return { success: true };
}

export async function deleteLigneLoyer(id: string, analyseId: string) {
  const { supabase } = await getHouseholdId();
  await supabase.from("analyses_biens_lots").delete().eq("id", id);
  revalidatePath(`/investir/analyser/${analyseId}`);
}
