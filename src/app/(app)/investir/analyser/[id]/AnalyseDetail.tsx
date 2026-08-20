"use client";

import { useActionState, useTransition } from "react";
import { saveAnalyse, deleteAnalyse, addLigneLoyer, deleteLigneLoyer, type SaveState } from "../actions";
import { formatEuros } from "@/lib/budget";
import type { AnalyseBienKpis } from "@/lib/analyse-bien";

export type Analyse = {
  id: string;
  adresse: string;
  statut: string;
  prixAnnonceCents: number | null;
  prixOffreCents: number | null;
  fraisNotaireCents: number | null;
  fraisAgenceCents: number | null;
  fraisDossierGarantieCents: number | null;
  travauxEstimesCents: number | null;
  apportCents: number | null;
  montantEmprunteCents: number | null;
  tauxPct: number | null;
  dureeAnnees: number | null;
  assuranceEmprunteurCents: number | null;
  taxeFonciereCents: number | null;
  chargesCoproCents: number | null;
  assurancePnoCents: number | null;
  chargesAnnuellesCents: number | null;
  surfaceM2: number | null;
  vacanceLocativePct: number | null;
  gliPct: number | null;
  fraisGestionPct: number | null;
  notes: string | null;
};

export type LigneLoyer = { id: string; nom: string; loyerHcCents: number; chargesCents: number };

const initialState: SaveState = {};

function euros(cents: number | null): string {
  return cents ? (cents / 100).toString() : "";
}

export default function AnalyseDetail({
  analyse,
  lignes,
  kpis,
}: {
  analyse: Analyse;
  lignes: LigneLoyer[];
  kpis: AnalyseBienKpis;
}) {
  const [state, formAction, pending] = useActionState(saveAnalyse, initialState);
  const [, startTransition] = useTransition();

  return (
    <>
      <div className="kpis">
        <div className="kpi"><div className="label">Coût total de l&apos;opération</div><div className="value">{formatEuros(kpis.coutTotalCents)}</div></div>
        <div className="kpi"><div className="label">Négociation</div><div className="value">{kpis.pourcentageNegociation !== null ? `${kpis.pourcentageNegociation.toFixed(1)} %` : "—"}</div><div className="sub">vs prix affiché</div></div>
        <div className="kpi"><div className="label">Mensualité totale</div><div className="value">{formatEuros(kpis.mensualiteTotaleCents)}</div><div className="sub">crédit {formatEuros(kpis.mensualiteCreditCents)} + assurance emprunteur</div></div>
        <div className="kpi"><div className="label">Prix de revient au m²</div><div className="value">{kpis.prixM2Cents !== null ? formatEuros(kpis.prixM2Cents) : "—"}</div></div>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="label">Loyers HC annuels (plein)</div><div className="value">{formatEuros(kpis.loyersHcAnnuelsCents)}</div></div>
        <div className="kpi"><div className="label">Loyers HC effectifs</div><div className="value">{formatEuros(kpis.loyersHcEffectifsCents)}</div><div className="sub">après vacance locative</div></div>
        <div className="kpi"><div className="label">GLI + gestion locative</div><div className="value">{formatEuros(kpis.gliCents + kpis.fraisGestionCents)}</div><div className="sub">inclus dans les charges ci-dessous</div></div>
        <div className="kpi"><div className="label">Charges totales retenues</div><div className="value">{formatEuros(kpis.chargesTotalesCents)}</div></div>
      </div>

      <div className="placeholder-note">
        Brute = loyers HC ÷ coût total · Nette = (loyers HC effectifs − charges) ÷ coût total · Net-net = (... − IS
        estimé) ÷ coût total. Loyers effectifs = loyers HC − vacance locative. Charges totales = taxe foncière +
        copropriété + assurance PNO + autres charges + GLI + frais de gestion (ces deux derniers en % des loyers HC,
        si renseignés). Les intérêts d&apos;emprunt ne sont pas déduits des rentabilités (ça relève du financement,
        pas de la performance du bien) — ils se lisent dans le cash-flow ci-dessous.
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Vue réelle <span className="tag">loyers à 100 %</span></h2>
          <table>
            <tbody>
              <tr><td>Rentabilité brute</td><td className="num">{kpis.rentabiliteBrute !== null ? `${kpis.rentabiliteBrute.toFixed(1)} %` : "—"}</td></tr>
              <tr><td>Rentabilité nette</td><td className="num">{kpis.rentabiliteNette !== null ? `${kpis.rentabiliteNette.toFixed(1)} %` : "—"}</td></tr>
              <tr style={{ borderBottom: "1px solid var(--ink)" }}><td>Rentabilité net-net</td><td className="num">{kpis.rentabiliteNetNette !== null ? `${kpis.rentabiliteNetNette.toFixed(1)} %` : "—"}</td></tr>
              <tr><td>Cash-flow brut <span className="tag" style={{ color: "var(--ink-soft)" }}>loyers effectifs − mensualité</span></td><td className="num">{formatEuros(kpis.vue100.cashflowBrutCents)}</td></tr>
              <tr><td>Cash-flow net <span className="tag" style={{ color: "var(--ink-soft)" }}>− charges</span></td><td className="num">{formatEuros(kpis.vue100.cashflowNetCents)}</td></tr>
              <tr><td>Cash-flow net-net <span className="tag" style={{ color: "var(--ink-soft)" }}>− IS estimé</span></td><td className="num">{formatEuros(kpis.vue100.cashflowNetNetCents)}</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Cash-on-cash</b> <span className="tag" style={{ color: "var(--ink-soft)" }}>cash-flow net ÷ apport</span></td><td className="num"><b>{kpis.cashOnCash !== null ? `${kpis.cashOnCash.toFixed(1)} %` : "—"}</b></td></tr>
            </tbody>
          </table>
          <div className="card-sub" style={{ marginTop: 8 }}>Rentabilité = performance du bien seul. Cash-flow = ce qui atterrit vraiment sur ton compte, crédit compris — les deux comptent, pour des questions différentes.</div>
        </div>
        <div className="card">
          <h2>Vue banque <span className="tag">loyers pondérés 70 %</span></h2>
          <table>
            <tbody>
              <tr><td>Loyers retenus par la banque</td><td className="num">{formatEuros(kpis.vueBanque70.loyersPonderesCents)}</td></tr>
              <tr><td>Rentabilité brute</td><td className="num">{kpis.vueBanque70.rentabiliteBrute !== null ? `${kpis.vueBanque70.rentabiliteBrute.toFixed(1)} %` : "—"}</td></tr>
              <tr style={{ borderBottom: "1px solid var(--ink)" }}><td>Rentabilité nette</td><td className="num">{kpis.vueBanque70.rentabiliteNette !== null ? `${kpis.vueBanque70.rentabiliteNette.toFixed(1)} %` : "—"}</td></tr>
              <tr><td>Cash-flow brut</td><td className="num">{formatEuros(kpis.vueBanque70.cashflowBrutCents)}</td></tr>
              <tr><td>Cash-flow net</td><td className="num">{formatEuros(kpis.vueBanque70.cashflowNetCents)}</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Cash-flow net-net</b></td><td className="num"><b>{formatEuros(kpis.vueBanque70.cashflowNetNetCents)}</b></td></tr>
            </tbody>
          </table>
          <div className="card-sub" style={{ marginTop: 8 }}>
            Le HCSF plafonne le taux d&apos;endettement à 35 % et les banques ne retiennent que 70 % des loyers dans
            ce calcul (marge de prudence vacance/impayés) — c&apos;est cette vue, plus pessimiste, qui détermine ta
            capacité à obtenir le prêt, pas ta rentabilité réelle ci-contre.
          </div>
        </div>
      </div>

      <div className="card">
        <h2>Caractéristiques</h2>
        <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input type="hidden" name="id" value={analyse.id} />
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <input name="adresse" defaultValue={analyse.adresse} required placeholder="Adresse" style={{ minWidth: 260 }} />
            <select name="statut" defaultValue={analyse.statut} style={{ maxWidth: 140 }}>
              <option value="a_l_etude">À l&apos;étude</option>
              <option value="abandonne">Abandonné</option>
              <option value="achete">Acheté</option>
            </select>
          </div>

          <div className="cat-block"><div className="cat-title">Prix et négociation</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input name="prix_annonce" defaultValue={euros(analyse.prixAnnonceCents)} placeholder="Prix de vente (annonce) €" style={{ maxWidth: 170 }} />
              <input name="prix_offre" defaultValue={euros(analyse.prixOffreCents)} placeholder="Prix d'achat (après négo) €" style={{ maxWidth: 180 }} />
            </div>
            <div className="card-sub" style={{ marginTop: 6 }}>Le % de négociation entre les deux se calcule tout seul, dans les chiffres ci-dessus.</div>
          </div>

          <div className="cat-block"><div className="cat-title">Coût de l&apos;opération</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input name="frais_notaire" defaultValue={euros(analyse.fraisNotaireCents)} placeholder="Frais de notaire €" style={{ maxWidth: 150 }} />
              <input name="frais_agence" defaultValue={euros(analyse.fraisAgenceCents)} placeholder="Frais d'agence / marchand de bien €" style={{ maxWidth: 210 }} />
              <input name="frais_dossier_garantie" defaultValue={euros(analyse.fraisDossierGarantieCents)} placeholder="Frais de dossier + garantie bancaire €" style={{ maxWidth: 220 }} />
              <input name="travaux_estimes" defaultValue={euros(analyse.travauxEstimesCents)} placeholder="Travaux estimés €" style={{ maxWidth: 150 }} />
              <input name="surface" defaultValue={analyse.surfaceM2 ?? ""} placeholder="Surface habitable m²" style={{ maxWidth: 160 }} />
            </div>
          </div>

          <div className="cat-block"><div className="cat-title">Financement</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input name="apport" defaultValue={euros(analyse.apportCents)} placeholder="Apport €" style={{ maxWidth: 130 }} />
              <input name="montant_emprunte" defaultValue={euros(analyse.montantEmprunteCents)} placeholder="Montant emprunté €" style={{ maxWidth: 160 }} />
              <input name="taux" defaultValue={analyse.tauxPct ?? ""} placeholder="Taux %" style={{ maxWidth: 90 }} />
              <input name="duree" defaultValue={analyse.dureeAnnees ?? ""} placeholder="Durée (années)" style={{ maxWidth: 130 }} />
              <input name="assurance_emprunteur" defaultValue={euros(analyse.assuranceEmprunteurCents)} placeholder="Assurance emprunteur €/mois" style={{ maxWidth: 190 }} />
            </div>
          </div>

          <div className="cat-block"><div className="cat-title">Charges annuelles à la charge du propriétaire</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input name="taxe_fonciere" defaultValue={euros(analyse.taxeFonciereCents)} placeholder="Taxe foncière €/an" style={{ maxWidth: 160 }} />
              <input name="charges_copro" defaultValue={euros(analyse.chargesCoproCents)} placeholder="Charges copropriété €/an (si copro)" style={{ maxWidth: 220 }} />
              <input name="assurance_pno" defaultValue={euros(analyse.assurancePnoCents)} placeholder="Assurance PNO €/an" style={{ maxWidth: 170 }} />
              <input name="charges_annuelles" defaultValue={euros(analyse.chargesAnnuellesCents)} placeholder="Autres charges €/an (comptable, entretien, provisions...)" style={{ minWidth: 300 }} />
            </div>
          </div>

          <div className="cat-block"><div className="cat-title">Hypothèses de marché <span className="tag">optionnel</span></div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
              <input name="vacance_locative" defaultValue={analyse.vacanceLocativePct ?? ""} placeholder="Vacance locative %" style={{ maxWidth: 150 }} />
              <input name="gli" defaultValue={analyse.gliPct ?? ""} placeholder="GLI (loyers impayés) %" style={{ maxWidth: 170 }} />
              <input name="frais_gestion" defaultValue={analyse.fraisGestionPct ?? ""} placeholder="Frais de gestion locative %" style={{ maxWidth: 190 }} />
            </div>
            <div className="card-sub" style={{ marginTop: 6 }}>
              Laisse vide si tu gères toi-même sans intermédiaire et sans hypothèse de vacance — ces trois champs sont
              à 0 par défaut, donc sans effet tant que tu ne les remplis pas.
            </div>
          </div>

          <textarea name="notes" defaultValue={analyse.notes ?? ""} placeholder="Notes libres" rows={3} style={{ width: "100%", fontFamily: "inherit", fontSize: 12.5, padding: 8 }} />

          <div>
            <button
              type="submit"
              disabled={pending}
              style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              {pending ? "..." : "Enregistrer"}
            </button>
          </div>
        </form>
        {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 6 }}>{state.error}</div>}
      </div>

      <div className="card">
        <h2>Revenus locatifs</h2>
        <table>
          <thead><tr><th>Lot</th><th className="num">Loyer HC</th><th className="num">Charges</th><th></th></tr></thead>
          <tbody>
            {lignes.length === 0 && (
              <tr><td colSpan={4} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune ligne renseignée</td></tr>
            )}
            {lignes.map((l) => (
              <tr key={l.id}>
                <td>{l.nom}</td>
                <td className="num">{formatEuros(l.loyerHcCents)}</td>
                <td className="num">{formatEuros(l.chargesCents)}</td>
                <td>
                  <span
                    style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                    onClick={() => startTransition(() => { deleteLigneLoyer(l.id, analyse.id); })}
                  >
                    Supprimer
                  </span>
                </td>
              </tr>
            ))}
            {lignes.length > 0 && (
              <tr style={{ borderTop: "1px solid var(--ink)" }}>
                <td><b>Total / mois</b></td>
                <td className="num"><b>{formatEuros(lignes.reduce((s, l) => s + l.loyerHcCents, 0))}</b></td>
                <td className="num"><b>{formatEuros(lignes.reduce((s, l) => s + l.chargesCents, 0))}</b></td>
                <td></td>
              </tr>
            )}
          </tbody>
        </table>
        <AjouterLigneForm analyseId={analyse.id} />
      </div>

      <div className="card">
        <span
          style={{ color: "var(--brick)", cursor: "pointer", fontSize: 12 }}
          onClick={() => startTransition(() => { deleteAnalyse(analyse.id); })}
        >
          Supprimer cette analyse
        </span>
      </div>
    </>
  );
}

function AjouterLigneForm({ analyseId }: { analyseId: string }) {
  const [state, formAction, pending] = useActionState(addLigneLoyer, initialState);
  return (
    <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
      <input type="hidden" name="analyse_id" value={analyseId} />
      <input name="nom" placeholder="Nom du lot (ex : T3 RDC)" required style={{ maxWidth: 180 }} />
      <input name="loyer_hc" placeholder="Loyer HC €/mois" style={{ maxWidth: 130 }} />
      <input name="charges" placeholder="Charges €/mois" style={{ maxWidth: 120 }} />
      <button
        type="submit"
        disabled={pending}
        style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
      >
        + Ajouter
      </button>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11 }}>{state.error}</div>}
    </form>
  );
}
