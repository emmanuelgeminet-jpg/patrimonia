import { createClient } from "@/lib/supabase/server";
import { computeAnalyseBienKpis, totalInteretsEmprunt } from "@/lib/analyse-bien";
import TravauxCalculator, { type Analyse, type LigneTravaux } from "./TravauxCalculator";

export default async function EstimatifTravauxPage({
  searchParams,
}: {
  searchParams: Promise<{ analyse?: string }>;
}) {
  const { analyse: analyseParam } = await searchParams;
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
  const analyses: Analyse[] = (analysesRows ?? []).map((a) => ({ id: a.id as string, adresse: a.adresse as string }));

  const selected = analyseParam
    ? (analysesRows ?? []).find((a) => a.id === analyseParam)
    : (analysesRows ?? [])[0];
  const selectedId = selected ? (selected.id as string) : null;

  const { data: lignesRows } = selectedId
    ? await supabase.from("devis_travaux").select("*").eq("analyse_id", selectedId).order("created_at")
    : { data: [] as { id: string; piece: string; type_travaux: string; surface_m2: number | null; prix_m2_cents: number | null; sous_total_cents: number }[] };

  const lignes: LigneTravaux[] = (lignesRows ?? []).map((l) => ({
    id: l.id as string,
    piece: l.piece as string,
    typeTravaux: l.type_travaux as string,
    surfaceM2: l.surface_m2 as number | null,
    prixM2Cents: l.prix_m2_cents as number | null,
    sousTotalCents: l.sous_total_cents as number,
  }));

  const totalTravaux = lignes.reduce((s, l) => s + l.sousTotalCents, 0);
  const surfaceRenovee = lignes.reduce((s, l) => s + (l.surfaceM2 ?? 0), 0);
  const prixM2Renovation = surfaceRenovee > 0 ? totalTravaux / surfaceRenovee : null;

  let prixM2GlobalInteretsCompris: number | null = null;
  if (selected) {
    const surfaceHabitable = selected.surface_m2 as number | null;
    if (surfaceHabitable && surfaceHabitable > 0) {
      const kpis = computeAnalyseBienKpis({
        prixOffreCents: selected.prix_offre_cents as number | null,
        fraisNotaireCents: selected.frais_notaire_cents as number | null,
        travauxEstimesCents: totalTravaux || (selected.travaux_estimes_cents as number | null),
        montantEmprunteCents: selected.montant_emprunte_cents as number | null,
        tauxPct: selected.taux_pct as number | null,
        dureeAnnees: selected.duree_annees as number | null,
        chargesAnnuellesCents: selected.charges_annuelles_cents as number | null,
        surfaceM2: surfaceHabitable,
        lots: [],
      });
      const interets = totalInteretsEmprunt(
        (selected.montant_emprunte_cents as number | null) ?? 0,
        (selected.taux_pct as number | null) ?? 0,
        (selected.duree_annees as number | null) ?? 0
      );
      prixM2GlobalInteretsCompris = (kpis.coutTotalCents + interets) / surfaceHabitable;
    }
  }

  return (
    <section className="section">
      <div className="crumb">Analyser un bien <b>› Investir › Estimatif des travaux</b></div>
      <h1>Estimatif des travaux</h1>
      <div className="pagesub">Objectif : ne jamais sous-évaluer une rénovation — ça plombe la rentabilité du projet</div>

      <div className="card">
        <h2>Grille de prix de référence <span className="tag">repères marché 2026</span></h2>
        <div className="card-sub">Grille de prix 2026 construite à partir des données FFB, retours d&apos;artisans et plateformes spécialisées — à ajuster selon les devis réels</div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "16px 0 8px" }}>Repère global — prix moyen au m² selon le niveau de rénovation</div>
        <table>
          <thead><tr><th>Niveau</th><th>Contenu</th><th className="num">Prix moyen €/m²</th></tr></thead>
          <tbody>
            <tr><td>Rafraîchissement</td><td>Peinture, sols, petites retouches</td><td className="num">150 - 400 €</td></tr>
            <tr><td>Standard</td><td>+ cuisine, salle de bain, électricité partielle</td><td className="num">600 - 900 €</td></tr>
            <tr><td>Complet</td><td>+ isolation, menuiseries, tous corps d&apos;état</td><td className="num">900 - 1 500 €</td></tr>
            <tr><td>Lourd</td><td>+ reprises de structure, gros œuvre</td><td className="num">1 500 - 2 000 €</td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Île-de-France : +20 à 30 % sur main-d&apos;œuvre et matériaux. Bâti d&apos;avant 1970 : +15 à 25 % (imprévus structurels plus fréquents). Toujours prévoir une marge d&apos;aléas de 15-25 % — c&apos;est le principal facteur de sous-évaluation d&apos;un budget travaux.</div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "20px 0 8px" }}>Grille de prix de référence par type de travaux</div>

        <div className="cat-block"><div className="cat-title">Démolition et gros œuvre</div>
          <table><tbody>
            <tr><td>Dépose de cloison</td><td className="num">15 - 45 €/m²</td></tr>
            <tr><td>Ouverture mur porteur (avec étude IPN)</td><td className="num">2 800 - 5 500 € /forfait</td></tr>
            <tr><td>Évacuation gravats (benne 7 m³)</td><td className="num">350 - 600 € /forfait</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Électricité</div>
          <table><tbody><tr><td>Réfection complète (tableau + appareillage)</td><td className="num">90 - 140 €/m²</td></tr></tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Plomberie</div>
          <table><tbody>
            <tr><td>Réseau neuf, par point d&apos;eau créé</td><td className="num">800 - 1 500 € /point</td></tr>
            <tr><td>VMC double flux (fourniture + pose)</td><td className="num">3 500 - 6 000 € /forfait</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Isolation</div>
          <table><tbody>
            <tr><td>Combles perdus (soufflage)</td><td className="num">20 - 70 €/m²</td></tr>
            <tr><td>Combles aménageables (sous-rampants)</td><td className="num">50 - 250 €/m²</td></tr>
          </tbody></table>
          <div className="placeholder-note">Primes CEE mobilisables (jusqu&apos;à 13 €/m² en 2026) sous condition de recours à un artisan RGE — à déduire du coût réel si tu factures les travaux via la SCI.</div>
        </div>

        <div className="cat-block"><div className="cat-title">Cloisons et plafonds (placo)</div>
          <table><tbody>
            <tr><td>Cloison BA13 standard, tout compris</td><td className="num">20 - 40 €/m²</td></tr>
            <tr><td>Faux plafond</td><td className="num">30 - 70 €/m²</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Sols</div>
          <table><tbody>
            <tr><td>Réagréage (pose comprise)</td><td className="num">15 - 35 €/m²</td></tr>
            <tr><td>Parquet flottant</td><td className="num">45 - 85 €/m²</td></tr>
            <tr><td>Parquet massif</td><td className="num">90 - 160 €/m²</td></tr>
            <tr><td>Carrelage (grès cérame)</td><td className="num">60 - 130 €/m²</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Peinture et finitions</div>
          <table><tbody><tr><td>Peinture murs + plafond, tout compris</td><td className="num">35 - 70 €/m²</td></tr></tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Pièces techniques (forfaits)</div>
          <table><tbody>
            <tr><td>Salle de bain complète</td><td className="num">900 - 2 000 €/m² <span className="tag">soit 4 500-10 000 € pour 5 m²</span></td></tr>
            <tr><td>Cuisine — rafraîchissement</td><td className="num">2 000 - 5 000 € /forfait</td></tr>
            <tr><td>Cuisine — rénovation complète</td><td className="num">8 000 - 18 000 € /forfait</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Main-d&apos;œuvre horaire par corps de métier</div>
          <table><tbody>
            <tr><td>Peintre</td><td className="num">35 - 50 €/h</td></tr>
            <tr><td>Plaquiste</td><td className="num">35 - 60 €/h</td></tr>
            <tr><td>Plombier</td><td className="num">45 - 80 €/h</td></tr>
            <tr><td>Carreleur</td><td className="num">40 - 65 €/h</td></tr>
          </tbody></table>
        </div>

        <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)", marginTop: 6 }}>
          <b>Fonctionnalité prévue :</b> l&apos;appli pourra interroger le web périodiquement pour rafraîchir automatiquement cette grille de référence (prix matériaux, taux horaires artisans par région) plutôt que de rester figée sur les chiffres du jour de sa création — pour que tes estimations restent fiables dans la durée.
        </div>
      </div>

      <TravauxCalculator
        analyses={analyses}
        selectedId={selectedId}
        lignes={lignes}
        prixM2Renovation={prixM2Renovation}
        prixM2GlobalInteretsCompris={prixM2GlobalInteretsCompris}
      />
    </section>
  );
}
