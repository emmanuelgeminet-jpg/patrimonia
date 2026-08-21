import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatEuros } from "@/lib/budget";
import FinancementForm from "./FinancementForm";
import FicheForm from "./FicheForm";
import LotsSection, { type Lot } from "./LotsSection";
import QuittancesArchive, { type QuittanceArchiveItem } from "@/components/QuittancesArchive";

export default async function BienPropreDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: bien } = await supabase
    .from("biens")
    .select("*")
    .eq("id", id)
    .eq("owner_type", "propre")
    .eq("household_id", householdId)
    .maybeSingle();

  if (!bien) notFound();

  let { data: lotsRows } = await supabase.from("lots").select("id, nom").eq("bien_id", bien.id).order("nom");
  if (!lotsRows || lotsRows.length === 0) {
    // Biens créés avant la mise en place de la création automatique de lot : on comble le manque
    // à l'affichage, sans nouvelle manip SQL à demander.
    const { data: nouveauLot } = await supabase.from("lots").insert({ bien_id: bien.id, nom: "Logement" }).select("id, nom").single();
    lotsRows = nouveauLot ? [nouveauLot] : [];
  }
  const lotIds = (lotsRows ?? []).map((l) => l.id as string);

  const { data: locatairesRows } = lotIds.length
    ? await supabase.from("locataires").select("*").in("lot_id", lotIds).order("date_entree", { ascending: false })
    : { data: [] as Record<string, unknown>[] };

  const lots: Lot[] = (lotsRows ?? []).map((l) => ({
    id: l.id as string,
    nom: l.nom as string,
    locataires: (locatairesRows ?? [])
      .filter((loc) => loc.lot_id === l.id)
      .map((loc) => ({
        id: loc.id as string,
        nom: loc.nom as string,
        email: loc.email as string | null,
        dateEntree: loc.date_entree as string | null,
        dateSortie: loc.date_sortie as string | null,
        loyerHcCents: loc.loyer_hc_cents as number,
        chargesCents: loc.charges_cents as number,
        depotGarantieCents: loc.depot_garantie_cents as number | null,
        depotGarantieDate: loc.depot_garantie_date as string | null,
        depotGarantieMode: loc.depot_garantie_mode as string | null,
      })),
  }));

  const locatairesActifs = (locatairesRows ?? []).filter((l) => !l.date_sortie);
  const loyerMensuelCents = locatairesActifs.reduce((s, l) => s + (l.loyer_hc_cents as number) + (l.charges_cents as number), 0);
  const creditMensualiteCents = (bien.credit_mensualite_cents as number | null) ?? 0;
  const assuranceMensuelleCents = (bien.assurance_mensuelle_cents as number | null) ?? 0;
  const chargesCoproAnnuellesCents = bien.charges_copro_annuelles_cents as number | null;
  const chargesCoproMensuelles = Math.round((chargesCoproAnnuellesCents ?? 0) / 12);
  const cashflowMensuelCents = loyerMensuelCents - creditMensualiteCents - assuranceMensuelleCents - chargesCoproMensuelles;

  const chargesProvisionneesAnnuellesCents = locatairesActifs.reduce((s, l) => s + (l.charges_cents as number) * 12, 0);
  const soldeChargesCents = chargesCoproAnnuellesCents !== null ? chargesProvisionneesAnnuellesCents - chargesCoproAnnuellesCents : null;

  const { data: quittancesRows } = await supabase
    .from("quittances")
    .select("id, bien_adresse, lot_nom, locataire_nom, mois, loyer_hc_cents, charges_cents, storage_path, created_at")
    .eq("bien_id", bien.id);
  const quittances = quittancesRows ?? [];
  const quittancesPaths = quittances.map((q) => q.storage_path as string);
  const { data: quittancesSignedUrls } = quittancesPaths.length
    ? await supabase.storage.from("documents").createSignedUrls(quittancesPaths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const quittancesUrlByPath = new Map((quittancesSignedUrls ?? []).map((s) => [s.path, s.signedUrl]));
  const quittancesItems: QuittanceArchiveItem[] = quittances.map((q) => ({
    id: q.id as string,
    bienAdresse: q.bien_adresse as string,
    lotNom: q.lot_nom as string,
    locataireNom: q.locataire_nom as string,
    mois: q.mois as string,
    loyerHcCents: q.loyer_hc_cents as number,
    chargesCents: q.charges_cents as number,
    dateGeneration: q.created_at as string,
    url: quittancesUrlByPath.get(q.storage_path as string) ?? null,
  }));

  return (
    <section className="section">
      <div className="crumb">Gestion immobilière <b>› Biens propres › {bien.adresse}</b></div>
      <h1>{bien.adresse as string}</h1>
      <div className="pagesub">{[bien.code_postal, bien.ville].filter(Boolean).join(" ")}</div>

      <div className="kpis">
        <div className="kpi">
          <div className="label">Loyer perçu</div>
          <div className="value">{formatEuros(loyerMensuelCents)}</div>
          <div className="sub">par mois, charges comprises</div>
        </div>
        <div className="kpi">
          <div className="label">Crédit + assurance</div>
          <div className="value">{formatEuros(creditMensualiteCents + assuranceMensuelleCents)}</div>
          <div className="sub">par mois</div>
        </div>
        <div className="kpi">
          <div className="label">Charges copro</div>
          <div className="value">{chargesCoproAnnuellesCents !== null ? formatEuros(chargesCoproMensuelles) : "—"}</div>
          <div className="sub">équivalent mensuel</div>
        </div>
        <div className="kpi">
          <div className="label">Cashflow net</div>
          <div className="value">{formatEuros(cashflowMensuelCents)}</div>
          <div className="sub">par mois, après crédit/assurance/charges copro</div>
        </div>
      </div>

      <FinancementForm
        bienId={bien.id as string}
        prixAcquisitionCents={bien.prix_acquisition_cents as number | null}
        dateAcquisition={bien.date_acquisition as string | null}
        creditMensualiteCents={bien.credit_mensualite_cents as number | null}
        assuranceMensuelleCents={bien.assurance_mensuelle_cents as number | null}
        chargesCoproAnnuellesCents={chargesCoproAnnuellesCents}
      />

      <div className="card">
        <h2>Charges récupérables <span className="tag">réconciliation locataire</span></h2>
        <div className="card-sub">Ce que le locataire provisionne pour les charges, comparé à ce que tu paies réellement à la copropriété</div>
        {chargesCoproAnnuellesCents === null ? (
          <div className="placeholder-note">Renseigne les charges copro annuelles ci-dessus pour activer ce calcul.</div>
        ) : (
          <>
            <table>
              <tbody>
                <tr><td>Provisions charges collectées (locataire, /an)</td><td className="num">{formatEuros(chargesProvisionneesAnnuellesCents)}</td></tr>
                <tr><td>Charges de copropriété payées (/an)</td><td className="num">{formatEuros(chargesCoproAnnuellesCents)}</td></tr>
                <tr>
                  <td><b>Solde</b></td>
                  <td className="num"><b>{formatEuros(soldeChargesCents ?? 0)}</b></td>
                </tr>
              </tbody>
            </table>
            <div className="placeholder-note" style={{ marginTop: 8 }}>
              {soldeChargesCents !== null && soldeChargesCents > 0
                ? "Solde positif : tu collectes plus que ce que tu paies à la copropriété — une régularisation en faveur du locataire sera probablement due en fin d'année."
                : soldeChargesCents !== null && soldeChargesCents < 0
                  ? "Solde négatif : les provisions ne couvrent pas les charges copro payées — le manque reste à ta charge, sauf régularisation à la hausse."
                  : "Provisions et charges payées s'équilibrent."}
              {" "}Estimation simplifiée : toutes les charges de copropriété ne sont pas légalement récupérables auprès du locataire (les gros travaux par exemple ne le sont pas) — ce calcul suppose que la totalité l&apos;est.
            </div>
          </>
        )}
      </div>

      <LotsSection bienId={bien.id as string} lots={lots} />

      <QuittancesArchive items={quittancesItems} />

      <FicheForm
        fiche={{
          bienId: bien.id as string,
          dpeClasse: bien.dpe_classe as string | null,
          dpeDate: bien.dpe_date as string | null,
          monopropriete: (bien.monopropriete as boolean) ?? true,
          numeroImmatriculation: bien.numero_immatriculation_copropriete as string | null,
          assuranceCompagnie: bien.assurance_pno_compagnie as string | null,
          assurancePolice: bien.assurance_pno_police as string | null,
          notes: bien.notes as string | null,
        }}
      />
    </section>
  );
}
