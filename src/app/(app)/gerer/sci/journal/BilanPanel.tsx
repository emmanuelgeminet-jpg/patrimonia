"use client";

import { useActionState, useTransition } from "react";
import { formatEuros } from "@/lib/budget";
import { computeCompteDeResultat, computeBilan } from "@/lib/bilan-sci";
import {
  addEmprunt,
  deleteEmprunt,
  addImmobilisation,
  deleteImmobilisation,
  saveInfosSci,
  saveResultatReporte,
  type SaveState,
} from "./bilan-actions";
import type { SciInfo, Ecriture, Associe, Mouvement, Emprunt, Immobilisation } from "./JournalTabs";
// (import type: purement des types, pas de dépendance d'exécution — JournalTabs importe
// aussi ce fichier, donc un import normal créerait une dépendance circulaire au runtime)

const initialState: SaveState = {};

function aujourdHui(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Début de l'exercice en cours : le lendemain de la date de reprise, ou "depuis toujours"
 *  si aucune date de reprise n'est renseignée — même convention que le reste du journal. */
function exerciceDebut(soldeOuvertureDate: string | null): string {
  if (!soldeOuvertureDate) return "0001-01-01";
  const d = new Date(`${soldeOuvertureDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

function versEcritureCompteResultat(e: Ecriture) {
  return {
    date: e.date,
    type: e.type,
    montantCents: e.montantCents,
    financement: e.financement,
    associeMouvementType: e.associeMouvementType,
    empruntId: e.empruntId,
  };
}

function versEmpruntSci(e: Emprunt) {
  return { capitalEmprunteCents: e.capitalEmprunteCents, tauxPct: e.tauxPct, dureeMois: e.dureeMois, dateDebut: e.dateDebut };
}

function versImmobilisationSci(i: Immobilisation) {
  return { valeurAmortissableCents: i.valeurAmortissableCents, dureeAnnees: i.dureeAnnees, dateMiseEnService: i.dateMiseEnService };
}

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export function CompteDeResultatPanel({
  sci,
  ecritures,
  emprunts,
  immobilisations,
}: {
  sci: SciInfo;
  ecritures: Ecriture[];
  emprunts: Emprunt[];
  immobilisations: Immobilisation[];
}) {
  const debut = exerciceDebut(sci.soldeOuvertureDate);
  const fin = aujourdHui();

  const resultat = computeCompteDeResultat({
    ecritures: ecritures.map(versEcritureCompteResultat),
    emprunts: emprunts.map(versEmpruntSci),
    immobilisations: immobilisations.map(versImmobilisationSci),
    exerciceDebut: debut,
    exerciceFin: fin,
  });

  return (
    <div>
      <div className="pagesub" style={{ marginBottom: 16 }}>
        Exercice en cours — du {sci.soldeOuvertureDate ? formatDateFr(debut) : "début du journal"} au {formatDateFr(fin)}
      </div>

      <div className="kpis">
        <div className="kpi"><div className="label">Produits</div><div className="value">{formatEuros(resultat.produitsCents)}</div></div>
        <div className="kpi"><div className="label">Charges décaissées</div><div className="value">{formatEuros(resultat.chargesCashCents)}</div></div>
        <div className="kpi"><div className="label">Intérêts d&apos;emprunt</div><div className="value">{formatEuros(resultat.chargesInteretsCents)}</div></div>
        <div className="kpi"><div className="label">Dotations aux amortissements</div><div className="value">{formatEuros(resultat.chargesAmortissementsCents)}</div></div>
      </div>

      <div className="kpis">
        <div className="kpi accent"><div className="label">Résultat avant IS</div><div className="value">{formatEuros(resultat.resultatCents)}</div><div className="sub">produits − toutes les charges ci-dessus</div></div>
      </div>

      <div className="placeholder-note">
        &quot;Avant IS&quot; : l&apos;impôt sur les sociétés n&apos;est pas calculé ici — à voir avec ton comptable une
        fois le résultat connu. Les intérêts d&apos;emprunt et les dotations aux amortissements sont des charges
        comptables calculées depuis les prêts et immobilisations renseignés dans l&apos;onglet &quot;Bilan&quot; — pas
        depuis les écritures du journal (une mensualité rattachée à un prêt là-bas est donc exclue des &quot;charges
        décaissées&quot; ci-dessus, pour ne pas la compter deux fois).
      </div>

      {(emprunts.length === 0 || immobilisations.length === 0) && (
        <div className="placeholder-note" style={{ background: "var(--amber-soft)", color: "var(--amber)" }}>
          {emprunts.length === 0 && "Aucun prêt renseigné — les intérêts d'emprunt ne sont pas comptés. "}
          {immobilisations.length === 0 && "Aucune immobilisation renseignée — les amortissements ne sont pas comptés. "}
          Complète ça dans l&apos;onglet &quot;Bilan&quot;.
        </div>
      )}
    </div>
  );
}

export function BilanPanel({
  sci,
  ecritures,
  associes,
  mouvements,
  emprunts,
  immobilisations,
}: {
  sci: SciInfo;
  ecritures: Ecriture[];
  associes: Associe[];
  mouvements: Mouvement[];
  emprunts: Emprunt[];
  immobilisations: Immobilisation[];
}) {
  const today = aujourdHui();
  const debut = exerciceDebut(sci.soldeOuvertureDate);

  const tresorerieCents = ecritures
    .filter((e) => e.financement === "banque_sci")
    .filter((e) => !sci.soldeOuvertureDate || e.date >= sci.soldeOuvertureDate)
    .reduce((s, e) => s + (e.type === "encaissement" ? e.montantCents : -e.montantCents), sci.soldeOuvertureCents);

  const comptesCourantsCents = associes.reduce(
    (s, a) =>
      s +
      mouvements
        .filter((m) => m.householdId === a.householdId)
        .reduce((s2, m) => s2 + (m.type === "remboursement" ? -m.montantCents : m.montantCents), a.soldeOuvertureCents),
    0
  );

  const empruntsSci = emprunts.map(versEmpruntSci);
  const immobilisationsSci = immobilisations.map(versImmobilisationSci);

  const { resultatCents: resultatExerciceCents } = computeCompteDeResultat({
    ecritures: ecritures.map(versEcritureCompteResultat),
    emprunts: empruntsSci,
    immobilisations: immobilisationsSci,
    exerciceDebut: debut,
    exerciceFin: today,
  });

  const bilan = computeBilan({
    tresorerieCents,
    immobilisations: immobilisationsSci,
    emprunts: empruntsSci,
    dateBilan: today,
    capitalSocialCents: sci.capitalSocialCents,
    resultatReporteCents: sci.resultatReporteCents,
    resultatExerciceCents,
    comptesCourantsCents,
  });

  const ecartOk = Math.abs(bilan.ecartCents) < 100; // tolérance d'arrondi : moins d'1 €

  return (
    <div>
      <div className="pagesub" style={{ marginBottom: 16 }}>Situation à aujourd&apos;hui — {formatDateFr(today)}</div>

      <div className="grid2">
        <div className="card">
          <h2>Actif</h2>
          <table>
            <tbody>
              <tr><td>Trésorerie</td><td className="num">{formatEuros(bilan.tresorerieCents)}</td></tr>
              <tr><td>Immobilisations nettes</td><td className="num">{formatEuros(bilan.immobilisationsNettesCents)}</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total actif</b></td><td className="num"><b>{formatEuros(bilan.actifCents)}</b></td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Passif</h2>
          <table>
            <tbody>
              <tr><td>Capital social</td><td className="num">{formatEuros(bilan.capitalSocialCents)}</td></tr>
              <tr><td>Résultat reporté</td><td className="num">{formatEuros(bilan.resultatReporteCents)}</td></tr>
              <tr><td>Résultat de l&apos;exercice</td><td className="num">{formatEuros(bilan.resultatExerciceCents)}</td></tr>
              <tr><td>Comptes courants associés</td><td className="num">{formatEuros(bilan.comptesCourantsCents)}</td></tr>
              <tr><td>Dette bancaire (CRD)</td><td className="num">{formatEuros(bilan.detteBancaireCents)}</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total passif</b></td><td className="num"><b>{formatEuros(bilan.passifCents)}</b></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card" style={{ background: ecartOk ? "var(--sage-soft)" : "var(--brick-soft)" }}>
        <h2 style={{ color: ecartOk ? "var(--sage)" : "var(--brick)" }}>
          Écart de cohérence (Actif − Passif) : {formatEuros(bilan.ecartCents)}
        </h2>
        <div className="card-sub">
          {ecartOk
            ? "Actif = Passif, aux arrondis près — la comptabilité se tient."
            : "Devrait être à 0,00 € — vérifie qu'aucune mensualité de prêt n'est restée sans lien vers son emprunt, et que le résultat reporté correspond bien à la même date que le solde de départ."}
        </div>
      </div>

      <InfosSciForm sci={sci} />
      <ResultatReporteForm sci={sci} />
      <EmpruntsSection emprunts={emprunts} />
      <ImmobilisationsSection immobilisations={immobilisations} />
    </div>
  );
}

function InfosSciForm({ sci }: { sci: SciInfo }) {
  const [state, formAction, pending] = useActionState(saveInfosSci, initialState);
  return (
    <div className="card">
      <h2>Informations de la SCI</h2>
      <div className="card-sub">
        Modifiable par n&apos;importe quel associé — utilisé sur les quittances (bailleur, gérant qui signe) et
        dans le bilan (capital social).
      </div>
      <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input name="nom" defaultValue={sci.nom} required placeholder="Nom de la SCI" style={{ minWidth: 220 }} />
          <input name="siren" defaultValue={sci.siren ?? ""} placeholder="SIREN" style={{ maxWidth: 160 }} />
        </div>
        <input name="adresse" defaultValue={sci.adresse ?? ""} placeholder="Adresse du siège social" style={{ width: "100%" }} />
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <input name="gerant_nom" defaultValue={sci.gerantNom ?? ""} placeholder="Nom du gérant (celui qui signe les quittances)" style={{ minWidth: 260 }} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <input name="capital_social" defaultValue={sci.capitalSocialCents ? (sci.capitalSocialCents / 100).toString() : ""} placeholder="Capital social €" style={{ maxWidth: 160 }} />
          <input type="date" name="date_creation" defaultValue={sci.dateCreation ?? ""} style={{ maxWidth: 170 }} />
          <select name="regime_fiscal" defaultValue={sci.regimeFiscal ?? "IS"} style={{ maxWidth: 120 }}>
            <option value="IS">IS</option>
            <option value="IR">IR</option>
          </select>
        </div>
        <div>
          <button
            type="submit"
            disabled={pending}
            style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "..." : "Enregistrer"}
          </button>
        </div>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}

function ResultatReporteForm({ sci }: { sci: SciInfo }) {
  const [state, formAction, pending] = useActionState(saveResultatReporte, initialState);
  return (
    <div className="card">
      <h2>Résultat reporté <span className="tag">reprise de ta comptabilité existante</span></h2>
      <div className="card-sub">
        Le résultat cumulé certifié par ton comptable à la date de reprise (voir &quot;Solde de départ&quot; dans
        Détail mensuel) — le compte de résultat calculé par l&apos;appli part de là, sans reconstruire le détail des
        exercices précédents.
      </div>
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
        <input
          name="resultat_reporte"
          placeholder="Résultat reporté €"
          defaultValue={sci.resultatReporteCents ? (sci.resultatReporteCents / 100).toString() : ""}
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

function EmpruntsSection({ emprunts }: { emprunts: Emprunt[] }) {
  const [, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(addEmprunt, initialState);

  return (
    <div className="card">
      <h2>Prêts en cours</h2>
      <div className="card-sub">
        Conditions d&apos;origine du prêt — le capital restant dû et la part d&apos;intérêts se recalculent tout
        seuls depuis ces valeurs, pas besoin de les mettre à jour toi-même.
      </div>
      {emprunts.length > 0 && (
        <table>
          <thead><tr><th>Prêt</th><th className="num">Capital emprunté</th><th className="num">Taux</th><th className="num">Durée</th><th>Départ</th><th></th></tr></thead>
          <tbody>
            {emprunts.map((e) => (
              <tr key={e.id}>
                <td>{e.libelle}</td>
                <td className="num">{formatEuros(e.capitalEmprunteCents)}</td>
                <td className="num">{e.tauxPct} %</td>
                <td className="num">{e.dureeMois} mois</td>
                <td>{formatDateFr(e.dateDebut)}</td>
                <td>
                  <span
                    style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                    onClick={() => startTransition(() => { deleteEmprunt(e.id); })}
                  >
                    Supprimer
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
        <input name="libelle" placeholder="Nom du prêt (ex : Prêt travaux)" required style={{ maxWidth: 180 }} />
        <input name="capital_emprunte" placeholder="Capital emprunté €" style={{ maxWidth: 150 }} />
        <input name="taux" placeholder="Taux %" style={{ maxWidth: 90 }} />
        <input name="duree_mois" placeholder="Durée (mois)" style={{ maxWidth: 130 }} />
        <input type="date" name="date_debut" style={{ maxWidth: 150 }} />
        <input name="assurance_emprunteur" placeholder="Assurance emprunteur €/mois (info)" style={{ maxWidth: 220 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Ajouter un prêt
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}

function ImmobilisationsSection({ immobilisations }: { immobilisations: Immobilisation[] }) {
  const [, startTransition] = useTransition();
  const [state, formAction, pending] = useActionState(addImmobilisation, initialState);

  return (
    <div className="card">
      <h2>Immobilisations amortissables</h2>
      <div className="card-sub">
        Une ligne par bien (ou par composant — toiture, gros œuvre... si tu veux amortir séparément). La valeur
        amortissable, c&apos;est celle que ton comptable retient — pas forcément le prix d&apos;achat complet (le
        terrain ne s&apos;amortit pas).
      </div>
      {immobilisations.length > 0 && (
        <table>
          <thead><tr><th>Immobilisation</th><th className="num">Valeur amortissable</th><th className="num">Durée</th><th>Mise en service</th><th></th></tr></thead>
          <tbody>
            {immobilisations.map((i) => (
              <tr key={i.id}>
                <td>{i.libelle}</td>
                <td className="num">{formatEuros(i.valeurAmortissableCents)}</td>
                <td className="num">{i.dureeAnnees} ans</td>
                <td>{formatDateFr(i.dateMiseEnService)}</td>
                <td>
                  <span
                    style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                    onClick={() => startTransition(() => { deleteImmobilisation(i.id); })}
                  >
                    Supprimer
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
        <input name="libelle" placeholder="Nom (ex : Immeuble Cordeliers)" required style={{ maxWidth: 200 }} />
        <input name="valeur_amortissable" placeholder="Valeur amortissable €" style={{ maxWidth: 170 }} />
        <input name="duree_annees" placeholder="Durée (années)" style={{ maxWidth: 130 }} />
        <input type="date" name="date_mise_en_service" style={{ maxWidth: 170 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Ajouter une immobilisation
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}
