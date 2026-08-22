"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genererQuittancePdf } from "@/lib/quittance";

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
      cle_repartition_defaut: formData.get("cle_repartition_defaut") || "surface",
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

export async function saveRepartitionLot(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const lotId = String(formData.get("lot_id") ?? "");
  const bienId = String(formData.get("bien_id") ?? "");
  if (!lotId) return { error: "Logement introuvable." };

  const surface = formData.get("surface_m2");
  const tantiemes = formData.get("tantiemes_millesimes");

  const supabase = await createClient();
  const { error } = await supabase
    .from("lots")
    .update({
      surface_m2: surface && surface !== "" ? parseFloat(String(surface).replace(",", ".")) : null,
      tantiemes_millesimes: tantiemes && tantiemes !== "" ? parseInt(String(tantiemes), 10) : null,
    })
    .eq("id", lotId);

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

export async function genererQuittance(lotId: string, mois: string): Promise<{ error?: string; warning?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: lot } = await supabase.from("lots").select("id, nom, bien_id").eq("id", lotId).single();
  if (!lot) return { error: "Logement introuvable." };

  const { data: bien } = await supabase.from("biens").select("adresse, household_id").eq("id", lot.bien_id).single();
  if (!bien || !bien.household_id) return { error: "Bien introuvable." };

  const { data: household } = await supabase.from("households").select("name").eq("id", bien.household_id).single();
  if (!household) return { error: "Foyer introuvable." };

  const { data: locataire } = await supabase
    .from("locataires")
    .select("nom, loyer_hc_cents, charges_cents")
    .eq("lot_id", lotId)
    .is("date_sortie", null)
    .maybeSingle();
  if (!locataire) return { error: "Aucun locataire actif sur ce logement." };

  const pdfBytes = await genererQuittancePdf({
    sciNom: household.name as string,
    bienAdresse: bien.adresse as string,
    lotNom: lot.nom as string,
    locataireNom: locataire.nom as string,
    mois,
    loyerHcCents: locataire.loyer_hc_cents as number,
    chargesCents: locataire.charges_cents as number,
  });

  const fileName = `Quittance_${(lot.nom as string).replace(/[^a-zA-Z0-9]/g, "_")}_${mois}.pdf`;
  const storagePath = `hh/${bien.household_id}/quittances/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
  });
  if (uploadError) return { error: "Erreur lors de la génération du fichier." };

  const { error: dbError } = await supabase.from("documents").insert({
    entity_type: "bien",
    entity_id: lot.bien_id,
    dossier: "Quittances",
    nom_fichier: fileName,
    storage_path: storagePath,
    taille_octets: pdfBytes.byteLength,
    uploaded_by: user.id,
  });
  if (dbError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Erreur lors de l'enregistrement." };
  }

  const { error: quittanceDbError } = await supabase.from("quittances").insert({
    household_id: bien.household_id,
    bien_id: lot.bien_id,
    lot_id: lotId,
    bien_adresse: bien.adresse as string,
    lot_nom: lot.nom as string,
    locataire_nom: locataire.nom as string,
    mois,
    loyer_hc_cents: locataire.loyer_hc_cents as number,
    charges_cents: locataire.charges_cents as number,
    storage_path: storagePath,
    created_by: user.id,
  });

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(storagePath, 3600);

  revalidateBien(lot.bien_id as string);
  if (quittanceDbError) {
    return { url: signed?.signedUrl, warning: "Quittance générée, mais l'entrée dans l'archive n'a pas pu être enregistrée." };
  }
  return { url: signed?.signedUrl };
}

const MAX_SIZE_OCTETS = 15 * 1024 * 1024; // 15 Mo

export async function addChargeBienPropre(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const bienId = String(formData.get("bien_id") ?? "");
  if (!bienId) return { error: "Bien introuvable." };

  const date = String(formData.get("date") ?? "");
  if (!date) return { error: "La date est obligatoire." };

  const montant = toCentsOrNull(formData.get("montant"));
  if (!montant || montant <= 0) return { error: "Montant invalide." };

  const periodeDebut = String(formData.get("periode_debut") ?? "") || null;
  const periodeFin = String(formData.get("periode_fin") ?? "") || null;
  if (!periodeDebut || !periodeFin) return { error: "La période couverte (début et fin) est obligatoire." };
  if (periodeFin < periodeDebut) return { error: "La fin de la période couverte doit être après son début." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const lotId = String(formData.get("lot_id") ?? "") || null;

  const { error } = await supabase.from("charges_biens_propres").insert({
    bien_id: bienId,
    lot_id: lotId,
    date,
    montant_cents: montant,
    categorie: formData.get("categorie") || null,
    periode_debut: periodeDebut,
    periode_fin: periodeFin,
    commentaire: formData.get("commentaire") || null,
    created_by: user.id,
  });

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidateBien(bienId);
  return { success: true };
}

export async function deleteChargeBienPropre(id: string, bienId: string) {
  const supabase = await createClient();
  const { data: charge } = await supabase.from("charges_biens_propres").select("justificatif_path").eq("id", id).single();
  if (charge?.justificatif_path) {
    await supabase.storage.from("documents").remove([charge.justificatif_path]);
  }
  await supabase.from("charges_biens_propres").delete().eq("id", id);
  revalidateBien(bienId);
}

export async function uploadChargeJustificatif(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const chargeId = String(formData.get("charge_id") ?? "");
  const bienId = String(formData.get("bien_id") ?? "");
  const file = formData.get("file") as File | null;
  if (!chargeId) return { error: "Charge introuvable." };
  if (!file || file.size === 0) return { error: "Choisis un fichier." };
  if (file.size > MAX_SIZE_OCTETS) return { error: "Fichier trop volumineux (15 Mo maximum)." };

  const supabase = await createClient();
  const { data: bien } = await supabase.from("biens").select("household_id").eq("id", bienId).single();
  if (!bien?.household_id) return { error: "Bien introuvable." };

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const storagePath = `hh/${bien.household_id}/charges/${chargeId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return { error: "Erreur lors de l'envoi du fichier." };

  const { error: dbError } = await supabase.from("charges_biens_propres").update({ justificatif_path: storagePath }).eq("id", chargeId);
  if (dbError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Erreur lors de l'enregistrement." };
  }

  revalidateBien(bienId);
  return { success: true };
}

export async function removeChargeJustificatif(chargeId: string, storagePath: string, bienId: string) {
  const supabase = await createClient();
  await supabase.storage.from("documents").remove([storagePath]);
  await supabase.from("charges_biens_propres").update({ justificatif_path: null }).eq("id", chargeId);
  revalidateBien(bienId);
}
