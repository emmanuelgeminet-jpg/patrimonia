"use client";

import { useMemo, useRef, useState, useActionState, useTransition } from "react";
import {
  addEcriture,
  deleteEcriture,
  uploadJustificatif,
  removeJustificatif,
  saveSoldeOuverture,
  rapprocherReleve,
  type SaveState,
  type RapprochementState,
} from "./actions";
import { formatEuros, formatMonthLabel } from "@/lib/budget";
import { CompteDeResultatPanel, BilanPanel as BilanReelPanel } from "./BilanPanel";

type TabKey = "mensuel" | "resultat" | "bilan" | "rapprochement";

const TABS: { key: TabKey; label: string }[] = [
  { key: "mensuel", label: "Détail mensuel" },
  { key: "resultat", label: "Compte de résultat" },
  { key: "bilan", label: "Bilan" },
  { key: "rapprochement", label: "Rapprochement bancaire" },
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
  empruntId: string | null;
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
export type SciInfo = {
  id: string;
  nom: string;
  siren: string | null;
  adresse: string | null;
  gerantNom: string | null;
  dateCreation: string | null;
  regimeFiscal: string | null;
  soldeOuvertureCents: number;
  soldeOuvertureDate: string | null;
  capitalSocialCents: number;
  resultatReporteCents: number;
};
export type Emprunt = {
  id: string;
  bienId: string | null;
  libelle: string;
  capitalEmprunteCents: number;
  tauxPct: number;
  dureeMois: number;
  dateDebut: string;
  assuranceEmprunteurCents: number | null;
};
export type Immobilisation = {
  id: string;
  bienId: string | null;
  libelle: string;
  valeurAmortissableCents: number;
  dureeAnnees: number;
  dateMiseEnService: string;
};

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
  emprunts,
  immobilisations,
}: {
  sci: SciInfo;
  biens: Bien[];
  lots: Lot[];
  ecritures: Ecriture[];
  associes: Associe[];
  mouvements: Mouvement[];
  emprunts: Emprunt[];
  immobilisations: Immobilisation[];
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
          emprunts={emprunts}
          months={months}
          selectedMonth={selectedMonth}
          onSelectMonth={setSelectedMonth}
        />
      )}
      {active === "resultat" && (
        <CompteDeResultatPanel sci={sci} ecritures={ecritures} emprunts={emprunts} immobilisations={immobilisations} />
      )}
      {active === "bilan" && (
        <BilanReelPanel
          sci={sci}
          ecritures={ecritures}
          associes={associes}
          mouvements={mouvements}
          emprunts={emprunts}
          immobilisations={immobilisations}
        />
      )}
      {active === "rapprochement" && <PanelRapprochement />}
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
  emprunts,
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
  emprunts: Emprunt[];
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
  const empruntById = new Map(emprunts.map((e) => [e.id, e.libelle]));
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
                empruntNom={e.empruntId ? empruntById.get(e.empruntId) ?? null : null}
              />
            ))}
          </tbody>
        </table>
      </div>

      <AjouterEcritureForm biens={biens} lots={lots} associes={associes} emprunts={emprunts} defaultDate={dateDefault} />

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
  empruntNom,
}: {
  ecriture: Ecriture;
  concerne: string;
  associeNom: string | null;
  empruntNom: string | null;
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
        ) : empruntNom ? (
          <span className="tag" style={{ color: "var(--sage)" }}>Banque SCI · prêt {empruntNom}</span>
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
          onClick={() => {
            if (!window.confirm("Supprimer ce justificatif ? Cette action est irréversible.")) return;
            startTransition(() => { removeJustificatif(ecriture.id, ecriture.justificatifPath!); });
          }}
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
        <input
          type="file"
          name="file"
          accept="image/*,.pdf,application/pdf"
          capture="environment"
          style={{ display: "none" }}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 10 }}>{state.error}</div>}
    </form>
  );
}

function AjouterEcritureForm({
  biens,
  lots,
  associes,
  emprunts,
  defaultDate,
}: {
  biens: Bien[];
  lots: Lot[];
  associes: Associe[];
  emprunts: Emprunt[];
  defaultDate: string;
}) {
  const [state, formAction, pending] = useActionState(addEcriture, initialState);
  const [type, setType] = useState<"encaissement" | "decaissement">("decaissement");
  const [financement, setFinancement] = useState<"banque_sci" | "avance_associe">("banque_sci");
  const [lienCompteCourant, setLienCompteCourant] = useState<"aucun" | "apport" | "remboursement">("aucun");

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>+ Ajouter une écriture</h2>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input type="date" name="date" defaultValue={defaultDate} required style={{ maxWidth: 140 }} />
        <select name="type" value={type} onChange={(e) => setType(e.target.value as typeof type)} style={{ maxWidth: 130 }}>
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
        {type === "decaissement" && (
          <select name="categorie_charge" style={{ maxWidth: 180 }} defaultValue="">
            <option value="">Catégorie (optionnel)</option>
            <option value="Prêt">Prêt</option>
            <option value="Taxe foncière">Taxe foncière</option>
            <option value="Charges copropriété">Charges copropriété</option>
            <option value="Assurance">Assurance</option>
            <option value="Entretien & réparations">Entretien &amp; réparations</option>
            <option value="Eau / Électricité / Gaz">Eau / Électricité / Gaz</option>
            <option value="Honoraires comptables">Honoraires comptables</option>
            <option value="Travaux">Travaux</option>
            <option value="Autre">Autre</option>
          </select>
        )}
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
            {lienCompteCourant === "aucun" && type === "decaissement" && emprunts.length > 0 && (
              <select name="emprunt_id" style={{ maxWidth: 220 }} defaultValue="">
                <option value="">Sans lien avec un prêt</option>
                {emprunts.map((e) => (
                  <option key={e.id} value={e.id}>= mensualité du prêt {e.libelle}</option>
                ))}
              </select>
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
      {emprunts.length > 0 && (
        <div className="card-sub" style={{ marginTop: 4 }}>
          Si ta banque prélève mensualité + assurance emprunteur en une fois, sépare en deux écritures : la
          mensualité rattachée au prêt ci-dessus, et l&apos;assurance à part (sans lien) — sinon elle disparaît du
          compte de résultat.
        </div>
      )}
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

const initialRapprochementState: RapprochementState = {};

function PanelRapprochement() {
  const [state, formAction, pending] = useActionState(rapprocherReleve, initialRapprochementState);

  return (
    <div>
      <div className="card">
        <h2>Rapprochement bancaire</h2>
        <div className="card-sub">
          Dépose le relevé bancaire réel de la SCI (CSV ou PDF, comme pour l&apos;import de Mon budget) — on le
          compare aux écritures &quot;Banque SCI&quot; déjà saisies pour repérer ce qui a été oublié ou mal noté.
          Rien n&apos;est enregistré : c&apos;est juste une vérification, à refaire à chaque nouveau relevé.
        </div>
        <form action={formAction} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginTop: 8 }}>
          <input type="file" name="file" accept=".csv,.pdf" required />
          <button
            type="submit"
            disabled={pending}
            style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "Analyse en cours..." : "Lancer le rapprochement"}
          </button>
        </form>
        {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 6 }}>{state.error}</div>}
      </div>

      {state.resultat && (
        <>
          <div className="kpis" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
            <div className="kpi"><div className="label">Lignes rapprochées</div><div className="value">{state.resultat.matches}</div></div>
            <div className="kpi"><div className="label">Lignes du relevé sans écriture</div><div className="value">{state.resultat.lignesBancairesSansEcriture.length}</div></div>
            <div className="kpi"><div className="label">Écritures sans ligne bancaire</div><div className="value">{state.resultat.ecrituresSansLigneBancaire.length}</div></div>
          </div>

          {state.resultat.lignesBancairesSansEcriture.length === 0 && state.resultat.ecrituresSansLigneBancaire.length === 0 ? (
            <div className="card">
              <div className="empty"><div className="big">Tout concorde</div>Chaque ligne du relevé a une écriture correspondante, et inversement.</div>
            </div>
          ) : (
            <div className="grid2">
              <div className="card">
                <h2>Sur le relevé, absentes du journal</h2>
                <div className="card-sub">Probablement oubliées — pense à les ajouter dans &quot;Détail mensuel&quot;</div>
                <table>
                  <thead><tr><th>Date</th><th>Libellé</th><th className="num">Montant</th></tr></thead>
                  <tbody>
                    {state.resultat.lignesBancairesSansEcriture.length === 0 && (
                      <tr><td colSpan={3} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune</td></tr>
                    )}
                    {state.resultat.lignesBancairesSansEcriture.map((l, i) => (
                      <tr key={i}>
                        <td>{formatDateShort(l.date)}</td>
                        <td>{l.libelle}</td>
                        <td className="num">{formatEuros(l.montantCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card">
                <h2>Dans le journal, absentes du relevé</h2>
                <div className="card-sub">Montant, date ou financement (&quot;Banque SCI&quot;) probablement à corriger</div>
                <table>
                  <thead><tr><th>Date</th><th>Libellé</th><th className="num">Montant</th></tr></thead>
                  <tbody>
                    {state.resultat.ecrituresSansLigneBancaire.length === 0 && (
                      <tr><td colSpan={3} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune</td></tr>
                    )}
                    {state.resultat.ecrituresSansLigneBancaire.map((e) => (
                      <tr key={e.id}>
                        <td>{formatDateShort(e.date)}</td>
                        <td>{e.libelle}</td>
                        <td className="num">{e.type === "encaissement" ? formatEuros(e.montantCents) : `− ${formatEuros(e.montantCents)}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

