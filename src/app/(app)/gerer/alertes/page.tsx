import { createClient } from "@/lib/supabase/server";
import { statutLoyerDuMois } from "@/lib/loyers";
import { formatEuros } from "@/lib/budget";

const JOUR_SEUIL_RETARD = 10;
const DPE_VALIDITE_ANNEES = 10;
const DPE_ALERTE_MOIS_AVANT = 12;
const BAIL_ALERTE_JOURS_AVANT = 60;

function addMonths(dateStr: string, months: number): Date {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatDateFr(d: Date): string {
  return d.toLocaleDateString("fr-FR");
}

function joursRestants(d: Date): number {
  return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export default async function AlertesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: associeRow } = await supabase.from("sci_associes").select("sci_id").eq("household_id", householdId).limit(1).maybeSingle();
  const sciId = associeRow?.sci_id as string | undefined;

  // ----- Biens (SCI + propres), lots, locataires actifs -----
  const orFilter = sciId ? `sci_id.eq.${sciId},household_id.eq.${householdId}` : `household_id.eq.${householdId}`;
  const { data: biensRows } = await supabase.from("biens").select("id, adresse, owner_type, dpe_classe, dpe_date").or(orFilter);
  const biens = biensRows ?? [];
  const bienIds = biens.map((b) => b.id as string);

  const { data: lotsRows } = bienIds.length
    ? await supabase.from("lots").select("id, nom, bien_id").in("bien_id", bienIds)
    : { data: [] as { id: string; nom: string; bien_id: string }[] };
  const lots = lotsRows ?? [];
  const lotIds = lots.map((l) => l.id as string);

  const { data: locatairesRows } = lotIds.length
    ? await supabase.from("locataires").select("id, nom, lot_id, loyer_hc_cents, charges_cents").in("lot_id", lotIds).is("date_sortie", null)
    : { data: [] as { id: string; nom: string; lot_id: string; loyer_hc_cents: number; charges_cents: number }[] };
  const locataires = locatairesRows ?? [];

  // ----- Loyers en attente ce mois-ci (SCI uniquement — biens propres n'a pas de journal
  // comptable équivalent, donc aucun moyen fiable de savoir si un loyer a été encaissé). -----
  const moisEnCours = new Date().toISOString().slice(0, 7);
  const [anneeNum, moisNum] = moisEnCours.split("-").map(Number);
  const moisSuivant = moisNum === 12 ? `${anneeNum + 1}-01` : `${anneeNum}-${String(moisNum + 1).padStart(2, "0")}`;
  const lotsSciIds = lots.filter((l) => biens.find((b) => b.id === l.bien_id)?.owner_type === "sci").map((l) => l.id as string);

  const { data: ecrituresRows } = lotsSciIds.length
    ? await supabase
        .from("journal_ecritures")
        .select("lot_id, type, montant_cents, financement")
        .in("lot_id", lotsSciIds)
        .eq("type", "encaissement")
        .gte("date", `${moisEnCours}-01`)
        .lt("date", `${moisSuivant}-01`)
    : { data: [] as { lot_id: string | null; type: "encaissement" | "decaissement"; montant_cents: number; financement: "banque_sci" | "avance_associe" }[] };

  const jourDuMois = new Date().getDate();
  const loyersEnAttente =
    jourDuMois >= JOUR_SEUIL_RETARD
      ? lotsSciIds
          .map((lotId) => {
            const lot = lots.find((l) => l.id === lotId)!;
            const bien = biens.find((b) => b.id === lot.bien_id)!;
            const locataire = locataires.find((loc) => loc.lot_id === lotId);
            if (!locataire) return null;
            const { statut, encaisseCents, attenduCents } = statutLoyerDuMois(
              lotId,
              { loyerHcCents: locataire.loyer_hc_cents, chargesCents: locataire.charges_cents },
              (ecrituresRows ?? []).map((e) => ({ lotId: e.lot_id, type: e.type, montantCents: e.montant_cents, financement: e.financement }))
            );
            if (statut !== "en_attente" && statut !== "partiel") return null;
            return { bienAdresse: bien.adresse as string, lotNom: lot.nom as string, locataireNom: locataire.nom, statut, encaisseCents, attenduCents };
          })
          .filter((x): x is NonNullable<typeof x> => x !== null)
      : [];

  // ----- DPE bientôt expirés (SCI et biens propres) -----
  const dpeAlertes = biens
    .filter((b) => b.dpe_date)
    .map((b) => {
      const expiration = addMonths(b.dpe_date as string, DPE_VALIDITE_ANNEES * 12);
      return { bienAdresse: b.adresse as string, dpeClasse: b.dpe_classe as string | null, expiration };
    })
    .filter((a) => joursRestants(a.expiration) <= DPE_ALERTE_MOIS_AVANT * 30)
    .sort((a, b) => a.expiration.getTime() - b.expiration.getTime());

  // ----- Fins de bail approchantes (baux générés depuis l'appli) -----
  const bauxOrFilter = sciId ? `sci_id.eq.${sciId},household_id.eq.${householdId}` : `household_id.eq.${householdId}`;
  const { data: bauxRows } = await supabase
    .from("baux")
    .select("bien_adresse, lot_nom, locataire_nom, date_prise_effet, duree_mois")
    .or(bauxOrFilter);
  const finsDeBailAlertes = (bauxRows ?? [])
    .map((b) => {
      const fin = addMonths(b.date_prise_effet as string, b.duree_mois as number);
      return { bienAdresse: b.bien_adresse as string, lotNom: b.lot_nom as string, locataireNom: b.locataire_nom as string, fin };
    })
    .filter((a) => joursRestants(a.fin) <= BAIL_ALERTE_JOURS_AVANT)
    .sort((a, b) => a.fin.getTime() - b.fin.getTime());

  const totalAlertes = loyersEnAttente.length + dpeAlertes.length + finsDeBailAlertes.length;

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Alertes</b></div>
      <h1>Alertes</h1>
      <div className="pagesub">
        Ce qui mérite ton attention en ce moment — loyers en attente, diagnostics bientôt expirés, fins de bail approchantes.
      </div>

      <div className="card">
        <h2>
          Loyers en attente ce mois-ci <span className="tag">{loyersEnAttente.length}</span>
        </h2>
        <div className="card-sub">
          SCI uniquement — les biens en nom propre n&apos;ont pas de journal comptable équivalent pour suivre les encaissements.
          Calculé après le {JOUR_SEUIL_RETARD} du mois.
        </div>
        {loyersEnAttente.length === 0 ? (
          <div className="empty" style={{ padding: "16px 4px" }}>Rien à signaler</div>
        ) : (
          <table>
            <thead><tr><th>Logement</th><th>Locataire</th><th>Statut</th><th className="num">Encaissé</th><th className="num">Attendu</th></tr></thead>
            <tbody>
              {loyersEnAttente.map((a, i) => (
                <tr key={i}>
                  <td>{a.bienAdresse} — {a.lotNom}</td>
                  <td>{a.locataireNom}</td>
                  <td><span className={`pill ${a.statut === "partiel" ? "warn" : "due"}`}>{a.statut === "partiel" ? "Partiel" : "En attente"}</span></td>
                  <td className="num">{formatEuros(a.encaisseCents)}</td>
                  <td className="num">{formatEuros(a.attenduCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>
          Diagnostics de performance énergétique bientôt expirés <span className="tag">{dpeAlertes.length}</span>
        </h2>
        <div className="card-sub">DPE valable 10 ans — alerte {DPE_ALERTE_MOIS_AVANT} mois avant l&apos;échéance.</div>
        {dpeAlertes.length === 0 ? (
          <div className="empty" style={{ padding: "16px 4px" }}>Rien à signaler</div>
        ) : (
          <table>
            <thead><tr><th>Bien</th><th>Classe</th><th>Expire le</th></tr></thead>
            <tbody>
              {dpeAlertes.map((a, i) => (
                <tr key={i}>
                  <td>{a.bienAdresse}</td>
                  <td>{a.dpeClasse ?? "—"}</td>
                  <td>
                    {formatDateFr(a.expiration)}
                    {joursRestants(a.expiration) < 0 && <span className="pill due" style={{ marginLeft: 6 }}>Expiré</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2>
          Fins de bail approchantes <span className="tag">{finsDeBailAlertes.length}</span>
        </h2>
        <div className="card-sub">Baux générés depuis l&apos;appli, échéance dans les {BAIL_ALERTE_JOURS_AVANT} jours — rappel : un bail non meublé se reconduit tacitement sauf congé donné.</div>
        {finsDeBailAlertes.length === 0 ? (
          <div className="empty" style={{ padding: "16px 4px" }}>Rien à signaler</div>
        ) : (
          <table>
            <thead><tr><th>Logement</th><th>Locataire</th><th>Échéance</th></tr></thead>
            <tbody>
              {finsDeBailAlertes.map((a, i) => (
                <tr key={i}>
                  <td>{a.bienAdresse} — {a.lotNom}</td>
                  <td>{a.locataireNom}</td>
                  <td>
                    {formatDateFr(a.fin)}
                    {joursRestants(a.fin) < 0 && <span className="pill due" style={{ marginLeft: 6 }}>Dépassée</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {totalAlertes === 0 && (
        <div className="placeholder-note">Aucune alerte pour l&apos;instant sur l&apos;ensemble du parc.</div>
      )}
    </section>
  );
}
