"use client";

import { useState, useActionState, useTransition } from "react";
import { addLocataire, markLocataireSorti, deleteLocataire, genererQuittance, saveValeurVenale, type SaveState } from "./actions";
import { formatEuros } from "@/lib/budget";
import { STATUT_LOYER_LABELS, type StatutLoyer } from "@/lib/loyers";

export type Locataire = {
  id: string;
  nom: string;
  email: string | null;
  dateEntree: string | null;
  dateSortie: string | null;
  loyerHcCents: number;
  chargesCents: number;
  depotGarantieCents: number | null;
  depotGarantieDate: string | null;
  depotGarantieMode: string | null;
};

export type Lot = { id: string; nom: string; locataires: Locataire[]; statut: StatutLoyer; valeurVenaleCents: number | null };

const STATUT_PILL_CLASS: Record<StatutLoyer, string> = { paye: "ok", partiel: "warn", en_attente: "due", vacant: "vac" };

const initialState: SaveState = {};

function formatDateFr(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function UnitTabs({ lots }: { lots: Lot[] }) {
  const [active, setActive] = useState<string | undefined>(lots[0]?.id);
  const activeLot = lots.find((l) => l.id === active);

  if (lots.length === 0) {
    return (
      <div className="card">
        <div className="empty"><div className="big">Aucun lot</div>Pas encore de lot enregistré pour cette SCI.</div>
      </div>
    );
  }

  return (
    <>
      <div className="unit-tabs">
        {lots.map((l) => (
          <div
            key={l.id}
            className={`unit-tab${active === l.id ? " active" : ""}`}
            onClick={() => setActive(l.id)}
            role="tab"
            aria-selected={active === l.id}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActive(l.id); }}
          >
            {l.nom} <span className={`pill ${STATUT_PILL_CLASS[l.statut]}`} style={{ marginLeft: 4 }}>{STATUT_LOYER_LABELS[l.statut]}</span>
          </div>
        ))}
      </div>

      {activeLot && <LotContent key={activeLot.id} lot={activeLot} />}
    </>
  );
}

function LotContent({ lot }: { lot: Lot }) {
  const actif = lot.locataires.find((l) => !l.dateSortie);
  const [, startTransition] = useTransition();

  return (
    <div className="card">
      <h2>
        {lot.nom}{actif ? ` — ${actif.nom}` : ""}{" "}
        <span className={`pill ${STATUT_PILL_CLASS[lot.statut]}`}>{STATUT_LOYER_LABELS[lot.statut]} ce mois-ci</span>
      </h2>

      {actif ? (
        <>
          <table>
            <tbody>
              <tr><td>Email</td><td className="num">{actif.email ?? "—"}</td></tr>
              <tr><td>Loyer HC</td><td className="num">{formatEuros(actif.loyerHcCents)}</td></tr>
              <tr><td>Charges (provisions)</td><td className="num">{formatEuros(actif.chargesCents)}</td></tr>
              <tr><td><b>Total loyer + charges</b></td><td className="num"><b>{formatEuros(actif.loyerHcCents + actif.chargesCents)}</b></td></tr>
              <tr><td>Date d&apos;entrée</td><td className="num">{formatDateFr(actif.dateEntree)}</td></tr>
              <tr>
                <td>Dépôt de garantie</td>
                <td className="num">
                  {actif.depotGarantieCents ? formatEuros(actif.depotGarantieCents) : "—"}
                  {actif.depotGarantieDate ? ` — ${formatDateFr(actif.depotGarantieDate)}` : ""}
                  {actif.depotGarantieMode ? ` — ${actif.depotGarantieMode}` : ""}
                </td>
              </tr>
            </tbody>
          </table>
          <div style={{ marginTop: 10, display: "flex", gap: 14, alignItems: "center" }}>
            <span
              style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
              onClick={() => startTransition(() => { markLocataireSorti(actif.id); })}
            >
              Marquer sorti
            </span>
            <QuittanceButton lotId={lot.id} />
          </div>
          <div className="placeholder-note" style={{ marginTop: 10 }}>
            Le statut du mois se calcule depuis le Journal comptable — pense à choisir ce logement dans le champ
            &quot;Concerne&quot; quand tu saisis l&apos;encaissement du loyer, sinon il restera marqué &quot;En attente&quot;.
          </div>
        </>
      ) : (
        <div className="empty" style={{ padding: "16px 4px" }}>
          <div className="big">Lot vacant</div>
          Aucun locataire actif — ajoute-le ci-dessous quand quelqu&apos;un emménage.
        </div>
      )}

      {lot.locataires.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, marginBottom: 6 }}>
            Historique
          </div>
          <table>
            <thead><tr><th>Locataire</th><th>Entrée</th><th>Sortie</th><th className="num">Loyer HC</th><th></th></tr></thead>
            <tbody>
              {lot.locataires.map((l) => (
                <tr key={l.id}>
                  <td>{l.nom}</td>
                  <td>{formatDateFr(l.dateEntree)}</td>
                  <td>{formatDateFr(l.dateSortie)}</td>
                  <td className="num">{formatEuros(l.loyerHcCents)}</td>
                  <td>
                    <span
                      style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                      onClick={() => startTransition(() => { deleteLocataire(l.id); })}
                    >
                      Supprimer
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ValeurVenaleForm lot={lot} />

      <AjouterLocataireForm lotId={lot.id} />
    </div>
  );
}

function ValeurVenaleForm({ lot }: { lot: Lot }) {
  const [state, formAction, pending] = useActionState(saveValeurVenale, initialState);
  const actif = lot.locataires.find((l) => !l.dateSortie);
  const rentabilite =
    lot.valeurVenaleCents && actif ? (((actif.loyerHcCents + actif.chargesCents) * 12) / lot.valeurVenaleCents) * 100 : null;

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--line)" }}>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input type="hidden" name="lot_id" value={lot.id} />
        <label style={{ fontSize: 12 }}>Valeur vénale estimée :</label>
        <input
          name="valeur_venale"
          placeholder="€"
          defaultValue={lot.valeurVenaleCents ? (lot.valeurVenaleCents / 100).toString() : ""}
          style={{ maxWidth: 130 }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          Enregistrer
        </button>
        {rentabilite !== null && (
          <span className="tag" style={{ color: "var(--sage)" }}>Rentabilité brute : {rentabilite.toFixed(1)} %</span>
        )}
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}

function AjouterLocataireForm({ lotId }: { lotId: string }) {
  const [state, formAction, pending] = useActionState(addLocataire, initialState);
  return (
    <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
      <input type="hidden" name="lot_id" value={lotId} />
      <input name="nom" placeholder="Nom du locataire" required style={{ maxWidth: 160 }} />
      <input type="email" name="email" placeholder="Email (optionnel)" style={{ maxWidth: 180 }} />
      <input type="date" name="date_entree" style={{ maxWidth: 140 }} />
      <input name="loyer_hc" placeholder="Loyer HC €" style={{ maxWidth: 100 }} />
      <input name="charges" placeholder="Charges €" style={{ maxWidth: 90 }} />
      <input name="depot_garantie" placeholder="Dépôt garantie €" style={{ maxWidth: 120 }} />
      <input type="date" name="depot_garantie_date" style={{ maxWidth: 140 }} />
      <input name="depot_garantie_mode" placeholder="Mode dépôt (ex : Virement)" style={{ maxWidth: 140 }} />
      <button
        type="submit"
        disabled={pending}
        style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
      >
        + Ajouter un locataire
      </button>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, width: "100%" }}>{state.error}</div>}
    </form>
  );
}

function QuittanceButton({ lotId }: { lotId: string }) {
  const [mois, setMois] = useState(() => new Date().toISOString().slice(0, 7));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const onGenerer = () => {
    setError(null);
    setWarning(null);
    startTransition(async () => {
      const result = await genererQuittance(lotId, mois);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.warning) setWarning(result.warning);
      if (result.url) window.open(result.url, "_blank");
    });
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
      <input type="month" value={mois} onChange={(e) => setMois(e.target.value)} style={{ maxWidth: 130, fontSize: 11 }} />
      <span style={{ color: "var(--sage)", cursor: "pointer", fontSize: 11 }} onClick={onGenerer}>
        {pending ? "Génération..." : "Générer la quittance"}
      </span>
      {error && <span style={{ color: "var(--brick)", fontSize: 11 }}>{error}</span>}
      {warning && <span style={{ color: "var(--amber)", fontSize: 11 }}>{warning}</span>}
    </div>
  );
}
