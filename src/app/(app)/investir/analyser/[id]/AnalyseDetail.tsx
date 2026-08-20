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
  travauxEstimesCents: number | null;
  apportCents: number | null;
  montantEmprunteCents: number | null;
  tauxPct: number | null;
  dureeAnnees: number | null;
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
        <div className="kpi"><div className="label">Mensualité de crédit</div><div className="value">{formatEuros(kpis.mensualiteCents)}</div></div>
        <div className="kpi"><div className="label">Rentabilité brute</div><div className="value">{kpis.rentabiliteBrute !== null ? `${kpis.rentabiliteBrute.toFixed(1)} %` : "—"}</div></div>
        <div className="kpi"><div className="label">Rentabilité nette</div><div className="value">{kpis.rentabiliteNette !== null ? `${kpis.rentabiliteNette.toFixed(1)} %` : "—"}</div></div>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="label">Rentabilité net-net</div><div className="value">{kpis.rentabiliteNetNette !== null ? `${kpis.rentabiliteNetNette.toFixed(1)} %` : "—"}</div><div className="sub">après IS estimé à 15 %, simplifié</div></div>
        <div className="kpi"><div className="label">Cashflow annuel avant impôt</div><div className="value">{formatEuros(kpis.cashflowAnnuelCents)}</div></div>
        <div className="kpi"><div className="label">Cash-on-cash</div><div className="value">{kpis.cashOnCash !== null ? `${kpis.cashOnCash.toFixed(1)} %` : "—"}</div><div className="sub">cashflow ÷ apport — rendement sur ta mise de départ</div></div>
        <div className="kpi"><div className="label">Prix de revient au m²</div><div className="value">{kpis.prixM2Cents !== null ? formatEuros(kpis.prixM2Cents) : "—"}</div></div>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="label">Loyers HC annuels (plein)</div><div className="value">{formatEuros(kpis.loyersHcAnnuelsCents)}</div></div>
        <div className="kpi"><div className="label">Loyers HC effectifs</div><div className="value">{formatEuros(kpis.loyersHcEffectifsCents)}</div><div className="sub">après vacance locative</div></div>
        <div className="kpi"><div className="label">GLI + gestion locative</div><div className="value">{formatEuros(kpis.gliCents + kpis.fraisGestionCents)}</div><div className="sub">inclus dans les charges ci-dessus</div></div>
        <div className="kpi"><div className="label">Charges totales retenues</div><div className="value">{formatEuros(kpis.chargesTotalesCents)}</div></div>
      </div>

      <div className="placeholder-note">
        Brute = loyers HC ÷ coût total · Nette = (loyers HC effectifs − charges) ÷ coût total · Net-net = (... − IS
        estimé) ÷ coût total. Loyers effectifs = loyers HC − vacance locative. Charges totales = charges saisies +
        GLI + frais de gestion (tous deux en % des loyers HC, si renseignés). Les intérêts d&apos;emprunt ne sont pas
        déduits des rentabilités (ça relève du financement, pas de la performance du bien) — ils se lisent dans le
        cashflow et le cash-on-cash.
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
              <input name="prix_annonce" defaultValue={euros(analyse.prixAnnonceCents)} placeholder="Prix de l'annonce €" style={{ maxWidth: 160 }} />
              <input name="prix_offre" defaultValue={euros(analyse.prixOffreCents)} placeholder="Montant de l'offre €" style={{ maxWidth: 160 }} />
            </div>
          </div>

          <div className="cat-block"><div className="cat-title">Coût de l&apos;opération</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input name="frais_notaire" defaultValue={euros(analyse.fraisNotaireCents)} placeholder="Frais de notaire €" style={{ maxWidth: 160 }} />
              <input name="travaux_estimes" defaultValue={euros(analyse.travauxEstimesCents)} placeholder="Travaux estimés €" style={{ maxWidth: 160 }} />
              <input name="surface" defaultValue={analyse.surfaceM2 ?? ""} placeholder="Surface habitable m²" style={{ maxWidth: 160 }} />
            </div>
          </div>

          <div className="cat-block"><div className="cat-title">Financement</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input name="apport" defaultValue={euros(analyse.apportCents)} placeholder="Apport €" style={{ maxWidth: 140 }} />
              <input name="montant_emprunte" defaultValue={euros(analyse.montantEmprunteCents)} placeholder="Montant emprunté €" style={{ maxWidth: 160 }} />
              <input name="taux" defaultValue={analyse.tauxPct ?? ""} placeholder="Taux %" style={{ maxWidth: 90 }} />
              <input name="duree" defaultValue={analyse.dureeAnnees ?? ""} placeholder="Durée (années)" style={{ maxWidth: 120 }} />
            </div>
          </div>

          <div className="cat-block"><div className="cat-title">Charges annuelles à la charge du propriétaire</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input name="charges_annuelles" defaultValue={euros(analyse.chargesAnnuellesCents)} placeholder="Autres charges €/an (taxe foncière, assurance, comptable, provision travaux...)" style={{ minWidth: 320 }} />
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
