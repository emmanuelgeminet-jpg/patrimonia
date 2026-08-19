"use client";

import { useActionState, useTransition } from "react";
import {
  addMouvementCompteCourant,
  deleteMouvementCompteCourant,
  saveSoldeOuvertureAssocie,
  type SaveState,
} from "../journal/actions";
import { formatEuros } from "@/lib/budget";

export type Associe = { householdId: string; nom: string; soldeOuvertureCents: number };
export type Mouvement = {
  id: string;
  householdId: string;
  date: string;
  type: "apport" | "avance" | "remboursement";
  montantCents: number;
  commentaire: string | null;
};

const initialState: SaveState = {};

const TYPE_LABELS: Record<Mouvement["type"], string> = {
  apport: "Apport",
  avance: "Avance de frais",
  remboursement: "Remboursement",
};

function soldeFor(associe: Associe, mouvements: Mouvement[]): number {
  let total = associe.soldeOuvertureCents;
  for (const m of mouvements) {
    if (m.householdId !== associe.householdId) continue;
    total += m.type === "remboursement" ? -m.montantCents : m.montantCents;
  }
  return total;
}

function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

export default function ComptesCourantsClient({
  associes,
  mouvements,
}: {
  associes: Associe[];
  mouvements: Mouvement[];
}) {
  return (
    <>
      <div className="grid2">
        {associes.map((a) => (
          <SoldeCard key={a.householdId} associe={a} solde={soldeFor(a, mouvements)} />
        ))}
      </div>

      <div className="card">
        <h2>Suivi détaillé — apports, avances et remboursements</h2>
        <table>
          <thead><tr><th>Date</th><th>Foyer</th><th>Type</th><th className="num">Montant</th><th>Commentaire</th><th></th></tr></thead>
          <tbody>
            {mouvements.length === 0 && (
              <tr><td colSpan={6} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucun mouvement enregistré</td></tr>
            )}
            {mouvements.map((m) => {
              const associe = associes.find((a) => a.householdId === m.householdId);
              return <MouvementRow key={m.id} mouvement={m} nomFoyer={associe?.nom ?? "Foyer"} />;
            })}
          </tbody>
        </table>
      </div>

      <AjouterMouvementForm associes={associes} />
    </>
  );
}

function SoldeCard({ associe, solde }: { associe: Associe; solde: number }) {
  const [state, formAction, pending] = useActionState(saveSoldeOuvertureAssocie, initialState);
  return (
    <div className="card">
      <h2>Foyer {associe.nom}</h2>
      <table>
        <tbody>
          <tr><td><b>Solde actuel — ce que la SCI doit à ce foyer</b></td><td className="num"><b>{formatEuros(solde)}</b></td></tr>
        </tbody>
      </table>
      <form action={formAction} style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 10, fontSize: 11 }}>
        <input type="hidden" name="household_id" value={associe.householdId} />
        <label style={{ color: "var(--ink-soft)" }}>Solde de départ (reprise) :</label>
        <input
          name="solde"
          defaultValue={associe.soldeOuvertureCents ? (associe.soldeOuvertureCents / 100).toString() : ""}
          placeholder="0"
          style={{ maxWidth: 100 }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "4px 10px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          Enregistrer
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}

function MouvementRow({ mouvement, nomFoyer }: { mouvement: Mouvement; nomFoyer: string }) {
  const [, startTransition] = useTransition();
  const signe = mouvement.type === "remboursement" ? "− " : "+ ";
  return (
    <tr>
      <td>{formatDateShort(mouvement.date)}</td>
      <td>{nomFoyer}</td>
      <td>{TYPE_LABELS[mouvement.type]}</td>
      <td className="num">{signe}{formatEuros(mouvement.montantCents)}</td>
      <td>{mouvement.commentaire ?? "—"}</td>
      <td>
        <span
          style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
          onClick={() => startTransition(() => { deleteMouvementCompteCourant(mouvement.id); })}
        >
          Supprimer
        </span>
      </td>
    </tr>
  );
}

function AjouterMouvementForm({ associes }: { associes: Associe[] }) {
  const [state, formAction, pending] = useActionState(addMouvementCompteCourant, initialState);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>+ Ajouter un mouvement</h2>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input type="date" name="date" defaultValue={today} required style={{ maxWidth: 140 }} />
        <select name="household_id" required style={{ maxWidth: 150 }}>
          {associes.map((a) => (
            <option key={a.householdId} value={a.householdId}>{a.nom}</option>
          ))}
        </select>
        <select name="type" defaultValue="apport" style={{ maxWidth: 150 }}>
          <option value="apport">Apport</option>
          <option value="avance">Avance de frais</option>
          <option value="remboursement">Remboursement</option>
        </select>
        <input name="montant" placeholder="Montant €" style={{ maxWidth: 100 }} />
        <input name="commentaire" placeholder="Commentaire" style={{ maxWidth: 180 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Ajouter
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
      <div className="card-sub" style={{ marginTop: 8 }}>
        Si ce mouvement correspond aussi à une écriture bancaire de la SCI ou à une avance personnelle, ajoute-le
        plutôt depuis le Journal comptable — il alimentera automatiquement ce suivi.
      </div>
    </div>
  );
}
