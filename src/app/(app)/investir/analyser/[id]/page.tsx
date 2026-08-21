import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { computeAnalyseBienKpis, computeTri } from "@/lib/analyse-bien";
import AnalyseDetail, { type Analyse, type LigneLoyer } from "./AnalyseDetail";

export default async function AnalyseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: analyseRow } = await supabase.from("analyses_biens").select("*").eq("id", id).maybeSingle();
  if (!analyseRow) notFound();

  const { data: lotsRows } = await supabase
    .from("analyses_biens_lots")
    .select("*")
    .eq("analyse_id", id)
    .order("nom");

  const analyse: Analyse = {
    id: analyseRow.id as string,
    adresse: analyseRow.adresse as string,
    statut: analyseRow.statut as string,
    prixAnnonceCents: analyseRow.prix_annonce_cents as number | null,
    prixOffreCents: analyseRow.prix_offre_cents as number | null,
    fraisNotaireCents: analyseRow.frais_notaire_cents as number | null,
    fraisAgenceCents: analyseRow.frais_agence_cents as number | null,
    fraisDossierGarantieCents: analyseRow.frais_dossier_garantie_cents as number | null,
    travauxEstimesCents: analyseRow.travaux_estimes_cents as number | null,
    apportCents: analyseRow.apport_cents as number | null,
    montantEmprunteCents: analyseRow.montant_emprunte_cents as number | null,
    tauxPct: analyseRow.taux_pct as number | null,
    dureeAnnees: analyseRow.duree_annees as number | null,
    assuranceEmprunteurCents: analyseRow.assurance_emprunteur_cents as number | null,
    taxeFonciereCents: analyseRow.taxe_fonciere_cents as number | null,
    chargesCoproCents: analyseRow.charges_copro_cents as number | null,
    assurancePnoCents: analyseRow.assurance_pno_cents as number | null,
    chargesAnnuellesCents: analyseRow.charges_annuelles_cents as number | null,
    surfaceM2: analyseRow.surface_m2 as number | null,
    vacanceLocativePct: analyseRow.vacance_locative_pct as number | null,
    gliPct: analyseRow.gli_pct as number | null,
    fraisGestionPct: analyseRow.frais_gestion_pct as number | null,
    dureeDetentionAnnees: analyseRow.duree_detention_annees as number | null,
    tauxValorisationPct: analyseRow.taux_valorisation_pct as number | null,
    notes: analyseRow.notes as string | null,
  };

  const lignes: LigneLoyer[] = (lotsRows ?? []).map((l) => ({
    id: l.id as string,
    nom: l.nom as string,
    loyerHcCents: l.loyer_hc_cents as number,
    chargesCents: l.charges_cents as number,
  }));

  const analyseInput = {
    prixAnnonceCents: analyse.prixAnnonceCents,
    prixOffreCents: analyse.prixOffreCents,
    fraisNotaireCents: analyse.fraisNotaireCents,
    fraisAgenceCents: analyse.fraisAgenceCents,
    fraisDossierGarantieCents: analyse.fraisDossierGarantieCents,
    travauxEstimesCents: analyse.travauxEstimesCents,
    apportCents: analyse.apportCents,
    montantEmprunteCents: analyse.montantEmprunteCents,
    tauxPct: analyse.tauxPct,
    dureeAnnees: analyse.dureeAnnees,
    assuranceEmprunteurCents: analyse.assuranceEmprunteurCents,
    taxeFonciereCents: analyse.taxeFonciereCents,
    chargesCoproCents: analyse.chargesCoproCents,
    assurancePnoCents: analyse.assurancePnoCents,
    chargesAnnuellesCents: analyse.chargesAnnuellesCents,
    surfaceM2: analyse.surfaceM2,
    vacanceLocativePct: analyse.vacanceLocativePct,
    gliPct: analyse.gliPct,
    fraisGestionPct: analyse.fraisGestionPct,
    lots: lignes.map((l) => ({ loyerHcCents: l.loyerHcCents, chargesCents: l.chargesCents })),
  };

  const kpis = computeAnalyseBienKpis(analyseInput);
  const tri = computeTri(kpis, analyseInput, {
    dureeDetentionAnnees: analyse.dureeDetentionAnnees,
    tauxValorisationPct: analyse.tauxValorisationPct,
  });

  return (
    <section className="section">
      <div className="crumb">
        <Link href="/investir/analyser">Analyser un bien</Link> <b>› {analyse.adresse}</b>
      </div>
      <h1>{analyse.adresse}</h1>
      <div className="pagesub">
        Avant achat — coût total, financement, rentabilité{" "}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(analyse.adresse)}`}
          target="_blank"
          rel="noreferrer"
          style={{ color: "var(--sage)" }}
        >
          · Voir sur la carte
        </a>
      </div>

      <AnalyseDetail analyse={analyse} lignes={lignes} kpis={kpis} tri={tri} />
    </section>
  );
}
