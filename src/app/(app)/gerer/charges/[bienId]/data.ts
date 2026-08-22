import { createClient } from "@/lib/supabase/server";
import type { ChargeLigne, LotRepartitionInput, OccupationInput, ClefRepartition } from "@/lib/charges-regularisation";

export type ChargeLigneAffichage = ChargeLigne & {
  libelle: string;
  categorie: string | null;
};

export type BienChargesData = {
  bienId: string;
  bienAdresse: string;
  isSci: boolean;
  sciId: string | null;
  householdId: string | null;
  cleRepartitionDefaut: ClefRepartition;
  lots: LotRepartitionInput[];
  occupations: OccupationInput[];
  chargeLignes: ChargeLigneAffichage[];
  ecrituresSansPeriodeCount: number;
};

/**
 * Point d'entrée unique pour charger les données nécessaires à une régularisation, utilisé à
 * la fois par la page (aperçu client) et par l'action serveur (recalcul faisant foi au moment
 * d'enregistrer) — pour ne jamais avoir deux requêtes qui pourraient diverger.
 */
export async function chargerDonneesBien(bienId: string): Promise<BienChargesData | null> {
  const supabase = await createClient();

  const { data: bien } = await supabase
    .from("biens")
    .select("id, adresse, owner_type, sci_id, household_id, cle_repartition_defaut")
    .eq("id", bienId)
    .maybeSingle();
  if (!bien) return null;

  const isSci = bien.owner_type === "sci";

  const { data: lotsRows } = await supabase
    .from("lots")
    .select("id, nom, surface_m2, tantiemes_millesimes")
    .eq("bien_id", bienId)
    .order("nom");
  const lots: LotRepartitionInput[] = (lotsRows ?? []).map((l) => ({
    lotId: l.id as string,
    lotNom: l.nom as string,
    surfaceM2: l.surface_m2 as number | null,
    tantiemes: l.tantiemes_millesimes as number | null,
  }));
  const lotIds = lots.map((l) => l.lotId);

  const { data: locatairesRows } = lotIds.length
    ? await supabase.from("locataires").select("id, nom, lot_id, date_entree, date_sortie, charges_cents").in("lot_id", lotIds)
    : { data: [] as { id: string; nom: string; lot_id: string; date_entree: string | null; date_sortie: string | null; charges_cents: number }[] };

  const occupations: OccupationInput[] = (locatairesRows ?? []).map((l) => ({
    locataireId: l.id as string,
    locataireNom: l.nom as string,
    lotId: l.lot_id as string,
    dateEntree: l.date_entree as string | null,
    dateSortie: l.date_sortie as string | null,
    provisionMensuelleCents: l.charges_cents as number,
  }));

  let chargeLignes: ChargeLigneAffichage[] = [];
  let ecrituresSansPeriodeCount = 0;

  if (isSci) {
    const orParts = [`bien_id.eq.${bienId}`];
    if (lotIds.length) orParts.push(`lot_id.in.(${lotIds.join(",")})`);

    const { data: rows } = await supabase
      .from("journal_ecritures")
      .select("id, montant_cents, categorie_charge, libelle, periode_debut, periode_fin, lot_id")
      .eq("sci_id", bien.sci_id)
      .eq("type", "decaissement")
      .eq("financement", "banque_sci")
      .is("associe_mouvement_type", null)
      .or(orParts.join(","));

    for (const r of rows ?? []) {
      if (!r.periode_debut || !r.periode_fin) {
        ecrituresSansPeriodeCount++;
        continue;
      }
      chargeLignes.push({
        id: r.id as string,
        montantCents: r.montant_cents as number,
        lotId: r.lot_id as string | null,
        periodeDebut: r.periode_debut as string,
        periodeFin: r.periode_fin as string,
        libelle: r.libelle as string,
        categorie: r.categorie_charge as string | null,
      });
    }
  } else {
    const { data: rows } = await supabase
      .from("charges_biens_propres")
      .select("id, montant_cents, categorie, commentaire, periode_debut, periode_fin, lot_id")
      .eq("bien_id", bienId);

    chargeLignes = (rows ?? []).map((r) => ({
      id: r.id as string,
      montantCents: r.montant_cents as number,
      lotId: r.lot_id as string | null,
      periodeDebut: r.periode_debut as string,
      periodeFin: r.periode_fin as string,
      libelle: (r.categorie as string | null) ?? (r.commentaire as string | null) ?? "Charge",
      categorie: r.categorie as string | null,
    }));
  }

  return {
    bienId,
    bienAdresse: bien.adresse as string,
    isSci,
    sciId: bien.sci_id as string | null,
    householdId: bien.household_id as string | null,
    cleRepartitionDefaut: ((bien.cle_repartition_defaut as ClefRepartition | null) ?? "surface"),
    lots,
    occupations,
    chargeLignes,
    ecrituresSansPeriodeCount,
  };
}
