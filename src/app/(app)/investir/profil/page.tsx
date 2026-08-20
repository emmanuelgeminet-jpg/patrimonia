import { createClient } from "@/lib/supabase/server";
import IndicateursHero from "./IndicateursHero";
import SituationForm from "./SituationForm";
import ObjectifsForm from "./ObjectifsForm";
import RevenusChargesSummary from "./RevenusChargesSummary";
import PatrimoineImmobilierForm from "./PatrimoineImmobilierForm";
import PatrimoineFinancierSection, { type PatrimoineLigne } from "./PatrimoineFinancierSection";
import EmpruntsSection, { type Emprunt } from "./EmpruntsSection";
import { type DocItem } from "./DocumentsCell";
import { formatEuros } from "@/lib/budget";

const CATEGORIES_FINANCIERES: { key: string; titre: string }[] = [
  { key: "livret", titre: "Livrets" },
  { key: "pea", titre: "PEA" },
  { key: "assurance_vie", titre: "Assurances-vie" },
  { key: "per", titre: "Épargne retraite (PER)" },
  { key: "compte_courant", titre: "Comptes courants d'associé" },
  { key: "autre", titre: "Autres placements" },
];

/** Capital empruntable pour une mensualité donnée (formule d'annuité). */
function capaciteEmpruntDepuisMensualite(mensualite: number, tauxAnnuel: number, dureeAnnees: number): number {
  if (mensualite <= 0) return 0;
  const r = tauxAnnuel / 12;
  const n = dureeAnnees * 12;
  if (r === 0) return mensualite * n;
  return mensualite * (1 - Math.pow(1 + r, -n)) / r;
}

export default async function ProfilInvestisseurPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user!.id)
    .single();
  const householdId = profileRow?.household_id as string;

  const [
    { data: profil },
    { data: patrimoineLignes },
    { data: emprunts },
    { data: transactions },
    { data: categories },
    { data: documentsRows },
  ] = await Promise.all([
    supabase.from("profil_investisseur").select("*").eq("household_id", householdId).maybeSingle(),
    supabase.from("profil_patrimoine_financier_lignes").select("*").eq("household_id", householdId),
    supabase.from("profil_emprunts").select("*").eq("household_id", householdId).order("created_at"),
    supabase
      .from("budget_transactions")
      .select("montant_cents, categorie_id, mois_import")
      .eq("household_id", householdId),
    supabase.from("budget_categories").select("id, nom, groupe").eq("household_id", householdId),
    supabase
      .from("documents")
      .select("id, entity_id, nom_fichier, storage_path")
      .in("entity_type", ["emprunt", "patrimoine_ligne"]),
  ]);

  // Regroupe les documents attachés par emprunt / ligne de patrimoine, avec un lien de
  // téléchargement temporaire (le bucket Storage est privé).
  const docRows = documentsRows ?? [];
  const paths = docRows.map((d) => d.storage_path);
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from("documents").createSignedUrls(paths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const docsByEntity: Record<string, DocItem[]> = {};
  for (const d of docRows) {
    const item: DocItem = { id: d.id, nom_fichier: d.nom_fichier, url: urlByPath.get(d.storage_path) ?? null };
    (docsByEntity[d.entity_id] ??= []).push(item);
  }

  const txList = (transactions ?? []) as { montant_cents: number; categorie_id: string | null; mois_import: string | null }[];
  const catList = (categories ?? []) as { id: string; nom: string; groupe: "besoin" | "envie" | "epargne" | null }[];
  const categorieById = new Map(catList.map((c) => [c.id, c]));

  // Dernière période importée
  const periods = [...new Set(txList.map((t) => t.mois_import ?? ""))].filter(Boolean).sort().reverse();
  const dernierePeriode = periods[0];
  const monthTx = dernierePeriode ? txList.filter((t) => t.mois_import === dernierePeriode) : [];

  const revenus = monthTx.filter((t) => t.montant_cents > 0).reduce((s, t) => s + t.montant_cents, 0);
  let chargesBesoin = 0;
  let chargesEnvie = 0;
  for (const t of monthTx) {
    if (t.montant_cents >= 0) continue;
    const groupe = t.categorie_id ? categorieById.get(t.categorie_id)?.groupe : null;
    if (groupe === "envie") chargesEnvie += Math.abs(t.montant_cents);
    else if (groupe !== "epargne") chargesBesoin += Math.abs(t.montant_cents);
  }
  const capaciteEpargne = revenus - (chargesBesoin + chargesEnvie);
  const resteAVivre = revenus - chargesBesoin;

  const lignes = (patrimoineLignes ?? []) as PatrimoineLigne[];
  const empruntsList = (emprunts ?? []) as Emprunt[];

  const mensualitesTotal = empruntsList.reduce((s, e) => s + (e.mensualite_cents ?? 0), 0);
  const crdTotal = empruntsList.reduce((s, e) => s + (e.crd_cents ?? 0), 0);
  const tauxEndettement = revenus > 0 ? mensualitesTotal / revenus : 0;

  const totalFinancier = lignes.reduce((s, l) => s + l.valeur_cents, 0);
  const totalImmobilier =
    (profil?.residence_principale_valeur_cents ?? 0) +
    (profil?.residence_secondaire_valeur_cents ?? 0) +
    (profil?.biens_locatifs_valeur_cents ?? 0) +
    (profil?.scpi_valeur_cents ?? 0);
  const patrimoineNet = totalImmobilier + totalFinancier - crdTotal;

  const margeMensuelle = Math.max(0, revenus * 0.35 - mensualitesTotal);
  const capaciteEmprunt = capaciteEmpruntDepuisMensualite(margeMensuelle, 0.038, 20);

  const liquide = lignes
    .filter((l) => ["livret", "compte_courant", "pea", "assurance_vie"].includes(l.categorie))
    .reduce((s, l) => s + l.valeur_cents, 0);
  const apportMobilisable = Math.max(0, liquide - (profil?.epargne_precaution_cents ?? 0));

  return (
    <section className="section">
      <div className="crumb">Analyser un bien <b>› Profil investisseur</b></div>
      <h1>Profil investisseur</h1>
      <div className="pagesub">Ta situation, tes objectifs et ton patrimoine — pour évaluer ta capacité à investir</div>

      <IndicateursHero
        tauxEndettement={tauxEndettement}
        capaciteEpargne={capaciteEpargne}
        resteAVivre={resteAVivre}
        patrimoineNet={patrimoineNet}
        capaciteEmprunt={capaciteEmprunt}
        apportMobilisable={apportMobilisable}
        objectifLibelle={(profil?.objectif_libelle as string | null) ?? null}
        objectifMontantCents={(profil?.objectif_montant_cents as number | null) ?? null}
      />

      <SituationForm initial={profil} />
      <ObjectifsForm initial={profil} />

      <RevenusChargesSummary transactions={txList} categories={catList} />

      <PatrimoineImmobilierForm initial={profil} />

      <div className="card">
        <h2>6. Patrimoine financier</h2>
        <div className="card-sub">Une ligne par produit — précise le titulaire (toi, ton conjoint...) sur chaque ligne</div>
        {CATEGORIES_FINANCIERES.map((c) => (
          <PatrimoineFinancierSection
            key={c.key}
            categorie={c.key}
            titre={c.titre}
            lignes={lignes.filter((l) => l.categorie === c.key)}
            docsByEntity={docsByEntity}
          />
        ))}
        <div className="total-row" style={{ paddingTop: 14, marginTop: 10, borderTop: "1px solid var(--ink)" }}>
          <span>Total patrimoine financier</span>
          <span className="amt pos" style={{ fontSize: 16 }}>{formatEuros(totalFinancier)}</span>
        </div>
      </div>

      <EmpruntsSection emprunts={empruntsList} docsByEntity={docsByEntity} />

      <div className="card">
        <h2>Patrimoine actif / passif <span className="tag">calcul automatique</span></h2>
        <div className="grid2" style={{ margin: 0 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--sage)", fontWeight: 600, marginBottom: 10 }}>Actif</div>
            <table>
              <tbody>
                <tr><td className="cat">Immobilier (résidences, biens locatifs, SCPI)</td><td className="amt">{formatEuros(totalImmobilier)}</td></tr>
                <tr><td className="cat">Patrimoine financier</td><td className="amt">{formatEuros(totalFinancier)}</td></tr>
                <tr className="total-row"><td>Total actif</td><td className="amt pos">{formatEuros(totalImmobilier + totalFinancier)}</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--brick)", fontWeight: 600, marginBottom: 10 }}>Passif</div>
            <table>
              <tbody>
                <tr><td className="cat">Capital restant dû (tous emprunts)</td><td className="amt">{formatEuros(crdTotal)}</td></tr>
                <tr className="total-row"><td>Total passif</td><td className="amt neg">{formatEuros(crdTotal)}</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--paper)", borderRadius: 4, fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              Les parts de SCI et le compte courant d&apos;associé seront intégrés automatiquement une fois le module SCI branché sur de vraies données.
            </div>
          </div>
        </div>
        <div className="total-row" style={{ paddingTop: 16, marginTop: 6, borderTop: "1px solid var(--ink)" }}>
          <span>Patrimoine net</span>
          <span className="amt pos" style={{ fontSize: 16 }}>{formatEuros(patrimoineNet)}</span>
        </div>
      </div>
    </section>
  );
}
