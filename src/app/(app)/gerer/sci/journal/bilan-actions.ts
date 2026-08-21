"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

const JOURNAL_PATH = "/gerer/sci/journal";

async function getSciContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) throw new Error("Profil introuvable");

  const { data: associe } = await supabase
    .from("sci_associes")
    .select("sci_id")
    .eq("household_id", profile.household_id)
    .limit(1)
    .maybeSingle();
  if (!associe) throw new Error("Aucune SCI associée à ce foyer");

  return { supabase, sciId: associe.sci_id as string };
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

export async function addEmprunt(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();

  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!libelle) return { error: "Le libellé est obligatoire." };

  const capital = toCentsOrNull(formData.get("capital_emprunte"));
  const taux = toNumOrNull(formData.get("taux"));
  const duree = toIntOrNull(formData.get("duree_mois"));
  const dateDebut = String(formData.get("date_debut") ?? "");
  if (!capital || capital <= 0) return { error: "Capital emprunté invalide." };
  if (taux === null || taux < 0) return { error: "Taux invalide." };
  if (!duree || duree <= 0) return { error: "Durée invalide." };
  if (!dateDebut) return { error: "La date de départ est obligatoire." };

  const bienId = String(formData.get("bien_id") ?? "") || null;

  const { error } = await supabase.from("sci_emprunts").insert({
    sci_id: sciId,
    bien_id: bienId,
    libelle,
    capital_emprunte_cents: capital,
    taux_pct: taux,
    duree_mois: duree,
    date_debut: dateDebut,
    assurance_emprunteur_cents: toCentsOrNull(formData.get("assurance_emprunteur")),
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(JOURNAL_PATH);
  return { success: true };
}

export async function deleteEmprunt(id: string) {
  const { supabase } = await getSciContext();
  await supabase.from("sci_emprunts").delete().eq("id", id);
  revalidatePath(JOURNAL_PATH);
}

export async function addImmobilisation(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();

  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!libelle) return { error: "Le libellé est obligatoire." };

  const valeur = toCentsOrNull(formData.get("valeur_amortissable"));
  const duree = toNumOrNull(formData.get("duree_annees"));
  const dateMiseEnService = String(formData.get("date_mise_en_service") ?? "");
  if (!valeur || valeur <= 0) return { error: "Valeur amortissable invalide." };
  if (!duree || duree <= 0) return { error: "Durée invalide." };
  if (!dateMiseEnService) return { error: "La date de mise en service est obligatoire." };

  const bienId = String(formData.get("bien_id") ?? "") || null;

  const { error } = await supabase.from("sci_immobilisations").insert({
    sci_id: sciId,
    bien_id: bienId,
    libelle,
    valeur_amortissable_cents: valeur,
    duree_annees: duree,
    date_mise_en_service: dateMiseEnService,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(JOURNAL_PATH);
  return { success: true };
}

export async function deleteImmobilisation(id: string) {
  const { supabase } = await getSciContext();
  await supabase.from("sci_immobilisations").delete().eq("id", id);
  revalidatePath(JOURNAL_PATH);
}

export async function saveInfosSci(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return { error: "Le nom de la SCI est obligatoire." };

  const { error } = await supabase
    .from("sci")
    .update({
      name: nom,
      siren: formData.get("siren") || null,
      adresse: formData.get("adresse") || null,
      gerant_nom: formData.get("gerant_nom") || null,
      date_creation: formData.get("date_creation") || null,
      regime_fiscal: formData.get("regime_fiscal") || null,
      capital_social_cents: toCentsOrNull(formData.get("capital_social")),
    })
    .eq("id", sciId);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(JOURNAL_PATH);
  revalidatePath("/gerer/sci/appartements");
  revalidatePath("/gerer/sci/documents");
  revalidatePath("/gerer/sci/vision-globale");
  return { success: true };
}

export async function saveResultatReporte(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();

  const { error } = await supabase
    .from("sci")
    .update({ resultat_reporte_cents: toCentsOrNull(formData.get("resultat_reporte")) ?? 0 })
    .eq("id", sciId);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(JOURNAL_PATH);
  return { success: true };
}
