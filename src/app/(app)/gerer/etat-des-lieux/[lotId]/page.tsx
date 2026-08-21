import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EtatDesLieuxForm from "./EtatDesLieuxForm";
import type { EtatDesLieuxDonnees } from "@/lib/etat-des-lieux";

export default async function EtatDesLieuxPage({
  params,
  searchParams,
}: {
  params: Promise<{ lotId: string }>;
  searchParams: Promise<{ locataireId?: string; type?: string }>;
}) {
  const { lotId } = await params;
  const { locataireId, type } = await searchParams;
  const edlType: "entree" | "sortie" = type === "sortie" ? "sortie" : "entree";
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
        <div className="crumb">Gérer <b>› État des lieux</b></div>
        <h1>État des lieux — {lot.nom as string}</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>
          Aucun locataire actif sur ce logement — ajoute-le d&apos;abord avant de générer un état des lieux.
        </div>
      </section>
    );
  }

  let bailleurNom = "";
  let bailleurAdresse = "";
  let logoStyle: string | null = null;

  if (bien.owner_type === "sci") {
    const { data: sci } = await supabase.from("sci").select("*").eq("id", bien.sci_id).maybeSingle();
    bailleurNom = (sci?.name as string) ?? "";
    bailleurAdresse = (sci?.adresse as string) ?? "";
    logoStyle = (sci?.logo_style as string | null) ?? null;
  } else {
    const { data: household } = await supabase.from("households").select("*").eq("id", bien.household_id).maybeSingle();
    bailleurNom = (household?.name as string) ?? "";
    bailleurAdresse = (household?.adresse as string | null) ?? "";
  }

  let entrees: { id: string; date: string }[] = [];
  if (edlType === "sortie") {
    const { data: entreesRows } = await supabase
      .from("etats_des_lieux")
      .select("id, date_etat_des_lieux")
      .eq("lot_id", lotId)
      .eq("type", "entree")
      .order("date_etat_des_lieux", { ascending: false });
    entrees = (entreesRows ?? []).map((e) => ({ id: e.id as string, date: e.date_etat_des_lieux as string }));
  }

  const initial: EtatDesLieuxDonnees = {
    bailleur: { nom: bailleurNom, adresse: bailleurAdresse },
    locataire: { nom: locataire.nom as string, adresse: edlType === "sortie" ? "" : (bien.adresse as string) },
    mandataire: null,
    logoStyle,
    compteurs: {
      electriciteNumero: null,
      electriciteReleveHP: null,
      electriciteReleveHC: null,
      gazNumero: null,
      gazReleve: null,
      eauReleveFroide: null,
      eauReleveChaude: null,
    },
    cles: {
      serruresPrincipales: null,
      verrousHaut: null,
      verrousBas: null,
      clesImmeuble: null,
      clesCave: null,
      clesBoiteLettres: null,
      clesPortail: null,
      badges: null,
      autresLibelle: null,
      autresNombre: null,
    },
    partiesPrivatives: {
      cave: { applicable: !!lot.cave_numero, numero: (lot.cave_numero as string | null) ?? null, etat: null, observations: null },
      parking: { applicable: !!(lot.parking_numero || lot.garage_numero), numero: (lot.parking_numero as string | null) ?? (lot.garage_numero as string | null), etat: null, observations: null },
      balconTerrasse: { applicable: false, etat: null },
      jardin: { applicable: false, etat: null },
      autreLibelle: null,
      autre: { applicable: false, etat: null },
    },
    chauffageType: (bien.chauffage_type as "individuel" | "collectif" | null) ?? null,
    chauffageNature: null,
    eauChaudeType: (bien.eau_chaude_type as "individuelle" | "collective" | null) ?? null,
    eauChaudeNature: null,
    pieces: [],
    observationsGenerales: null,
    lieuSignature: (bien.ville as string | null) ?? "",
  };

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› État des lieux {edlType === "entree" ? "d'entrée" : "de sortie"} — {bien.adresse as string} — {lot.nom as string}</b></div>
      <h1>{edlType === "entree" ? "État des lieux d'entrée" : "État des lieux de sortie"}</h1>
      <div className="pagesub">
        Pré-rempli depuis la fiche du logement — ajoute les pièces une à une et complète les relevés avant de générer le PDF.
      </div>
      <EtatDesLieuxForm lotId={lotId} locataireId={locataire.id as string} type={edlType} entrees={entrees} initial={initial} />
    </section>
  );
}
