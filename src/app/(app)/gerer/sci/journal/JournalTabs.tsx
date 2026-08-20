"use client";

import { useMemo, useRef, useState, useActionState, useTransition } from "react";
import {
  addEcriture,
  deleteEcriture,
  uploadJustificatif,
  removeJustificatif,
  saveSoldeOuverture,
  type SaveState,
} from "./actions";
import { formatEuros, formatMonthLabel } from "@/lib/budget";

type TabKey = "mensuel" | "annuel" | "global";

const TABS: { key: TabKey; label: string }[] = [
  { key: "mensuel", label: "Détail mensuel" },
  { key: "annuel", label: "Bilan annuel" },
  { key: "global", label: "Bilan global depuis achat" },
];

export type Ecriture = {
  id: string;
  date: string;
  type: "encaissement" | "decaissement";
  montantCents: number;
  libelle: string;
  modePaiement: string | null;
  bienId: string | null;
  lotId: string | null;
  commentaire: string | null;
  justificatifPath: string | null;
  justificatifUrl: string | null;
  financement: "banque_sci" | "avance_associe";
  associeHouseholdId: string | null;
  associeMouvementType: "apport" | "avance" | "remboursement" | null;
};

export type Associe = { householdId: string; nom: string; soldeOuvertureCents: number };
export type Mouvement = {
  id: string;
  householdId: string;
  date: string;
  type: "apport" | "avance" | "remboursement";
  montantCents: number;
};
export type Bien = { id: string; label: string };
export type Lot = { id: string; nom: string; bienId: string };
export type SciInfo = { id: string; soldeOuvertureCents: number; soldeOuvertureDate: string | null };

const initialState: SaveState = {};

function todayKey() {
  return new Date().toISOString().slice(0, 7);
}

function formatDateShort(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${day}/${month}`;
}

export default function JournalTabs({
  sci,
  biens,
  lots,
  ecritures,
  associes,
  mouvements,
}: {
  sci: SciInfo;
  biens: Bien[];
  lots: Lot[];
  ecritures: Ecriture[];
  associes: Associe[];
  mouvements: Mouvement[];
}) {
  const [active, setActive] = useState<TabKey>("mensuel");

  const months = useMemo(() => {
    const set = new Set(ecritures.map((e) => e.date.slice(0, 7)));
    set.add(todayKey());
    return [...set].sort().reverse();
  }, [ecritures]);

  const [selectedMonth, setSelectedMonth] = useState(months[0]);

  return (
    <>
      <div className="unit-tabs">
        {TABS.map((t) => (
          <div
            key={t.key}
            className={`unit-tab${active === t.key ? " active" : ""}`}
            onClick={() => setActive(t.key)}
            role="tab"
            aria-selected={active === t.key}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActive(t.key); }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {active === "mensuel" && (
        <PanelMensuel
          sci={sci}
          biens={biens}
          lots={lots}
          ecritures={ecritures}
          associes={associes}
          mouvements={mouvements}
          months={months}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      )}
      {active === "annuel" && <PanelAnnuel />}
      {active === "global" && <PanelGlobal />}
    </>
  );
}

function PanelMensuel({
  sci,
  biens,
  lots,
  ecritures,
  associes,
  mouvements,
  months,
  selectedMonth,
  onSelectMonth,
}: {
  sci: SciInfo;
  biens: Bien[];
  lots: Lot[];
  ecritures: Ecriture[];
  associes: Associe[];
  mouvements: Mouvement[];
  months: string[];
  selectedMonth: string;
  onSelectMonth: (m: string) => void;
}) {
  const firstOfMonth = `${selectedMonth}-01`;

  const soldeDebut = useMemo(() => {
    let total = sci.soldeOuvertureCents;
    for (const e of ecritures) {
      if (e.financement !== "banque_sci") continue; // n'a jamais transité par la banque de la SCI
      if (e.date >= firstOfMonth) continue;
      if (sci.soldeOuvertureDate && e.date < sci.soldeOuvertureDate) continue;
      total += e.type === "encaissement" ? e.montantCents : -e.montantCents;
    }
    return total;
  }, [ecritures, sci, firstOfMonth]);

  const monthEcritures = useMemo(
    () => ecritures.filter((e) => e.date.slice(0, 7) === selectedMonth).sort((a, b) => a.date.localeCompare(b.date)),
    [ecritures, selectedMonth]
  );

  const monthEcrituresBanque = monthEcritures.filter((e) => e.financement === "banque_sci");
  const totalEncaisse = monthEcrituresBanque.filter((e) => e.type === "encaissement").reduce((s, e) => s + e.montantCents, 0);
  const totalDecaisse = monthEcrituresBanque.filter((e) => e.type === "decaissement").reduce((s, e) => s + e.montantCents, 0);
  const soldeFin = soldeDebut + totalEncaisse - totalDecaisse;
  const totalAvances = monthEcritures
    .filter((e) => e.financement === "avance_associe")
    .reduce((s, e) => s + e.montantCents, 0);
  const totalApportsBanque = monthEcrituresBanque
    .filter((e) => e.associeMouvementType === "apport")
    .reduce((s, e) => s + e.montantCents, 0);
  const totalRemboursementsBanque = monthEcrituresBanque
    .filter((e) => e.associeMouvementType === "remboursement")
    .reduce((s, e) => s + e.montantCents, 0);

  const bienById = new Map(biens.map((b) => [b.id, b.label]));
  const lotById = new Map(lots.map((l) => [l.id, l]));
  const associeById = new Map(associes.map((a) => [a.householdId, a.nom]));
  const dateDefault = /^\d{4}-\d{2}$/.test(selectedMonth) ? `${selectedMonth}-01` : selectedMonth;

  function concerneLabel(e: Ecriture): string {
    if (e.lotId) {
      const lot = lotById.get(e.lotId);
      if (lot) return `${bienById.get(lot.bienId) ?? "Bien"} — ${lot.nom}`;
    }
    if (e.bienId) return bienById.get(e.bienId) ?? "—";
    return "—";
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row" style={{ border: "none", padding: 0 }}>
          <label>Mois</label>
          <select value={selectedMonth} onChange={(e) => onSelectMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m} value={m}>{formatMonthLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 6 }}>
        <div className="kpi"><div className="label">Solde au 1er du mois</div><div className="value">{formatEuros(soldeDebut)}</div></div>
        <div className="kpi"><div className="label">Total encaissé</div><div className="value">{formatEuros(totalEncaisse)}</div></div>
        <div className="kpi"><div className="label">Total décaissé</div><div className="value">{formatEuros(totalDecaisse)}</div></div>
        <div className="kpi"><div className="label">Solde bancaire fin de mois</div><div className="value">{formatEuros(soldeFin)}</div></div>
      </div>
      {totalAvances > 0 && (
        <div className="placeholder-note" style={{ marginBottom: 6 }}>
          Dont {formatEuros(totalAvances)} avancés personnellement par des associés ce mois-ci — de vraies dépenses
          de la SCI, mais pas comptées dans le solde bancaire ci-dessus puisqu&apos;elles ne sont pas passées par son compte.
        </div>
      )}
      {(totalApportsBanque > 0 || totalRemboursementsBanque > 0) && (
        <div className="placeholder-note" style={{ marginBottom: 14 }}>
          Dont, dans les totaux ci-dessus (mouvements réels sur le compte de la SCI) :{" "}
          {totalApportsBanque > 0 && <>{formatEuros(totalApportsBanque)} d&apos;apports d&apos;associés</>}
          {totalApportsBanque > 0 && totalRemboursementsBanque > 0 && " et "}
          {totalRemboursementsBanque > 0 && <>{formatEuros(totalRemboursementsBanque)} de remboursements à des associés</>}
          {" "}— des mouvements de financement, pas du chiffre d&apos;affaires ni des charges d&apos;exploitation ;
          à exclure quand on calculera plus tard le vrai résultat de la SCI.
        </div>
      )}

      <SoldeOuvertureForm sci={sci} />

      <div className="card">
        <h2>Écritures — {formatMonthLabel(selectedMonth)}</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Encaissement</th><th className="num">Montant E</th><th>Décaissement</th>
              <th className="num">Montant D</th><th>Mode</th><th>Financement</th><th>Concerne</th><th>Commentaire</th><th>Justif.</th><th></th>
            </tr>
          </thead>
          <tbody>
            {monthEcritures.length === 0 && (
              <tr><td colSpan={11} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune écriture ce mois-ci</td></tr>
            )}
            {monthEcritures.map((e) => (
              <EcritureRow
                key={e.id}
                ecriture={e}
                concerne={concerneLabel(e)}
                associeNom={e.associeHouseholdId ? associeById.get(e.associeHouseholdId) ?? null : null}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AjouterEcritureForm biens={biens} lots={lots} associes={associes} defaultDate={dateDefault} />

      <div className="grid2" style={{ marginTop: 14 }}>
        {associes.map((a) => (
          <FluxCard
            key={a.householdId}
            associe={a}
            mouvements={mouvements.filter((m) => m.householdId === a.householdId)}
            selectedMonth={selectedMonth}
          />
        ))}
      </div>
    </div>
  );
}

function EcritureRow({
  ecriture,
  concerne,
  associeNom,
}: {
  ecriture: Ecriture;
  concerne: string;
  associeNom: string | null;
}) {
  const [, startTransition] = useTransition();
  return (
    <tr>
      <td>{formatDateShort(ecriture.date)}</td>
      <td>{ecriture.type === "encaissement" ? ecriture.libelle : "—"}</td>
      <td className="num">{ecriture.type === "encaissement" ? formatEuros(ecriture.montantCents) : "—"}</td>
      <td>{ecriture.type === "decaissement" ? ecriture.libelle : "—"}</td>
      <td className="num">{ecriture.type === "decaissement" ? formatEuros(ecriture.montantCents) : "—"}</td>
      <td>{ecriture.modePaiement ?? "—"}</td>
      <td>
        {ecriture.financement === "avance_associe" ? (
          <span className="tag" style={{ color: "var(--brick)" }}>Avance {associeNom ?? ""}</span>
        ) : ecriture.associeMouvementType ? (
          <span className="tag" style={{ color: "var(--sage)" }}>
            Banque SCI · {ecriture.associeMouvementType === "apport" ? "apport" : "rembours."} {associeNom ?? ""}
          </span>
        ) : (
          <span className="tag">Banque SCI</span>
        )}
      </td>
      <td>{concerne}</td>
      <td>{ecriture.commentaire ?? "—"}</td>
      <td><JustificatifCell ecriture={ecriture} /></td>
      <td>
        <span
          style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
          onClick={() => startTransition(() => { deleteEcriture(ecriture.id); })}
        >
          Supprimer
        </span>
      </td>
    </tr>
  );
}

function JustificatifCell({ ecriture }: { ecriture: Ecriture }) {
  const [state, formAction, pending] = useActionState(uploadJustificatif, initialState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  if (ecriture.justificatifUrl) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <a href={ecriture.justificatifUrl} target="_blank" rel="noreferrer" style={{ color: "var(--sage)" }}>📎</a>
        <span
          style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
          onClick={() => startTransition(() => { removeJustificatif(ecriture.id, ecriture.justificatifPath!); })}
        >
          ×
        </span>
      </div>
    );
  }

  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="ecriture_id" value={ecriture.id} />
      <label style={{ color: "var(--brick)", cursor: "pointer", fontSize: 12 }}>
        {pending ? "..." : "+"}
        <input type="file" name="file" style={{ display: "none" }} onChange={() => formRef.current?.requestSubmit()} />
      </label>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 10 }}>{state.error}</div>}
    </form>
  );
}

function AjouterEcritureForm({
  biens,
  lots,
  associes,
  defaultDate,
}: {
  biens: Bien[];
  lots: Lot[];
  associes: Associe[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(addEcriture, initialState);
  const [financement, setFinancement] = useState<"banque_sci" | "avance_associe">("banque_sci");
  const [lienCompteCourant, setLienCompteCourant] = useState<"aucun" | "apport" | "remboursement">("aucun");

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>+ Ajouter une écriture</h2>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input type="date" name="date" defaultValue={defaultDate} required style={{ maxWidth: 140 }} />
        <select name="type" defaultValue="decaissement" style={{ maxWidth: 130 }}>
          <option value="decaissement">Décaissement</option>
          <option value="encaissement">Encaissement</option>
        </select>
        <input name="libelle" placeholder="Libellé (ex : Taxe foncière)" required style={{ maxWidth: 200 }} />
        <input name="montant" placeholder="Montant €" style={{ maxWidth: 100 }} />
        <select name="mode_paiement" defaultValue="Virement" style={{ maxWidth: 140 }}>
          <option value="Virement">Virement</option>
          <option value="Prélèvement">Prélèvement</option>
          <option value="Chèque">Chèque</option>
          <option value="Carte bancaire">Carte bancaire</option>
          <option value="Espèces">Espèces</option>
          <option value="Autre">Autre</option>
        </select>
        <select name="concerne" style={{ maxWidth: 190 }} defaultValue="">
          <option value="">Concerne (optionnel)</option>
          {biens.map((b) => (
            <optgroup key={b.id} label={b.label}>
              <option value={`bien:${b.id}`}>{b.label} (immeuble entier)</option>
              {lots.filter((l) => l.bienId === b.id).map((l) => (
                <option key={l.id} value={`lot:${l.id}|${b.id}`}>{b.label} — {l.nom}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <input name="commentaire" placeholder="Commentaire" style={{ maxWidth: 150 }} />

        <select
          name="financement"
          value={financement}
          onChange={(e) => {
            setFinancement(e.target.value as typeof financement);
            setLienCompteCourant("aucun");
          }}
          style={{ maxWidth: 250 }}
        >
          <option value="banque_sci">Payé depuis le compte bancaire de la SCI</option>
          <option value="avance_associe">Avancé personnellement par un associé (ex : CB perso)</option>
        </select>

        {financement === "avance_associe" && (
          <select name="associe_household_id" required style={{ maxWidth: 150 }} defaultValue="">
            <option value="" disabled>Quel foyer a avancé ?</option>
            {associes.map((a) => (
              <option key={a.householdId} value={a.householdId}>{a.nom}</option>
            ))}
          </select>
        )}

        {financement === "banque_sci" && (
          <>
            <select
              value={lienCompteCourant}
              onChange={(e) => setLienCompteCourant(e.target.value as typeof lienCompteCourant)}
              style={{ maxWidth: 210 }}
            >
              <option value="aucun">Sans lien avec un compte courant</option>
              <option value="apport">= un apport d&apos;associé</option>
              <option value="remboursement">= un remboursement à un associé</option>
            </select>
            {lienCompteCourant !== "aucun" && (
              <>
                <input type="hidden" name="associe_mouvement_type" value={lienCompteCourant} />
                <select name="associe_household_id" required style={{ maxWidth: 150 }} defaultValue="">
                  <option value="" disabled>Quel foyer ?</option>
                  {associes.map((a) => (
                    <option key={a.householdId} value={a.householdId}>{a.nom}</option>
                  ))}
                </select>
              </>
            )}
          </>
        )}

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
        Une avance ou un apport/remboursement lié à un foyer alimente automatiquement son suivi dans &quot;Comptes
        courants associés&quot; — pas besoin de le ressaisir là-bas.
      </div>
    </div>
  );
}

function SoldeOuvertureForm({ sci }: { sci: SciInfo }) {
  const [state, formAction, pending] = useActionState(saveSoldeOuverture, initialState);
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <h2>Solde de départ <span className="tag">reprise de ta comptabilité existante</span></h2>
      <div className="card-sub">
        Le solde bancaire de la SCI à une date de référence — tout ce qui est saisi ci-dessous s&apos;ajoute à partir
        de cette date, sans avoir à ressaisir tout l&apos;historique déjà tenu ailleurs
      </div>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input type="date" name="date" defaultValue={sci.soldeOuvertureDate ?? ""} style={{ maxWidth: 150 }} />
        <input
          name="solde"
          placeholder="Solde € à cette date"
          defaultValue={sci.soldeOuvertureCents ? (sci.soldeOuvertureCents / 100).toString() : ""}
          style={{ maxWidth: 160 }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          Enregistrer
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}

function FluxCard({
  associe,
  mouvements,
  selectedMonth,
}: {
  associe: Associe;
  mouvements: Mouvement[];
  selectedMonth: string;
}) {
  const monthMouvements = mouvements.filter((m) => m.date.slice(0, 7) === selectedMonth);
  const apports = monthMouvements.filter((m) => m.type === "apport").reduce((s, m) => s + m.montantCents, 0);
  const avances = monthMouvements.filter((m) => m.type === "avance").reduce((s, m) => s + m.montantCents, 0);
  const remboursements = monthMouvements.filter((m) => m.type === "remboursement").reduce((s, m) => s + m.montantCents, 0);

  return (
    <div className="card">
      <h2>Flux — {associe.nom}</h2>
      <table>
        <tbody>
          <tr><td>Apports du mois</td><td className="num">{formatEuros(apports)}</td></tr>
          <tr><td>Avances de frais</td><td className="num">{formatEuros(avances)}</td></tr>
          <tr><td>Remboursements reçus</td><td className="num">{formatEuros(remboursements)}</td></tr>
        </tbody>
      </table>
    </div>
  );
}

function PanelAnnuel() {
  return (
    <div>
      <div className="placeholder-note" style={{ marginBottom: 14 }}>
        Squelette — ces chiffres viendront des comptes annuels certifiés par ton comptable une fois qu&apos;on aura
        prévu un endroit pour les saisir. Ceux affichés ci-dessous sont un exemple, pas encore tes vraies données.
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row" style={{ border: "none", padding: 0 }}>
          <label>Exercice</label>
          <select defaultValue="2025 (12 mois)">
            <option>2025 (12 mois)</option>
            <option>2024 (6 mois, 1er exercice)</option>
          </select>
        </div>
      </div>

      <div className="pagesub" style={{ marginBottom: 16 }}>
        Données extraites des comptes annuels certifiés par VDL Conseil (exercice 2025, arrêté le 19/05/2026)
      </div>

      <div className="kpis">
        <div className="kpi"><div className="label">Chiffre d&apos;affaires (loyers + charges)</div><div className="value">10 200,16 €</div><div className="sub">2024 : 0 € (pas encore loué)</div></div>
        <div className="kpi accent"><div className="label">Résultat net comptable</div><div className="value">− 17 645,90 €</div><div className="sub">2024 : − 7 423,95 €</div></div>
        <div className="kpi"><div className="label">Total bilan</div><div className="value">282 992,32 €</div><div className="sub">2024 : 244 529,10 €</div></div>
        <div className="kpi"><div className="label">Capitaux propres</div><div className="value">− 24 869,85 €</div><div className="sub">déficit reporté, normal en phase travaux</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Produits d&apos;exploitation 2025 <span className="tag">par appartement</span></h2>
          <table>
            <tbody>
              <tr><td>Loyer RDC <span className="tag" style={{ color: "var(--ink-soft)" }}>(entrée nov. 2025)</span></td><td className="num">587,16 €</td></tr>
              <tr><td>Loyer 1er étage</td><td className="num">4 550,00 €</td></tr>
              <tr><td>Loyer 2e étage</td><td className="num">4 060,00 €</td></tr>
              <tr><td>Charges locatives (3 lots)</td><td className="num">1 003,00 €</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Chiffre d&apos;affaires total</b></td><td className="num"><b>10 200,16 €</b></td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Charges d&apos;exploitation 2025 <span className="tag">principales lignes</span></h2>
          <table>
            <tbody>
              <tr><td>EDF</td><td className="num">3 491,30 €</td></tr>
              <tr><td>Entretien et réparations</td><td className="num">5 649,66 €</td></tr>
              <tr><td>Taxe foncière</td><td className="num">2 153,00 €</td></tr>
              <tr><td>Assurances (PNO + emprunt)</td><td className="num">698,96 €</td></tr>
              <tr><td>Honoraires comptables</td><td className="num">1 080,00 €</td></tr>
              <tr><td>Dotations aux amortissements</td><td className="num">8 045,97 €</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total charges d&apos;exploitation</b></td><td className="num"><b>17 931,17 €</b></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Évolution du bilan <span className="tag">2024 → 2025</span></h2>
        <svg viewBox="0 0 612 170" width="100%" height="165">
          <g fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">
            <text x="20" y="15">Total bilan (actif)</text>
            <rect x="20" y="20" width="211" height="14" fill="#DEDACE" /><text x="235" y="31">244 529 € (2024)</text>
            <rect x="20" y="38" width="244" height="14" fill="#A8523A" /><text x="268" y="49">282 992 € (2025)</text>

            <text x="20" y="75">Dette bancaire (CRD)</text>
            <rect x="20" y="80" width="198" height="14" fill="#DEDACE" /><text x="222" y="91">229 770 € (2024)</text>
            <rect x="20" y="98" width="229" height="14" fill="#A8523A" /><text x="253" y="109">266 050 € (2025)</text>

            <text x="20" y="135">Comptes courants associés (cumul)</text>
            <rect x="20" y="140" width="180" height="14" fill="#DEDACE" /><text x="204" y="151">20 903 € (2024)</text>
            <rect x="20" y="158" width="345" height="14" fill="#A8523A" /><text x="369" y="169">39 932 € (2025)</text>
          </g>
        </svg>
        <div className="chart-caption">Barres proportionnelles aux montants — la dette bancaire et les comptes courants associés progressent avec la fin des travaux</div>
      </div>

      <div className="card">
        <h2>Situation des comptes courants d&apos;associés au 31/12/2025 <span className="tag">source : bilan passif certifié</span></h2>
        <table>
          <thead><tr><th>Foyer</th><th className="num">Solde au 31/12/2024</th><th className="num">Solde au 31/12/2025</th><th className="num">Variation 2025</th></tr></thead>
          <tbody>
            <tr><td>GEMINET</td><td className="num">10 688,61 €</td><td className="num"><b>19 825,07 €</b></td><td className="num">+ 9 136,46 €</td></tr>
            <tr><td>PAPIN</td><td className="num">10 214,21 €</td><td className="num"><b>20 107,09 €</b></td><td className="num">+ 9 892,88 €</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total</b></td><td className="num"><b>20 902,82 €</b></td><td className="num"><b>39 932,16 €</b></td><td className="num"><b>+ 19 029,34 €</b></td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">C&apos;est ce que la SCI doit réellement à chaque foyer — la somme cumulée depuis la création, pas seulement les mouvements de l&apos;année.</div>
      </div>
    </div>
  );
}

function PanelGlobal() {
  return (
    <div>
      <div className="placeholder-note" style={{ marginBottom: 14 }}>
        Squelette — comme pour le bilan annuel, ces chiffres viendront de tes comptes certifiés. Exemple affiché en
        attendant, pas encore tes vraies données.
      </div>
      <div className="pagesub" style={{ marginBottom: 16 }}>
        SCI créée le 28/06/2024 — comptes annuels certifiés par VDL Conseil pour 2024 (6 mois) et 2025 (12 mois)
      </div>
      <div className="kpis">
        <div className="kpi accent"><div className="label">Total bilan au 31/12/2025</div><div className="value">282 992,32 €</div></div>
        <div className="kpi"><div className="label">Résultat cumulé depuis achat</div><div className="value">− 25 069,85 €</div><div className="sub">2024 + 2025</div></div>
        <div className="kpi"><div className="label">Dette bancaire actuelle</div><div className="value">266 050,01 €</div></div>
        <div className="kpi"><div className="label">Dette SCI → associés (cumul)</div><div className="value">39 932,16 €</div></div>
      </div>

      <div className="card">
        <h2>Compte de résultat par exercice</h2>
        <table>
          <thead><tr><th>Exercice</th><th className="num">Chiffre d&apos;affaires</th><th className="num">Charges totales</th><th className="num">Résultat net</th></tr></thead>
          <tbody>
            <tr><td>2024 <span className="tag">(6 mois, 1er exercice)</span></td><td className="num">0,94 €</td><td className="num">7 425,96 €</td><td className="num">− 7 423,95 €</td></tr>
            <tr><td>2025 <span className="tag">(12 mois)</span></td><td className="num">10 200,16 €</td><td className="num">27 846,06 €</td><td className="num">− 17 645,90 €</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Cumul depuis achat</b></td><td className="num"><b>10 201,10 €</b></td><td className="num"><b>35 272,02 €</b></td><td className="num"><b>− 25 069,85 €</b></td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Déficit cumulé normal en phase de travaux : 8 045,97 € de dotations aux amortissements en 2025 (charge comptable, pas une sortie de trésorerie) et 9 914,89 € d&apos;intérêts d&apos;emprunt pèsent lourd tant que l&apos;immeuble n&apos;est pas loué en totalité.</div>
      </div>

      <div className="card">
        <h2>Évolution du résultat net</h2>
        <svg viewBox="0 0 400 160" width="100%" height="155">
          <line x1="20" y1="30" x2="380" y2="30" stroke="#DEDACE" strokeWidth="1" strokeDasharray="3,3" />
          <text x="384" y="34" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">0 €</text>
          <rect x="100" y="30" width="70" height="52" fill="#A8523A" opacity="0.85" />
          <text x="90" y="98" fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">− 7 424 €</text>
          <text x="118" y="112" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">2024</text>
          <rect x="230" y="30" width="70" height="122" fill="#A8523A" />
          <text x="215" y="168" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">2025</text>
          <text x="212" y="26" fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">− 17 646 €</text>
        </svg>
        <div className="chart-caption">Le déficit se creuse en 2025 avec la montée en puissance des amortissements et des intérêts d&apos;emprunt — attendu tant que les 3 lots ne sont pas loués toute l&apos;année</div>
      </div>

      <div className="card">
        <h2>Répartition du capital social</h2>
        <table>
          <tbody>
            <tr><td>Pierre PAPIN</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr><td>Marie PAPIN</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr><td>Emmanuel GEMINET</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr><td>Thérèse GEMINET</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Capital social</b></td><td className="num"><b>200,00 € — 100 parts</b></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
