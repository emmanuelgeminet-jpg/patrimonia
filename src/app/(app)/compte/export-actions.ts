"use server";

import { createClient } from "@/lib/supabase/server";

export type ExporterDonneesResult = { error?: string; json?: string };

/**
 * Export JSON complet des données du foyer (et de sa SCI le cas échéant) — protection en cas
 * d'incident sur Supabase, indépendante de toute décision de commercialisation. Couvre les
 * tables financières/légales ; n'inclut PAS le contenu des fichiers stockés dans Storage
 * (quittances/baux/documents PDF), seulement leurs métadonnées (nom, dossier, date) — un export
 * des fichiers eux-mêmes serait un chantier à part (zip volumineux, hors scope ici).
 */
export async function exporterDonnees(): Promise<ExporterDonneesResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) return { error: "Profil introuvable." };
  const householdId = profile.household_id as string;

  const { data: household } = await supabase.from("households").select("*").eq("id", householdId).single();
  const { data: associeRow } = await supabase.from("sci_associes").select("sci_id").eq("household_id", householdId).limit(1).maybeSingle();
  const sciId = associeRow?.sci_id as string | undefined;

  const { data: sci } = sciId ? await supabase.from("sci").select("*").eq("id", sciId).single() : { data: null };
  const { data: sciAssocies } = sciId ? await supabase.from("sci_associes").select("*, households(name)").eq("sci_id", sciId) : { data: [] };

  const bienOrFilter = sciId ? `sci_id.eq.${sciId},household_id.eq.${householdId}` : `household_id.eq.${householdId}`;
  const { data: biens } = await supabase.from("biens").select("*").or(bienOrFilter);
  const bienIds = (biens ?? []).map((b) => b.id as string);

  const { data: lots } = bienIds.length ? await supabase.from("lots").select("*").in("bien_id", bienIds) : { data: [] };
  const lotIds = (lots ?? []).map((l) => l.id as string);

  const { data: locataires } = lotIds.length ? await supabase.from("locataires").select("*").in("lot_id", lotIds) : { data: [] };
  const locataireIds = (locataires ?? []).map((l) => l.id as string);

  const [
    { data: journalEcritures },
    { data: comptesCourantsMouvements },
    { data: sciEmprunts },
    { data: sciImmobilisations },
    { data: budgetTransactions },
    { data: budgetCategories },
    { data: profilInvestisseur },
    { data: analysesBiens },
    { data: loyerRevisions },
    { data: documentsMetadata },
  ] = await Promise.all([
    sciId ? supabase.from("journal_ecritures").select("*").eq("sci_id", sciId) : Promise.resolve({ data: [] }),
    sciId ? supabase.from("comptes_courants_mouvements").select("*").eq("sci_id", sciId) : Promise.resolve({ data: [] }),
    sciId ? supabase.from("sci_emprunts").select("*").eq("sci_id", sciId) : Promise.resolve({ data: [] }),
    sciId ? supabase.from("sci_immobilisations").select("*").eq("sci_id", sciId) : Promise.resolve({ data: [] }),
    supabase.from("budget_transactions").select("*").eq("household_id", householdId),
    supabase.from("budget_categories").select("*").eq("household_id", householdId),
    supabase.from("profil_investisseur").select("*").eq("household_id", householdId).maybeSingle(),
    supabase.from("analyses_biens").select("*").eq("household_id", householdId),
    locataireIds.length ? supabase.from("loyer_revisions").select("*").in("locataire_id", locataireIds) : Promise.resolve({ data: [] }),
    supabase
      .from("documents")
      .select("entity_type, entity_id, dossier, nom_fichier, taille_octets, created_at")
      .or(sciId ? `entity_id.eq.${sciId},entity_id.eq.${householdId}` : `entity_id.eq.${householdId}`),
  ]);

  const bauxOrFilter = sciId ? `sci_id.eq.${sciId},household_id.eq.${householdId}` : `household_id.eq.${householdId}`;
  const { data: baux } = await supabase
    .from("baux")
    .select("bien_adresse, lot_nom, locataire_nom, type_bail, date_prise_effet, duree_mois, loyer_hc_cents, charges_cents, depot_garantie_cents, donnees, created_at")
    .or(bauxOrFilter);
  const { data: etatsDesLieux } = await supabase
    .from("etats_des_lieux")
    .select("bien_adresse, lot_nom, locataire_nom, type, date_etat_des_lieux, donnees, created_at")
    .or(bauxOrFilter);
  const { data: quittances } = await supabase
    .from("quittances")
    .select("bien_adresse, lot_nom, locataire_nom, mois, loyer_hc_cents, charges_cents, date_paiement, created_at")
    .or(bauxOrFilter);

  const export_ = {
    genere_le: new Date().toISOString(),
    avertissement: "Cet export contient les données structurées (foyer, SCI, biens, locataires, comptabilité, baux, quittances...). Il n'inclut PAS le contenu des fichiers PDF/photos stockés (seulement leur nom et dossier) — télécharge-les séparément depuis les écrans Documents si besoin.",
    foyer: household,
    sci,
    associes_sci: sciAssocies,
    biens,
    lots,
    locataires,
    journal_ecritures: journalEcritures,
    comptes_courants_mouvements: comptesCourantsMouvements,
    emprunts_sci: sciEmprunts,
    immobilisations_sci: sciImmobilisations,
    budget_transactions: budgetTransactions,
    budget_categories: budgetCategories,
    profil_investisseur: profilInvestisseur,
    analyses_biens: analysesBiens,
    revisions_de_loyer: loyerRevisions,
    baux,
    etats_des_lieux: etatsDesLieux,
    quittances,
    documents_metadata: documentsMetadata,
  };

  return { json: JSON.stringify(export_, null, 2) };
}
