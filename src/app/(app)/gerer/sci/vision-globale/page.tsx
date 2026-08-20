import { createClient } from "@/lib/supabase/server";
import { formatEuros } from "@/lib/budget";
import { statutLoyerDuMois, STATUT_LOYER_LABELS } from "@/lib/loyers";
import { soldesMensuels } from "@/lib/tresorerie";
import TresorerieChart from "./TresorerieChart";

type Ecriture = {
  date: string;
  type: "encaissement" | "decaissement";
  montant_cents: number;
  financement: "banque_sci" | "avance_associe";
  bien_id: string | null;
  lot_id: string | null;
  associe_mouvement_type: "apport" | "avance" | "remboursement" | null;
};

type Mouvement = {
  household_id: string;
  type: "apport" | "avance" | "remboursement";
  montant_cents: number;
};

export default async function VisionGlobalePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: associeRow } = await supabase
    .from("sci_associes")
    .select("sci_id")
    .eq("household_id", householdId)
    .limit(1)
    .maybeSingle();
  const sciId = associeRow?.sci_id as string | undefined;

  if (!sciId) {
    return (
      <section className="section">
        <div className="crumb">Gérer <b>› Gérer mon parc › Vision globale</b></div>
        <h1>Vision globale</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>Ton foyer n&apos;est associé à aucune SCI pour le moment.</div>
      </section>
    );
  }

  const [
    { data: sci },
    { data: associesRows },
    { data: ecrituresRows },
    { data: mouvementsRows },
    { data: biensRows },
  ] = await Promise.all([
    supabase.from("sci").select("solde_ouverture_cents, solde_ouverture_date").eq("id", sciId).single(),
    supabase.from("sci_associes").select("household_id, solde_ouverture_cents, households(name)").eq("sci_id", sciId),
    supabase
      .from("journal_ecritures")
      .select("date, type, montant_cents, financement, bien_id, lot_id, associe_mouvement_type")
      .eq("sci_id", sciId),
    supabase.from("comptes_courants_mouvements").select("household_id, type, montant_cents").eq("sci_id", sciId),
    supabase.from("biens").select("id").eq("sci_id", sciId).eq("owner_type", "sci"),
  ]);

  const ecritures = (ecrituresRows ?? []) as Ecriture[];
  const mouvements = (mouvementsRows ?? []) as Mouvement[];
  const soldeOuvertureCents = (sci?.solde_ouverture_cents as number) ?? 0;
  const soldeOuvertureDate = sci?.solde_ouverture_date as string | null;

  // Solde bancaire actuel : uniquement les écritures réellement passées par le compte de la SCI.
  const soldeBancaire = ecritures
    .filter((e) => e.financement === "banque_sci")
    .filter((e) => !soldeOuvertureDate || e.date >= soldeOuvertureDate)
    .reduce((s, e) => s + (e.type === "encaissement" ? e.montant_cents : -e.montant_cents), 0) + soldeOuvertureCents;

  const anneeEnCours = new Date().getFullYear().toString();
  const ecrituresAnnee = ecritures.filter((e) => e.date.slice(0, 4) === anneeEnCours && e.financement === "banque_sci");
  const loyersEncaisses = ecrituresAnnee
    .filter((e) => e.type === "encaissement" && e.bien_id && !e.associe_mouvement_type)
    .reduce((s, e) => s + e.montant_cents, 0);
  const chargesDecaissees = ecrituresAnnee
    .filter((e) => e.type === "decaissement" && !e.associe_mouvement_type)
    .reduce((s, e) => s + e.montant_cents, 0);

  const associes = (associesRows ?? []).map((a) => ({
    householdId: a.household_id as string,
    nom: (a.households as unknown as { name: string } | null)?.name ?? "Foyer",
    solde: mouvements
      .filter((m) => m.household_id === a.household_id)
      .reduce((s, m) => s + (m.type === "remboursement" ? -m.montant_cents : m.montant_cents), (a.solde_ouverture_cents as number) ?? 0),
  }));
  const detteTotal = associes.reduce((s, a) => s + a.solde, 0);

  const bienIds = (biensRows ?? []).map((b) => b.id as string);
  const { data: lotsRows } = bienIds.length
    ? await supabase.from("lots").select("id, nom").in("bien_id", bienIds).order("nom")
    : { data: [] as { id: string; nom: string }[] };
  const lotIds = (lotsRows ?? []).map((l) => l.id as string);
  const { data: locatairesRows } = lotIds.length
    ? await supabase
        .from("locataires")
        .select("lot_id, nom, loyer_hc_cents, charges_cents, date_sortie")
        .in("lot_id", lotIds)
    : { data: [] as { lot_id: string; nom: string; loyer_hc_cents: number; charges_cents: number; date_sortie: string | null }[] };

  const moisEnCours = new Date().toISOString().slice(0, 7);
  const ecrituresDuMois = ecritures.filter((e) => e.date.slice(0, 7) === moisEnCours);

  const pointsTresorerie = soldesMensuels(
    ecritures.filter((e) => e.financement === "banque_sci").map((e) => ({ date: e.date, type: e.type, montantCents: e.montant_cents })),
    soldeOuvertureCents,
    soldeOuvertureDate
  );

  const appartements = (lotsRows ?? []).map((l) => {
    const actif = (locatairesRows ?? []).find((loc) => loc.lot_id === l.id && !loc.date_sortie);
    const { statut } = statutLoyerDuMois(
      l.id as string,
      actif ? { loyerHcCents: actif.loyer_hc_cents, chargesCents: actif.charges_cents } : undefined,
      ecrituresDuMois.map((e) => ({ lotId: e.lot_id, type: e.type, montantCents: e.montant_cents, financement: e.financement }))
    );
    return { lot: l.nom, locataire: actif?.nom ?? "—", statut, loyerHc: actif?.loyer_hc_cents ?? 0 };
  });

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Gérer mon parc › Vision globale</b></div>
      <h1>Vision globale</h1>
      <div className="pagesub">Tous vos biens — trésorerie, rentabilité, comptes associés</div>

      <div className="kpis">
        <div className="kpi"><div className="label">Solde bancaire SCI</div><div className="value">{formatEuros(soldeBancaire)}</div><div className="sub">aujourd&apos;hui</div></div>
        <div className="kpi"><div className="label">Loyers encaissés</div><div className="value">{formatEuros(loyersEncaisses)}</div><div className="sub">exercice {anneeEnCours}, sur le compte SCI</div></div>
        <div className="kpi"><div className="label">Charges décaissées</div><div className="value">{formatEuros(chargesDecaissees)}</div><div className="sub">exercice {anneeEnCours}, sur le compte SCI</div></div>
        <div className="kpi"><div className="label">Dette SCI → associés</div><div className="value">{formatEuros(detteTotal)}</div><div className="sub">{associes.map((a) => `${a.nom} ${formatEuros(a.solde)}`).join(" + ")}</div></div>
      </div>

      <div className="card">
        <h2>Trésorerie <span className="tag">solde en fin de mois — 12 derniers mois</span></h2>
        <TresorerieChart points={pointsTresorerie} />
      </div>

      <div className="placeholder-note">
        Squelette — rentabilité par appartement pas encore en graphique : il manque la valeur vénale de chaque lot,
        qui n&apos;existe pas encore dans la fiche du bien.
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Appartements</h2>
          <table>
            <thead><tr><th>Lot</th><th>Locataire</th><th>Statut</th><th className="num">Loyer HC</th></tr></thead>
            <tbody>
              {appartements.length === 0 && (
                <tr><td colSpan={4} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucun lot enregistré</td></tr>
              )}
              {appartements.map((a) => (
                <tr key={a.lot}>
                  <td>{a.lot}</td>
                  <td>{a.locataire}</td>
                  <td>
                    <span className={`pill ${{ paye: "ok", partiel: "warn", en_attente: "due", vacant: "vac" }[a.statut]}`}>
                      {STATUT_LOYER_LABELS[a.statut]}
                    </span>
                  </td>
                  <td className="num">{a.loyerHc ? formatEuros(a.loyerHc) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="placeholder-note">Détail complet (dépôt de garantie, historique) → onglet Par appartement</div>
        </div>
        <div className="card">
          <h2>Comptes courants associés</h2>
          <table>
            <tbody>
              {associes.map((a) => (
                <tr key={a.householdId}><td>Foyer {a.nom}</td><td className="num">{formatEuros(a.solde)}</td></tr>
              ))}
            </tbody>
          </table>
          <div className="placeholder-note">Détail apports / avances / remboursements → onglet Comptes courants</div>
        </div>
      </div>
    </section>
  );
}
