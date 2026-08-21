"use client";

import { useActionState, useTransition } from "react";
import {
  addMouvementCompteCourant,
  deleteMouvementCompteCourant,
  saveSoldeOuvertureAssocie,
  ajouterAssocie,
  associerFoyerExistant,
  type SaveState,
} from "../journal/actions";
import { formatEuros } from "@/lib/budget";
import InviteLink from "../../../compte/InviteLink";

export type Associe = { householdId: string; nom: string; soldeOuvertureCents: number; peutInviter: boolean };
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
  origin,
}: {
  associes: Associe[];
  mouvements: Mouvement[];
  origin: string;
}) {
  const aInviter = associes.filter((a) => a.peutInviter);

  return (
    <>
      <div className="grid2">
        {associes.map((a) => (
          <SoldeCard key={a.householdId} associe={a} solde={soldeFor(a, mouvements)} />
        ))}
      </div>

      {aInviter.length > 0 && (
        <div className="card">
          <h2>Associés sans compte actif</h2>
          <div className="card-sub">
            Ces foyers font partie de la SCI mais n&apos;ont pas encore de compte Patrimonium. Partage le lien
            correspondant avec eux : en créant leur compte, ils auront accès aux données de la SCI (journal,
            bilan, comptes courants, documents) — mais pas à ton budget personnel ni à tes biens propres, qui
            restent privés à ton foyer.
          </div>
          {aInviter.map((a) => (
            <div key={a.householdId} style={{ marginTop: 10 }}>
              <label style={{ fontSize: 12.5, fontWeight: 600 }}>{a.nom}</label>
              <InviteLink link={`${origin}/login?invite=${a.householdId}`} />
            </div>
          ))}
        </div>
      )}

      <AssocierFoyerExistantForm />
      <AjouterAssocieForm />

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
      <h2>{associe.nom}</h2>
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

function AssocierFoyerExistantForm() {
  const [state, formAction, pending] = useActionState(associerFoyerExistant, initialState);

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>+ Associer un foyer déjà inscrit</h2>
      <div className="card-sub">
        Ton associé a déjà créé son propre compte (avant d&apos;avoir un lien d&apos;invitation) ? Retrouve son
        email dans la liste des utilisateurs inscrits (page Suggestions, si tu es admin) et rattache directement
        son foyer à la SCI — son budget personnel reste privé, seule la SCI devient partagée.
      </div>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input name="email" type="email" required placeholder="Email de son compte" style={{ minWidth: 220 }} />
        <input name="parts" placeholder="Parts" style={{ maxWidth: 100 }} />
        <input name="pourcentage" placeholder="%" style={{ maxWidth: 90 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Associer
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
      {state.success && <div style={{ color: "var(--sage)", fontSize: 11, marginTop: 4 }}>Foyer associé — il verra la SCI à sa prochaine connexion.</div>}
    </div>
  );
}

function AjouterAssocieForm() {
  const [state, formAction, pending] = useActionState(ajouterAssocie, initialState);

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>+ Ajouter un associé</h2>
      <div className="card-sub">
        Crée un nouveau foyer associé de la SCI, même s&apos;il n&apos;a pas encore de compte — il apparaîtra
        ensuite ci-dessus dans &quot;Associés sans compte actif&quot; avec un lien d&apos;invitation à lui envoyer.
      </div>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input name="nom" required placeholder="Nom du foyer (ex : Foyer MARTIN)" style={{ minWidth: 200 }} />
        <input name="parts" placeholder="Parts" style={{ maxWidth: 100 }} />
        <input name="pourcentage" placeholder="%" style={{ maxWidth: 90 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Ajouter
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}
