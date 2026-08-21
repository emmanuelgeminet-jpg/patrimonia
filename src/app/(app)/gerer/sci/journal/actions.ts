"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv, parsePdfText, decodeFileContent } from "@/lib/budget";
import { rapprocher } from "@/lib/rapprochement";

export type SaveState = { error?: string; success?: boolean };

const JOURNAL_PATH = "/gerer/sci/journal";
const COMPTES_COURANTS_PATH = "/gerer/sci/comptes-courants";
const MAX_SIZE_OCTETS = 15 * 1024 * 1024; // 15 Mo

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

  return { supabase, userId: user.id, householdId: profile.household_id as string, sciId: associe.sci_id as string };
}

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

export async function addEcriture(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId, userId } = await getSciContext();

  const type = String(formData.get("type") ?? "");
  if (type !== "encaissement" && type !== "decaissement") return { error: "Type invalide." };

  const date = String(formData.get("date") ?? "");
  if (!date) return { error: "La date est obligatoire." };

  const libelle = String(formData.get("libelle") ?? "").trim();
  if (!libelle) return { error: "Le libellé est obligatoire." };

  const montant = toCentsOrNull(formData.get("montant"));
  if (!montant || montant <= 0) return { error: "Montant invalide." };

  const concerne = String(formData.get("concerne") ?? "");
  let bienId: string | null = null;
  let lotId: string | null = null;
  if (concerne.startsWith("bien:")) {
    bienId = concerne.slice(5) || null;
  } else if (concerne.startsWith("lot:")) {
    const [lot, bien] = concerne.slice(4).split("|");
    lotId = lot || null;
    bienId = bien || null;
  }

  const financement = String(formData.get("financement") ?? "banque_sci");
  if (financement !== "banque_sci" && financement !== "avance_associe") return { error: "Financement invalide." };

  let associeHouseholdId: string | null = null;
  let associeMouvementType: "apport" | "avance" | "remboursement" | null = null;

  if (financement === "avance_associe") {
    associeHouseholdId = String(formData.get("associe_household_id") ?? "") || null;
    if (!associeHouseholdId) return { error: "Choisis quel foyer a avancé cette dépense." };
    associeMouvementType = "avance";
  } else {
    const lien = String(formData.get("associe_mouvement_type") ?? "");
    if (lien === "apport" || lien === "remboursement") {
      associeHouseholdId = String(formData.get("associe_household_id") ?? "") || null;
      if (!associeHouseholdId) return { error: "Choisis quel foyer est concerné par cet apport/remboursement." };
      associeMouvementType = lien;
    }
  }

  // Rattacher une écriture à un emprunt n'a de sens que pour une mensualité réellement
  // décaissée du compte SCI, sans lien par ailleurs avec un compte courant — même
  // contrainte que côté base (ecriture_emprunt_coherent).
  let empruntId: string | null = null;
  if (financement === "banque_sci" && type === "decaissement" && !associeMouvementType) {
    empruntId = String(formData.get("emprunt_id") ?? "") || null;
  }

  const { data: inserted, error } = await supabase
    .from("journal_ecritures")
    .insert({
      sci_id: sciId,
      date,
      type,
      montant_cents: montant,
      libelle,
      mode_paiement: formData.get("mode_paiement") || null,
      bien_id: bienId,
      lot_id: lotId,
      commentaire: formData.get("commentaire") || null,
      categorie_charge: type === "decaissement" ? formData.get("categorie_charge") || null : null,
      financement,
      associe_household_id: associeHouseholdId,
      associe_mouvement_type: associeMouvementType,
      emprunt_id: empruntId,
      created_by: userId,
    })
    .select("id")
    .single();

  if (error || !inserted) return { error: "Erreur lors de l'enregistrement." };

  if (associeHouseholdId && associeMouvementType) {
    const { error: ccError } = await supabase.from("comptes_courants_mouvements").insert({
      sci_id: sciId,
      household_id: associeHouseholdId,
      date,
      type: associeMouvementType,
      montant_cents: montant,
      commentaire: libelle,
      journal_ecriture_id: inserted.id,
      created_by: userId,
    });
    if (ccError) {
      revalidatePath(JOURNAL_PATH);
      revalidatePath(COMPTES_COURANTS_PATH);
      return { error: "Écriture enregistrée, mais le mouvement de compte courant lié n'a pas pu être créé." };
    }
  }

  revalidatePath(JOURNAL_PATH);
  revalidatePath(COMPTES_COURANTS_PATH);
  return { success: true };
}

export async function deleteEcriture(id: string) {
  const { supabase } = await getSciContext();
  await supabase.from("journal_ecritures").delete().eq("id", id);
  revalidatePath(JOURNAL_PATH);
}

export async function uploadJustificatif(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();
  const ecritureId = String(formData.get("ecriture_id") ?? "");
  const file = formData.get("file") as File | null;
  if (!ecritureId) return { error: "Écriture introuvable." };
  if (!file || file.size === 0) return { error: "Choisis un fichier." };
  if (file.size > MAX_SIZE_OCTETS) return { error: "Fichier trop volumineux (15 Mo maximum)." };

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `sci/${sciId}/journal/${ecritureId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return { error: "Erreur lors de l'envoi du fichier." };

  const { error: dbError } = await supabase
    .from("journal_ecritures")
    .update({ justificatif_path: storagePath })
    .eq("id", ecritureId);
  if (dbError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Erreur lors de l'enregistrement." };
  }

  revalidatePath(JOURNAL_PATH);
  return { success: true };
}

export async function removeJustificatif(ecritureId: string, storagePath: string) {
  const { supabase } = await getSciContext();
  await supabase.storage.from("documents").remove([storagePath]);
  await supabase.from("journal_ecritures").update({ justificatif_path: null }).eq("id", ecritureId);
  revalidatePath(JOURNAL_PATH);
}

export async function saveSoldeOuverture(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();
  const { error } = await supabase
    .from("sci")
    .update({
      solde_ouverture_cents: toCentsOrNull(formData.get("solde")) ?? 0,
      solde_ouverture_date: formData.get("date") || null,
    })
    .eq("id", sciId);
  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(JOURNAL_PATH);
  return { success: true };
}

export async function addMouvementCompteCourant(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId, userId } = await getSciContext();

  const type = String(formData.get("type") ?? "");
  if (!["apport", "avance", "remboursement"].includes(type)) return { error: "Type invalide." };

  const date = String(formData.get("date") ?? "");
  if (!date) return { error: "La date est obligatoire." };

  const householdId = String(formData.get("household_id") ?? "");
  if (!householdId) return { error: "Foyer manquant." };

  const montant = toCentsOrNull(formData.get("montant"));
  if (!montant || montant <= 0) return { error: "Montant invalide." };

  const { error } = await supabase.from("comptes_courants_mouvements").insert({
    sci_id: sciId,
    household_id: householdId,
    date,
    type,
    montant_cents: montant,
    commentaire: formData.get("commentaire") || null,
    created_by: userId,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(COMPTES_COURANTS_PATH);
  revalidatePath(JOURNAL_PATH);
  return { success: true };
}

export async function deleteMouvementCompteCourant(id: string) {
  const { supabase } = await getSciContext();
  await supabase.from("comptes_courants_mouvements").delete().eq("id", id);
  revalidatePath(COMPTES_COURANTS_PATH);
  revalidatePath(JOURNAL_PATH);
}

export async function ajouterAssocie(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return { error: "Le nom du foyer est obligatoire." };

  const { error } = await supabase.rpc("add_sci_associe", {
    p_sci_id: sciId,
    p_nom_foyer: nom,
    p_parts: parseInt(String(formData.get("parts") ?? "0"), 10) || 0,
    p_pourcentage: parseFloat(String(formData.get("pourcentage") ?? "0").replace(",", ".")) || 0,
  });

  if (error) return { error: error.message };
  revalidatePath(COMPTES_COURANTS_PATH);
  return { success: true };
}

export async function saveSoldeOuvertureAssocie(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const { supabase, sciId } = await getSciContext();
  const householdId = String(formData.get("household_id") ?? "");
  if (!householdId) return { error: "Foyer manquant." };

  const { error } = await supabase
    .from("sci_associes")
    .update({ solde_ouverture_cents: toCentsOrNull(formData.get("solde")) ?? 0 })
    .eq("sci_id", sciId)
    .eq("household_id", householdId);
  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(COMPTES_COURANTS_PATH);
  return { success: true };
}

export type RapprochementState = {
  error?: string;
  resultat?: {
    matches: number;
    lignesBancairesSansEcriture: { date: string; libelle: string; montantCents: number }[];
    ecrituresSansLigneBancaire: { id: string; date: string; libelle: string; montantCents: number; type: "encaissement" | "decaissement" }[];
  };
};

export async function rapprocherReleve(_prev: RapprochementState, formData: FormData): Promise<RapprochementState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choisis un relevé avant de lancer le rapprochement." };

  const { supabase, sciId } = await getSciContext();

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  let transactions;
  let errors: string[];
  if (isPdf) {
    const { PDFParse } = await import("pdf-parse");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText({ cellSeparator: "\t" });
    await parser.destroy();
    ({ transactions, errors } = parsePdfText(result.text));
  } else {
    const content = decodeFileContent(await file.arrayBuffer());
    ({ transactions, errors } = parseCsv(content));
  }

  if (transactions.length === 0) return { error: errors[0] ?? "Aucune transaction reconnue dans ce fichier." };

  const dates = transactions.map((t) => t.date).sort();
  const { data: ecrituresRows } = await supabase
    .from("journal_ecritures")
    .select("id, date, type, montant_cents, libelle")
    .eq("sci_id", sciId)
    .eq("financement", "banque_sci")
    .gte("date", dates[0])
    .lte("date", dates[dates.length - 1]);

  const ecritures = (ecrituresRows ?? []).map((e) => ({
    id: e.id as string,
    date: e.date as string,
    type: e.type as "encaissement" | "decaissement",
    montantCents: e.montant_cents as number,
    libelle: e.libelle as string,
  }));

  const resultat = rapprocher(transactions, ecritures);

  return {
    resultat: {
      matches: resultat.matches,
      lignesBancairesSansEcriture: resultat.lignesBancairesSansEcriture.map((l) => ({
        date: l.date,
        libelle: l.libelle,
        montantCents: l.montant_cents,
      })),
      ecrituresSansLigneBancaire: resultat.ecrituresSansLigneBancaire,
    },
  };
}
