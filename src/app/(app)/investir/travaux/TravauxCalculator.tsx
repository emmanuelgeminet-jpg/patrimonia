"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addLigneTravaux, deleteLigneTravaux, type SaveState } from "./actions";
import { formatEuros } from "@/lib/budget";

export type Analyse = { id: string; adresse: string };
export type LigneTravaux = {
  id: string;
  piece: string;
  typeTravaux: string;
  surfaceM2: number | null;
  prixM2Cents: number | null;
  sousTotalCents: number;
};

const initialState: SaveState = {};

export default function TravauxCalculator({
  analyses,
  selectedId,
  lignes,
  prixM2Renovation,
  prixM2GlobalInteretsCompris,
}: {
  analyses: Analyse[];
  selectedId: string | null;
  lignes: LigneTravaux[];
  prixM2Renovation: number | null;
  prixM2GlobalInteretsCompris: number | null;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(addLigneTravaux, initialState);

  const totalTravaux = lignes.reduce((s, l) => s + l.sousTotalCents, 0);
  const surfaceTotale = lignes.reduce((s, l) => s + (l.surfaceM2 ?? 0), 0);

  if (analyses.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="big">Aucune analyse en cours</div>
          Crée d&apos;abord une fiche dans &quot;Analyser un bien&quot; pour pouvoir y rattacher un estimatif de travaux.
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2>Calculateur — lié à une analyse</h2>
      <div className="form-row" style={{ border: "none", padding: "0 0 12px" }}>
        <label>Bien concerné</label>
        <select value={selectedId ?? ""} onChange={(e) => router.push(`/investir/travaux?analyse=${e.target.value}`)}>
          {analyses.map((a) => (
            <option key={a.id} value={a.id}>{a.adresse}</option>
          ))}
        </select>
      </div>

      <table>
        <thead><tr><th>Pièce</th><th>Type de travaux</th><th className="num">Surface</th><th className="num">Prix/m²</th><th className="num">Sous-total</th><th></th></tr></thead>
        <tbody>
          {lignes.length === 0 && (
            <tr><td colSpan={6} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune ligne pour l&apos;instant</td></tr>
          )}
          {lignes.map((l) => (
            <tr key={l.id}>
              <td>{l.piece}</td>
              <td>{l.typeTravaux}</td>
              <td className="num">{l.surfaceM2 ? `${l.surfaceM2} m²` : "—"}</td>
              <td className="num">{l.prixM2Cents ? formatEuros(l.prixM2Cents) : "—"}</td>
              <td className="num">{formatEuros(l.sousTotalCents)}</td>
              <td>
                <span
                  style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                  onClick={() => startTransition(() => { deleteLigneTravaux(l.id); })}
                >
                  Supprimer
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        {selectedId && (
          <tfoot>
            <tr style={{ background: "var(--paper)" }}>
              <td colSpan={6} style={{ padding: "10px 6px" }}>
                <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                  <input type="hidden" name="analyse_id" value={selectedId} />
                  <input name="piece" placeholder="Pièce (ex : Salle de bain)" required style={{ maxWidth: 150 }} />
                  <input name="type_travaux" placeholder="Type de travaux" required style={{ maxWidth: 150 }} />
                  <input name="surface_m2" placeholder="Surface m²" style={{ maxWidth: 90 }} />
                  <input name="prix_m2" placeholder="Prix/m² €" style={{ maxWidth: 90 }} />
                  <input name="sous_total" placeholder="ou montant forfait €" style={{ maxWidth: 130 }} />
                  <button
                    type="submit"
                    disabled={pending}
                    style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    + Ajouter
                  </button>
                </form>
                {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
              </td>
            </tr>
          </tfoot>
        )}
      </table>

      <div className="grid2" style={{ marginTop: 16 }}>
        <div className="card">
          <h2>Synthèse travaux</h2>
          <table><tbody>
            <tr><td>Surface totale rénovée</td><td className="num">{surfaceTotale} m²</td></tr>
            <tr><td>Montant total travaux</td><td className="num"><b>{formatEuros(totalTravaux)}</b></td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}>
              <td><b>Prix moyen de rénovation au m²</b></td>
              <td className="num"><b>{prixM2Renovation !== null ? `${formatEuros(prixM2Renovation)}/m²` : "—"}</b></td>
            </tr>
          </tbody></table>
        </div>
        <div className="card">
          <h2>Coût réel tout compris</h2>
          <div className="card-sub">Prix d&apos;acquisition + notaire + travaux + intérêts d&apos;emprunt sur toute la durée, rapporté à la surface habitable du bien</div>
          <table><tbody>
            <tr style={{ borderTop: "1px solid var(--ink)" }}>
              <td><b>Prix global au m² (intérêts compris)</b></td>
              <td className="num"><b>{prixM2GlobalInteretsCompris !== null ? `${formatEuros(prixM2GlobalInteretsCompris)}/m²` : "—"}</b></td>
            </tr>
          </tbody></table>
          <div className="placeholder-note">
            Différent de la rentabilité calculée dans &quot;Analyser un bien&quot; (qui exclut les intérêts à dessein) —
            ce chiffre-ci répond à &quot;combien ce bien me coûte réellement, financement compris&quot;. Nécessite la
            surface habitable, le prix d&apos;acquisition et le financement renseignés sur l&apos;analyse liée.
          </div>
        </div>
      </div>
    </div>
  );
}
