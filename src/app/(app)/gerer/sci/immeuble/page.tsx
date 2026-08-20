import { createClient } from "@/lib/supabase/server";
import { formatEuros } from "@/lib/budget";
import CaracteristiquesForm from "./CaracteristiquesForm";

export default async function ImmeublePage() {
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
        <div className="crumb">Gérer <b>› Gérer mon parc › Par immeuble</b></div>
        <h1>Par immeuble</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>Ton foyer n&apos;est associé à aucune SCI pour le moment.</div>
      </section>
    );
  }

  const { data: biensRows } = await supabase
    .from("biens")
    .select("*")
    .eq("sci_id", sciId)
    .eq("owner_type", "sci")
    .eq("type", "immeuble");
  const bien = (biensRows ?? [])[0];

  if (!bien) {
    return (
      <section className="section">
        <div className="crumb">Gérer <b>› Gérer mon parc › Par immeuble</b></div>
        <h1>Par immeuble</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>Aucun immeuble enregistré pour cette SCI pour le moment.</div>
      </section>
    );
  }

  const { data: lotsRows } = await supabase.from("lots").select("id, nom").eq("bien_id", bien.id);
  const lotIds = (lotsRows ?? []).map((l) => l.id as string);

  const { data: locatairesRows } = lotIds.length
    ? await supabase.from("locataires").select("loyer_hc_cents, charges_cents, date_sortie").in("lot_id", lotIds)
    : { data: [] as { loyer_hc_cents: number; charges_cents: number; date_sortie: string | null }[] };

  const { data: ecrituresRows } = await supabase
    .from("journal_ecritures")
    .select("type, montant_cents, financement, associe_mouvement_type, bien_id, lot_id, date")
    .eq("sci_id", sciId);

  const locatairesActifs = (locatairesRows ?? []).filter((l) => !l.date_sortie);
  const loyersHcAnnuels = locatairesActifs.reduce((s, l) => s + l.loyer_hc_cents * 12, 0);
  const loyersChargesAnnuels = locatairesActifs.reduce((s, l) => s + l.charges_cents * 12, 0);
  const nbLotsLoues = locatairesActifs.length;
  const nbLotsTotal = (lotsRows ?? []).length;

  const anneeEnCours = new Date().getFullYear().toString();
  const ecrituresImmeubleAnnee = (ecrituresRows ?? []).filter(
    (e) =>
      e.date.slice(0, 4) === anneeEnCours &&
      e.financement === "banque_sci" &&
      (e.bien_id === bien.id || (e.lot_id && lotIds.includes(e.lot_id)))
  );
  const chargesAnnuelles = ecrituresImmeubleAnnee
    .filter((e) => e.type === "decaissement" && !e.associe_mouvement_type)
    .reduce((s, e) => s + e.montant_cents, 0);

  const prixAcquisitionCents = bien.prix_acquisition_cents as number | null;
  const rentabiliteBrute = prixAcquisitionCents ? (loyersHcAnnuels / prixAcquisitionCents) * 100 : null;
  const rentabiliteNette = prixAcquisitionCents ? ((loyersHcAnnuels - chargesAnnuelles) / prixAcquisitionCents) * 100 : null;

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Gérer mon parc › Par immeuble</b></div>
      <h1>{bien.adresse}</h1>
      <div className="pagesub">
        {[bien.code_postal, bien.ville].filter(Boolean).join(" ")} — {nbLotsLoues}/{nbLotsTotal} lot{nbLotsTotal > 1 ? "s" : ""} loué{nbLotsLoues > 1 ? "s" : ""}
      </div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Loyers annuels (lots loués)</div>
          <div className="value">{formatEuros(loyersHcAnnuels + loyersChargesAnnuels)}</div>
          <div className="sub">HC : {formatEuros(loyersHcAnnuels)}</div>
        </div>
        <div className="kpi">
          <div className="label">Rentabilité brute</div>
          <div className="value">{rentabiliteBrute !== null ? `${rentabiliteBrute.toFixed(1)} %` : "—"}</div>
          <div className="sub">loyers HC / prix d&apos;acquisition</div>
        </div>
        <div className="kpi">
          <div className="label">Rentabilité nette</div>
          <div className="value">{rentabiliteNette !== null ? `${rentabiliteNette.toFixed(1)} %` : "—"}</div>
          <div className="sub">après charges {anneeEnCours}</div>
        </div>
        <div className="kpi">
          <div className="label">Rentabilité net-net</div>
          <div className="value">—</div>
          <div className="sub">nécessite le détail intérêts d&apos;emprunt / fiscalité, pas encore disponible</div>
        </div>
      </div>

      {prixAcquisitionCents === null && (
        <div className="placeholder-note">
          Renseigne le prix d&apos;acquisition ci-dessous pour que les rentabilités se calculent.
        </div>
      )}
      {nbLotsLoues < nbLotsTotal && (
        <div className="placeholder-note">
          {nbLotsTotal - nbLotsLoues} lot{nbLotsTotal - nbLotsLoues > 1 ? "s" : ""} vacant{nbLotsTotal - nbLotsLoues > 1 ? "s" : ""}, donc non compté{nbLotsTotal - nbLotsLoues > 1 ? "s" : ""} dans les loyers annuels — la rentabilité réelle une fois complet sera plus élevée.
        </div>
      )}

      <CaracteristiquesForm
        bienId={bien.id}
        prixAcquisitionCents={prixAcquisitionCents}
        dateAcquisition={bien.date_acquisition as string | null}
      />

      <div className="card">
        <h2>Charges décaissées {anneeEnCours} <span className="tag">total</span></h2>
        <div className="kpi" style={{ maxWidth: 260 }}>
          <div className="label">Total</div>
          <div className="value">{formatEuros(chargesAnnuelles)}</div>
        </div>
        <div className="placeholder-note">
          Squelette — répartition par catégorie (prêt, taxe foncière, entretien, eau/élec, assurance) pas encore
          disponible : le journal ne classe pas encore les écritures par catégorie de charge.
        </div>
      </div>

      <div className="card">
        <h2>Fiche immeuble <span className="tag">squelette</span></h2>
        <div className="empty">
          <div className="big">À détailler</div>
          Historique du prêt, travaux réalisés, DPE, copropriété/mono-propriété...
        </div>
      </div>
    </section>
  );
}
