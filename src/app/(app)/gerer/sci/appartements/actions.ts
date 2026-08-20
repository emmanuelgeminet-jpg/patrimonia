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

export async function genererQuittance(lotId: string, mois: string): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: lot } = await supabase.from("lots").select("id, nom, bien_id").eq("id", lotId).single();
  if (!lot) return { error: "Logement introuvable." };

  const { data: bien } = await supabase.from("biens").select("adresse, sci_id").eq("id", lot.bien_id).single();
  if (!bien || !bien.sci_id) return { error: "Bien introuvable." };

  const { data: sci } = await supabase.from("sci").select("name, siren").eq("id", bien.sci_id).single();
  if (!sci) return { error: "SCI introuvable." };

  const { data: locataire } = await supabase
    .from("locataires")
    .select("nom, loyer_hc_cents, charges_cents")
    .eq("lot_id", lotId)
    .is("date_sortie", null)
    .maybeSingle();
  if (!locataire) return { error: "Aucun locataire actif sur ce logement." };

  const pdfBytes = await genererQuittancePdf({
    sciNom: sci.name as string,
    siren: sci.siren as string | null,
    bienAdresse: bien.adresse as string,
    lotNom: lot.nom as string,
    locataireNom: locataire.nom as string,
    mois,
    loyerHcCents: locataire.loyer_hc_cents as number,
    chargesCents: locataire.charges_cents as number,
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

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(storagePath, 3600);

  revalidatePath(PATH_APPARTEMENTS);
  revalidatePath("/gerer/sci/documents");
  return { url: signed?.signedUrl };
}
