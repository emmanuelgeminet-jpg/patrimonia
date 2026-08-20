import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatEuros } from "@/lib/budget";
import { computeAnalyseBienKpis } from "@/lib/analyse-bien";
import NouvelleAnalyseForm from "./NouvelleAnalyseForm";

const STATUT_LABELS: Record<string, string> = { a_l_etude: "À l'étude", abandonne: "Abandonné", achete: "Acheté" };

export default async function AnalyserListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: analysesRows } = await supabase
    .from("analyses_biens")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  const analyses = analysesRows ?? [];

  const ids = analyses.map((a) => a.id as string);
  const { data: lotsRows } = ids.length
    ? await supabase.from("analyses_biens_lots").select("analyse_id, loyer_hc_cents, charges_cents").in("analyse_id", ids)
    : { data: [] as { analyse_id: string; loyer_hc_cents: number; charges_cents: number }[] };

  const cards = analyses.map((a) => {
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
    return { id: a.id as string, adresse: a.adresse as string, statut: a.statut as string, kpis };
  });

  return (
    <section className="section">
      <div className="crumb">Investir <b>› Analyser un bien</b></div>
      <h1>Analyser un bien</h1>
      <div className="pagesub">Avant achat — coût total, financement, rentabilité</div>

      <NouvelleAnalyseForm />

      <div className="card">
        <h2>Tes analyses</h2>
        <form action="/investir/analyser/comparer">
          <table>
            <thead>
              <tr><th></th><th>Adresse</th><th>Statut</th><th className="num">Coût total</th><th className="num">Rentabilité brute</th><th className="num">Rentabilité nette</th><th></th></tr>
            </thead>
            <tbody>
              {cards.length === 0 && (
                <tr><td colSpan={7} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune analyse pour l&apos;instant</td></tr>
              )}
              {cards.map((c) => (
                <tr key={c.id}>
                  <td><input type="checkbox" name="ids" value={c.id} /></td>
                  <td>
                    <Link href={`/investir/analyser/${c.id}`} style={{ color: "var(--sage)" }}>{c.adresse}</Link>{" "}
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.adresse)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ fontSize: 10.5, color: "var(--ink-soft)" }}
                    >
                      (carte)
                    </a>
                  </td>
                  <td>{STATUT_LABELS[c.statut] ?? c.statut}</td>
                  <td className="num">{formatEuros(c.kpis.coutTotalCents)}</td>
                  <td className="num">{c.kpis.rentabiliteBrute !== null ? `${c.kpis.rentabiliteBrute.toFixed(1)} %` : "—"}</td>
                  <td className="num">{c.kpis.rentabiliteNette !== null ? `${c.kpis.rentabiliteNette.toFixed(1)} %` : "—"}</td>
                  <td><Link href={`/investir/analyser/${c.id}`} className="tag" style={{ color: "var(--brick)" }}>Ouvrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          {cards.length >= 2 && (
            <div style={{ marginTop: 10 }}>
              <button
                type="submit"
                style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
              >
                Comparer la sélection
              </button>
              <span style={{ marginLeft: 10, fontSize: 11, color: "var(--ink-soft)" }}>Coche au moins deux biens ci-dessus</span>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}
