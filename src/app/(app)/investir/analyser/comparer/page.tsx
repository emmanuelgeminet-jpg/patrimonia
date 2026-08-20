import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuros } from "@/lib/budget";
import { computeAnalyseBienKpis } from "@/lib/analyse-bien";

export default async function ComparerAnalysesPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const { ids: idsParam } = await searchParams;
  const ids = idsParam ? (Array.isArray(idsParam) ? idsParam : [idsParam]) : [];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: analysesRows } = ids.length
    ? await supabase.from("analyses_biens").select("*").eq("household_id", householdId).in("id", ids)
    : { data: [] as Record<string, unknown>[] };
  const analyses = analysesRows ?? [];

  const analyseIds = analyses.map((a) => a.id as string);
  const { data: lotsRows } = analyseIds.length
    ? await supabase.from("analyses_biens_lots").select("analyse_id, loyer_hc_cents, charges_cents").in("analyse_id", analyseIds)
    : { data: [] as { analyse_id: string; loyer_hc_cents: number; charges_cents: number }[] };

  const colonnes = analyses.map((a) => {
    const lots = (lotsRows ?? [])
      .filter((l) => l.analyse_id === a.id)
      .map((l) => ({ loyerHcCents: l.loyer_hc_cents, chargesCents: l.charges_cents }));
    const kpis = computeAnalyseBienKpis({
      prixAnnonceCents: a.prix_annonce_cents as number | null,
      prixOffreCents: a.prix_offre_cents as number | null,
      fraisNotaireCents: a.frais_notaire_cents as number | null,
      fraisAgenceCents: a.frais_agence_cents as number | null,
      fraisDossierGarantieCents: a.frais_dossier_garantie_cents as number | null,
      travauxEstimesCents: a.travaux_estimes_cents as number | null,
      montantEmprunteCents: a.montant_emprunte_cents as number | null,
      tauxPct: a.taux_pct as number | null,
      dureeAnnees: a.duree_annees as number | null,
      assuranceEmprunteurCents: a.assurance_emprunteur_cents as number | null,
      taxeFonciereCents: a.taxe_fonciere_cents as number | null,
      chargesCoproCents: a.charges_copro_cents as number | null,
      assurancePnoCents: a.assurance_pno_cents as number | null,
      chargesAnnuellesCents: a.charges_annuelles_cents as number | null,
      surfaceM2: a.surface_m2 as number | null,
      vacanceLocativePct: a.vacance_locative_pct as number | null,
      gliPct: a.gli_pct as number | null,
      fraisGestionPct: a.frais_gestion_pct as number | null,
      lots,
    });
    return { id: a.id as string, adresse: a.adresse as string, kpis };
  });

  const pct = (v: number | null) => (v !== null ? `${v.toFixed(1)} %` : "—");

  const lignes: { label: string; get: (k: (typeof colonnes)[number]["kpis"]) => string; meilleur?: "max" | "min" }[] = [
    { label: "Coût total", get: (k) => formatEuros(k.coutTotalCents) },
    { label: "Négociation", get: (k) => (k.pourcentageNegociation !== null ? pct(k.pourcentageNegociation) : "—") },
    { label: "Loyers HC annuels", get: (k) => formatEuros(k.loyersHcAnnuelsCents) },
    { label: "Charges annuelles", get: (k) => formatEuros(k.chargesTotalesCents) },
    { label: "Mensualité totale (crédit + assurance)", get: (k) => formatEuros(k.mensualiteTotaleCents) },
    { label: "Rentabilité brute", get: (k) => pct(k.rentabiliteBrute) },
    { label: "Rentabilité nette", get: (k) => pct(k.rentabiliteNette) },
    { label: "Rentabilité net-net", get: (k) => pct(k.rentabiliteNetNette) },
    { label: "Cash-flow net (loyers 100 %)", get: (k) => formatEuros(k.vue100.cashflowNetCents) },
    { label: "Cash-flow net (vue banque, loyers 70 %)", get: (k) => formatEuros(k.vueBanque70.cashflowNetCents) },
    { label: "Cash-on-cash", get: (k) => (k.cashOnCash !== null ? pct(k.cashOnCash) : "—") },
    { label: "Prix au m²", get: (k) => (k.prixM2Cents !== null ? formatEuros(Math.round(k.prixM2Cents)) : "—") },
  ];

  return (
    <section className="section">
      <div className="crumb">Investir <b>› Analyser un bien › Comparer</b></div>
      <h1>Comparer des analyses</h1>
      <div className="pagesub">
        <Link href="/investir/analyser" style={{ color: "var(--sage)" }}>← Retour à la liste</Link>
      </div>

      {colonnes.length < 2 ? (
        <div className="card">
          <div className="empty">
            <div className="big">Sélectionne au moins deux analyses</div>
            Reviens à la liste, coche les biens à comparer, puis clique sur &quot;Comparer la sélection&quot;.
          </div>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table>
            <thead>
              <tr>
                <th></th>
                {colonnes.map((c) => (
                  <th key={c.id}><Link href={`/investir/analyser/${c.id}`} style={{ color: "var(--sage)" }}>{c.adresse}</Link></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lignes.map((ligne) => (
                <tr key={ligne.label}>
                  <td>{ligne.label}</td>
                  {colonnes.map((c) => (
                    <td key={c.id} className="num">{ligne.get(c.kpis)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
