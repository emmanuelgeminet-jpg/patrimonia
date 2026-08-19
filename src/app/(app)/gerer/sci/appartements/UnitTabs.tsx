"use client";

import { useState, useActionState, useTransition } from "react";
import { addLocataire, markLocataireSorti, deleteLocataire, type SaveState } from "./actions";
import { formatEuros } from "@/lib/budget";

export type Locataire = {
  id: string;
  nom: string;
  dateEntree: string | null;
  dateSortie: string | null;
  loyerHcCents: number;
  chargesCents: number;
  depotGarantieCents: number | null;
  depotGarantieDate: string | null;
  depotGarantieMode: string | null;
};

export type Lot = { id: string; nom: string; locataires: Locataire[] };

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
            {l.nom}
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
      <h2>{lot.nom}{actif ? ` — ${actif.nom}` : ""}</h2>

      {actif ? (
        <>
          <table>
            <tbody>
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
          <div style={{ marginTop: 10 }}>
            <span
              style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
              onClick={() => startTransition(() => { markLocataireSorti(actif.id); })}
            >
              Marquer sorti
            </span>
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

      <AjouterLocataireForm lotId={lot.id} />
    </div>
  );
}

function AjouterLocataireForm({ lotId }: { lotId: string }) {
  const [state, formAction, pending] = useActionState(addLocataire, initialState);
  return (
    <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
      <input type="hidden" name="lot_id" value={lotId} />
      <input name="nom" placeholder="Nom du locataire" required style={{ maxWidth: 160 }} />
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
