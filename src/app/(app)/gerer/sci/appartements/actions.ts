"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genererQuittancePdf } from "@/lib/quittance";

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
    email: formData.get("email") || null,
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

export async function saveValeurVenale(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const lotId = String(formData.get("lot_id") ?? "");
  if (!lotId) return { error: "Lot introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lots")
    .update({ valeur_venale_cents: toCentsOrNull(formData.get("valeur_venale")) })
    .eq("id", lotId);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath(PATH_APPARTEMENTS);
  revalidatePath(PATH_VISION_GLOBALE);
  return { success: true };
}

export async function saveRepartitionLot(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const lotId = String(formData.get("lot_id") ?? "");
  if (!lotId) return { error: "Lot introuvable." };

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

export async function genererQuittance(lotId: string, mois: string): Promise<{ error?: string; warning?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: lot } = await supabase.from("lots").select("id, nom, bien_id").eq("id", lotId).single();
  if (!lot) return { error: "Logement introuvable." };

  const { data: bien } = await supabase.from("biens").select("adresse, sci_id").eq("id", lot.bien_id).single();
  if (!bien || !bien.sci_id) return { error: "Bien introuvable." };

  const { data: sci } = await supabase.from("sci").select("name, siren, adresse, logo_style, gerant_nom").eq("id", bien.sci_id).single();
  if (!sci) return { error: "SCI introuvable." };

  const { data: locataire } = await supabase
    .from("locataires")
    .select("nom, loyer_hc_cents, charges_cents")
    .eq("lot_id", lotId)
    .is("date_sortie", null)
    .maybeSingle();
  if (!locataire) return { error: "Aucun locataire actif sur ce logement." };

  // Le jour du "réglé le" vient du Journal comptable, pas d'une saisie manuelle — une
  // quittance ne devrait attester que d'un paiement réellement encaissé et enregistré.
  const [anneeStr, moisStr] = mois.split("-");
  const moisDebut = `${anneeStr}-${moisStr}-01`;
  const anneeNum = parseInt(anneeStr, 10);
  const moisNum = parseInt(moisStr, 10);
  const moisSuivantDebut =
    moisNum === 12 ? `${anneeNum + 1}-01-01` : `${anneeNum}-${String(moisNum + 1).padStart(2, "0")}-01`;

  const { data: encaissementsRows } = await supabase
    .from("journal_ecritures")
    .select("date, montant_cents")
    .eq("lot_id", lotId)
    .eq("type", "encaissement")
    .eq("financement", "banque_sci")
    .gte("date", moisDebut)
    .lt("date", moisSuivantDebut)
    .order("date", { ascending: true });

  const encaissements = encaissementsRows ?? [];
  const attenduCents = (locataire.loyer_hc_cents as number) + (locataire.charges_cents as number);
  const encaisseCents = encaissements.reduce((s, e) => s + (e.montant_cents as number), 0);

  if (encaissements.length === 0) {
    return {
      error:
        "Aucun encaissement de loyer trouvé dans le Journal comptable pour ce logement sur cette période. Enregistre d'abord le paiement (Concerne : ce logement, Financement : Banque SCI) avant de générer la quittance.",
    };
  }
  if (encaisseCents < attenduCents) {
    return {
      error: `Le loyer de cette période n'est encaissé que partiellement dans le Journal comptable (${(encaisseCents / 100).toFixed(2)} € sur ${(attenduCents / 100).toFixed(2)} € attendus) — complète l'enregistrement avant de générer la quittance.`,
    };
  }
  const datePaiement = encaissements[encaissements.length - 1].date as string;

  const pdfBytes = await genererQuittancePdf({
    sciNom: sci.name as string,
    siren: sci.siren as string | null,
    bailleurAdresse: sci.adresse as string | null,
    logoStyle: sci.logo_style as string | null,
    gerantNom: sci.gerant_nom as string | null,
    bienAdresse: bien.adresse as string,
    lotNom: lot.nom as string,
    locataireNom: locataire.nom as string,
    mois,
    loyerHcCents: locataire.loyer_hc_cents as number,
    chargesCents: locataire.charges_cents as number,
    datePaiement,
  });

  const fileName = `Quittance_${(lot.nom as string).replace(/[^a-zA-Z0-9]/g, "_")}_${mois}.pdf`;
  const storagePath = `sci/${bien.sci_id}/quittances/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
  });
  if (uploadError) return { error: "Erreur lors de la génération du fichier." };

  const { error: dbError } = await supabase.from("documents").insert({
    entity_type: "sci",
    entity_id: bien.sci_id,
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
    sci_id: bien.sci_id,
    bien_id: lot.bien_id,
    lot_id: lotId,
    bien_adresse: bien.adresse as string,
    lot_nom: lot.nom as string,
    locataire_nom: locataire.nom as string,
    mois,
    loyer_hc_cents: locataire.loyer_hc_cents as number,
    charges_cents: locataire.charges_cents as number,
    date_paiement: datePaiement,
    storage_path: storagePath,
    created_by: user.id,
  });

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(storagePath, 3600);

  revalidatePath(PATH_APPARTEMENTS);
  revalidatePath("/gerer/sci/documents");
  // La quittance elle-même (fichier + entrée Documents) a déjà réussi à ce stade — l'échec de
  // l'archive ne doit pas bloquer le téléchargement, mais Emmanuel doit le savoir plutôt que
  // de découvrir plus tard qu'une quittance manque silencieusement dans l'archive.
  if (quittanceDbError) {
    return { url: signed?.signedUrl, warning: "Quittance générée, mais l'entrée dans l'archive n'a pas pu être enregistrée." };
  }
  return { url: signed?.signedUrl };
}
