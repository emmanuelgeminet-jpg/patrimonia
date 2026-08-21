"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genererEtatDesLieuxPdf, type EtatDesLieuxDonnees } from "@/lib/etat-des-lieux";

/** Un seul générateur, un seul appelant — même principe que le bail. */
export async function genererEtatDesLieux(
  lotId: string,
  locataireId: string,
  type: "entree" | "sortie",
  dateEtatDesLieux: string,
  etatEntreeId: string | null,
  donnees: EtatDesLieuxDonnees
): Promise<{ error?: string; warning?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: lot } = await supabase.from("lots").select("id, nom, bien_id").eq("id", lotId).single();
  if (!lot) return { error: "Logement introuvable." };

  const { data: bien } = await supabase.from("biens").select("adresse, owner_type, sci_id, household_id").eq("id", lot.bien_id).single();
  if (!bien) return { error: "Bien introuvable." };

  const { data: locataire } = await supabase.from("locataires").select("nom").eq("id", locataireId).single();
  if (!locataire) return { error: "Locataire introuvable." };

  let dateEtatEntree: string | null = null;
  if (type === "sortie" && etatEntreeId) {
    const { data: entree } = await supabase.from("etats_des_lieux").select("date_etat_des_lieux").eq("id", etatEntreeId).maybeSingle();
    dateEtatEntree = (entree?.date_etat_des_lieux as string | undefined) ?? null;
  }

  const pdfBytes = await genererEtatDesLieuxPdf(donnees, {
    bienAdresse: bien.adresse as string,
    lotNom: lot.nom as string,
    type,
    dateEtatDesLieux,
    dateEtatEntree,
  });

  const isSci = bien.owner_type === "sci";
  const ownerFolder = isSci ? `sci/${bien.sci_id}` : `hh/${bien.household_id}`;
  const label = type === "entree" ? "EDL_entree" : "EDL_sortie";
  const fileName = `${label}_${(lot.nom as string).replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;
  const storagePath = `${ownerFolder}/etats-des-lieux/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
  });
  if (uploadError) return { error: "Erreur lors de la génération du fichier." };

  const { error: dbError } = await supabase.from("documents").insert({
    entity_type: isSci ? "sci" : "bien",
    entity_id: isSci ? bien.sci_id : lot.bien_id,
    dossier: "États des lieux",
    nom_fichier: fileName,
    storage_path: storagePath,
    taille_octets: pdfBytes.byteLength,
    uploaded_by: user.id,
  });
  if (dbError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Erreur lors de l'enregistrement." };
  }

  const { error: edlDbError } = await supabase.from("etats_des_lieux").insert({
    sci_id: isSci ? bien.sci_id : null,
    household_id: isSci ? null : bien.household_id,
    bien_id: lot.bien_id,
    lot_id: lotId,
    locataire_id: locataireId,
    bien_adresse: bien.adresse as string,
    lot_nom: lot.nom as string,
    locataire_nom: locataire.nom as string,
    type,
    date_etat_des_lieux: dateEtatDesLieux,
    etat_entree_id: type === "sortie" ? etatEntreeId : null,
    donnees,
    storage_path: storagePath,
    created_by: user.id,
  });

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(storagePath, 3600);

  revalidatePath("/gerer/sci/documents");
  revalidatePath("/gerer/biens-propres");
  revalidatePath(`/gerer/biens-propres/${lot.bien_id}`);
  revalidatePath("/gerer/sci/appartements");

  if (edlDbError) {
    return { url: signed?.signedUrl, warning: "État des lieux généré, mais l'entrée dans l'archive n'a pas pu être enregistrée." };
  }
  return { url: signed?.signedUrl };
}
