"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { genererBailPdf, type BailDonnees } from "@/lib/bail";

/**
 * Une seule action, un seul appelant (BailForm), pour les biens en SCI comme en nom propre —
 * résout elle-même le type de propriété au lieu d'avoir deux copies qui pourraient diverger
 * (voir le bug corrigé sur les quittances : deux actions presque identiques, un correctif
 * appliqué à une seule en premier).
 */
export async function genererBail(
  lotId: string,
  locataireId: string,
  typeBail: "non_meuble" | "meuble",
  donnees: BailDonnees
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

  const pdfBytes = await genererBailPdf(donnees, {
    bienAdresse: bien.adresse as string,
    lotNom: lot.nom as string,
    typeBail,
  });

  const isSci = bien.owner_type === "sci";
  const ownerFolder = isSci ? `sci/${bien.sci_id}` : `hh/${bien.household_id}`;
  const fileName = `Bail_${(lot.nom as string).replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}.pdf`;
  const storagePath = `${ownerFolder}/baux/${Date.now()}_${fileName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
  });
  if (uploadError) return { error: "Erreur lors de la génération du fichier." };

  const { error: dbError } = await supabase.from("documents").insert({
    entity_type: isSci ? "sci" : "bien",
    entity_id: isSci ? bien.sci_id : lot.bien_id,
    dossier: "Baux",
    nom_fichier: fileName,
    storage_path: storagePath,
    taille_octets: pdfBytes.byteLength,
    uploaded_by: user.id,
  });
  if (dbError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Erreur lors de l'enregistrement." };
  }

  const dureeMois = donnees.duree.dureeAnnees ? donnees.duree.dureeAnnees * 12 : (donnees.duree.dureeReduiteMois ?? 0);

  const { error: bailDbError } = await supabase.from("baux").insert({
    sci_id: isSci ? bien.sci_id : null,
    household_id: isSci ? null : bien.household_id,
    bien_id: lot.bien_id,
    lot_id: lotId,
    locataire_id: locataireId,
    bien_adresse: bien.adresse as string,
    lot_nom: lot.nom as string,
    locataire_nom: donnees.locataires.map((l) => l.nom).join(" et "),
    type_bail: typeBail,
    date_prise_effet: donnees.duree.datePriseEffet,
    duree_mois: dureeMois,
    loyer_hc_cents: donnees.loyer.montantInitialCents,
    charges_cents: donnees.charges.montantCents,
    depot_garantie_cents: donnees.garantie.montantCents,
    donnees,
    storage_path: storagePath,
    created_by: user.id,
  });

  const { data: signed } = await supabase.storage.from("documents").createSignedUrl(storagePath, 3600);

  revalidatePath("/gerer/sci/documents");
  revalidatePath("/gerer/biens-propres");
  revalidatePath(`/gerer/biens-propres/${lot.bien_id}`);
  revalidatePath("/gerer/sci/appartements");

  if (bailDbError) {
    return { url: signed?.signedUrl, warning: "Bail généré, mais l'entrée dans l'archive n'a pas pu être enregistrée." };
  }
  return { url: signed?.signedUrl };
}
