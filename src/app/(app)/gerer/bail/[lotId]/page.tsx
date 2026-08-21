import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BailForm from "./BailForm";
import { mobilierParDefaut, type BailDonnees } from "@/lib/bail";

export default async function BailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lotId: string }>;
  searchParams: Promise<{ locataireId?: string }>;
}) {
  const { lotId } = await params;
  const { locataireId } = await searchParams;
  const supabase = await createClient();

  const { data: lot } = await supabase.from("lots").select("*").eq("id", lotId).maybeSingle();
  if (!lot) notFound();

  const { data: bien } = await supabase.from("biens").select("*").eq("id", lot.bien_id).maybeSingle();
  if (!bien) notFound();

  const locataireQuery = supabase.from("locataires").select("*").eq("lot_id", lotId);
  const { data: locataire } = locataireId
    ? await locataireQuery.eq("id", locataireId).maybeSingle()
    : await locataireQuery.is("date_sortie", null).maybeSingle();

  if (!locataire) {
    return (
      <section className="section">
        <div className="crumb">Gérer <b>› Bail</b></div>
        <h1>Bail — {lot.nom as string}</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>
          Aucun locataire actif sur ce logement — ajoute-le d&apos;abord avant de générer un bail.
        </div>
      </section>
    );
  }

  let bailleurNom = "";
  let bailleurAdresse = "";
  let siren: string | null = null;
  let gerantNom: string | null = null;
  let logoStyle: string | null = null;

  if (bien.owner_type === "sci") {
    const { data: sci } = await supabase.from("sci").select("*").eq("id", bien.sci_id).maybeSingle();
    bailleurNom = (sci?.name as string) ?? "";
    bailleurAdresse = (sci?.adresse as string) ?? "";
    siren = (sci?.siren as string | null) ?? null;
    gerantNom = (sci?.gerant_nom as string | null) ?? null;
    logoStyle = (sci?.logo_style as string | null) ?? null;
  } else {
    const { data: household } = await supabase.from("households").select("*").eq("id", bien.household_id).maybeSingle();
    bailleurNom = (household?.name as string) ?? "";
    bailleurAdresse = (household?.adresse as string | null) ?? "";
  }

  const autresParties = (bien.autres_parties_logement as Record<string, unknown>) ?? {};
  const equipements = (bien.equipements_logement as Record<string, unknown>) ?? {};
  const equipementsCommuns = (bien.equipements_communs as Record<string, unknown>) ?? {};

  const initial: BailDonnees = {
    bailleur: {
      nom: bailleurNom,
      adresse: bailleurAdresse,
      estPersonneMorale: bien.owner_type === "sci",
      sciEntreParentsAllies: false,
      siren,
      gerantNom,
      email: null,
      logoStyle,
      mandataire: null,
      garant: null,
    },
    locataires: [
      { nom: locataire.nom as string, email: locataire.email as string | null },
      ...(locataire.colocataire_nom ? [{ nom: locataire.colocataire_nom as string, email: locataire.colocataire_email as string | null }] : []),
    ],
    logement: {
      adresse: bien.adresse as string,
      batiment: null,
      etage: lot.nom as string,
      porte: null,
      identifiantFiscal: (bien.identifiant_fiscal_logement as string | null) ?? null,
      immeubleCollectif: bien.type === "immeuble" || (bien.nombre_lots as number | null ?? 0) > 1,
      copropriete: !(bien.monopropriete as boolean),
      periodeConstruction: (bien.periode_construction as string | null) ?? null,
      surfaceHabitableM2: (lot.surface_m2 as number | null) ?? null,
      nombrePiecesPrincipales: (lot.nombre_pieces_principales as number | null) ?? null,
      autresParties: {
        grenier: !!autresParties.grenier,
        combleAmenage: !!autresParties.combleAmenage,
        combleNonAmenage: !!autresParties.combleNonAmenage,
        terrasse: !!autresParties.terrasse,
        balcon: !!autresParties.balcon,
        loggia: !!autresParties.loggia,
        jardin: !!autresParties.jardin,
        autre: (autresParties.autre as string | null) ?? null,
      },
      equipements: {
        cuisineEquipee: !!equipements.cuisineEquipee,
        installationsSanitaires: !!equipements.installationsSanitaires,
        autre: (equipements.autre as string | null) ?? null,
      },
      chauffageType: (bien.chauffage_type as "individuel" | "collectif" | null) ?? null,
      chauffageModalites: (bien.chauffage_modalites_repartition as string | null) ?? null,
      eauChaudeType: (bien.eau_chaude_type as "individuelle" | "collective" | null) ?? null,
      eauChaudeModalites: (bien.eau_chaude_modalites_repartition as string | null) ?? null,
      dpeClasse: (bien.dpe_classe as string | null) ?? null,
    },
    destination: { usage: "habitation", profession: null },
    accessoiresPrivatifs: {
      caveNumero: (lot.cave_numero as string | null) ?? null,
      parkingNumero: (lot.parking_numero as string | null) ?? null,
      garageNumero: (lot.garage_numero as string | null) ?? null,
    },
    accessoiresCommuns: {
      garageVelo: !!equipementsCommuns.garageVelo,
      ascenseur: !!equipementsCommuns.ascenseur,
      espacesVerts: !!equipementsCommuns.espacesVerts,
      airesJeux: !!equipementsCommuns.airesJeux,
      laverie: !!equipementsCommuns.laverie,
      localPoubelles: !!equipementsCommuns.localPoubelles,
      gardiennage: !!equipementsCommuns.gardiennage,
      autre: (equipementsCommuns.autre as string | null) ?? null,
    },
    tic: { television: null, internet: null },
    duree: { datePriseEffet: new Date().toISOString().slice(0, 10), dureeAnnees: 3, dureeReduiteMois: null, dureeReduiteJustification: null },
    loyer: {
      montantInitialCents: (locataire.loyer_hc_cents as number) ?? 0,
      zoneTendue: !!(bien.zone_tendue as boolean),
      loyerReferenceApplicable: false,
      loyerReferenceM2Cents: (bien.loyer_reference_m2_cents as number | null) ?? null,
      loyerReferenceMajoreM2Cents: (bien.loyer_reference_majore_m2_cents as number | null) ?? null,
      complementLoyerCents: null,
      complementLoyerJustification: null,
      dernierLocataireMontantCents: null,
      dernierLocataireDateVersement: null,
      dernierLocataireDateDerniereRevision: null,
      revisionJourMois: null,
      revisionTrimestreIrl: null,
    },
    charges: { mode: "provisions", montantCents: (locataire.charges_cents as number) ?? 0 },
    partageEconomiesCharges: null,
    assuranceColocataires: null,
    paiement: { jourPaiement: 1, payableA: "bailleur" },
    depensesEnergetiquesMontantAnnuelCents: null,
    depensesEnergetiquesAnneeReference: null,
    travaux: {
      ameliorationDecence: null,
      majorationNature: null,
      majorationModalites: null,
      majorationDelai: null,
      majorationMontantCents: null,
      diminutionNature: null,
      diminutionModalites: null,
      diminutionDelai: null,
      diminutionMontantCents: null,
      diminutionDureeMois: null,
    },
    garantie: { montantCents: (locataire.depot_garantie_cents as number | null) ?? (locataire.loyer_hc_cents as number) ?? 0, type: "depot_garantie" },
    honoraires: { concoursAgence: false, visiteDossierRedactionM2Cents: null, etatDesLieuxM2Cents: null, repartition: [] },
    autresConditions: null,
    annexes: {
      reglementCopropriete: false,
      dossierDiagnosticTechnique: true,
      noticeInformation: true,
      etatDesLieux: true,
      inventaireMobilier: true,
      autorisationMiseEnLocation: false,
      referencesLoyersVoisinage: false,
    },
    mobilier: mobilierParDefaut(),
    lieuSignature: (bien.ville as string | null) ?? "",
  };

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Bail — {bien.adresse as string} — {lot.nom as string}</b></div>
      <h1>Générer un bail</h1>
      <div className="pagesub">
        Pré-rempli depuis la fiche du logement et le locataire actuel — vérifie et complète avant de générer le PDF.
      </div>
      <BailForm lotId={lotId} locataireId={locataire.id as string} initial={initial} />
    </section>
  );
}
