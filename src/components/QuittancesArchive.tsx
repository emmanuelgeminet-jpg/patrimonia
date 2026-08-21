"use client";

import { useMemo, useState } from "react";
import { formatEuros, formatMonthLabel } from "@/lib/budget";

export type QuittanceArchiveItem = {
  id: string;
  bienAdresse: string;
  lotNom: string;
  locataireNom: string;
  mois: string;
  loyerHcCents: number;
  chargesCents: number;
  dateGeneration: string;
  /** Date réelle d'encaissement (Journal comptable) — absente pour un bien en nom propre. */
  datePaiement: string | null;
  url: string | null;
};

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

/**
 * Archive complète des quittances générées — indépendante du dossier "Quittances" de l'écran
 * Documents (qui reste, pour l'upload manuel). Ici, chaque ligne vient de la table `quittances`,
 * remplie automatiquement à chaque génération : logement, locataire, période et montant sont
 * de vraies colonnes, pas des infos à retrouver dans un nom de fichier — pour qu'Emmanuel
 * puisse vraiment retrouver une quittance précise en cas de besoin (litige, contrôle...).
 *
 * Filtres plutôt qu'un espace de stockage séparé par logement : un immeuble avec plusieurs
 * lots partage déjà cette archive, et filtrer permet de croiser logement/locataire/période
 * dans n'importe quel sens (ex. "toutes les quittances de Jean sur 2026", pas seulement
 * "toutes celles du 1er étage") — plus flexible qu'un simple découpage par dossier.
 */
export default function QuittancesArchive({ items }: { items: QuittanceArchiveItem[] }) {
  const [logement, setLogement] = useState("");
  const [locataire, setLocataire] = useState("");
  const [periode, setPeriode] = useState("");

  const logements = useMemo(
    () => [...new Set(items.map((q) => `${q.bienAdresse} — ${q.lotNom}`))].sort(),
    [items]
  );
  const locataires = useMemo(() => [...new Set(items.map((q) => q.locataireNom))].sort(), [items]);
  const periodes = useMemo(() => [...new Set(items.map((q) => q.mois))].sort().reverse(), [items]);

  const filtered = items.filter(
    (q) =>
      (!logement || `${q.bienAdresse} — ${q.lotNom}` === logement) &&
      (!locataire || q.locataireNom === locataire) &&
      (!periode || q.mois === periode)
  );
  const sorted = [...filtered].sort((a, b) => (a.mois < b.mois ? 1 : a.mois > b.mois ? -1 : 0));

  return (
    <div className="card">
      <h2>Archive des quittances <span className="tag">{sorted.length} quittance{sorted.length !== 1 ? "s" : ""}</span></h2>
      <div className="card-sub">
        Toutes les quittances générées depuis l&apos;appli, à conserver en cas de besoin (litige, contrôle...) —
        classées par période, les plus récentes en premier.
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <select value={logement} onChange={(e) => setLogement(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">Tous les logements</option>
            {logements.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={locataire} onChange={(e) => setLocataire(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Tous les locataires</option>
            {locataires.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={periode} onChange={(e) => setPeriode(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">Toutes les périodes</option>
            {periodes.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
          </select>
          {(logement || locataire || periode) && (
            <span
              className="pill"
              style={{ cursor: "pointer", background: "var(--paper)", color: "var(--ink-soft)" }}
              onClick={() => { setLogement(""); setLocataire(""); setPeriode(""); }}
            >
              Réinitialiser
            </span>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucune quittance générée pour l&apos;instant</div>
      ) : sorted.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucune quittance ne correspond à ces filtres</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Logement</th>
              <th>Locataire</th>
              <th className="num">Montant</th>
              <th>Réglé le</th>
              <th>Émise le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((q) => (
              <tr key={q.id}>
                <td>{formatMonthLabel(q.mois)}</td>
                <td>{q.bienAdresse} — {q.lotNom}</td>
                <td>{q.locataireNom}</td>
                <td className="num">{formatEuros(q.loyerHcCents + q.chargesCents)}</td>
                <td>{q.datePaiement ? formatDateFr(q.datePaiement) : "—"}</td>
                <td>{formatDateFr(q.dateGeneration)}</td>
                <td>
                  {q.url ? (
                    <a href={q.url} target="_blank" rel="noreferrer" style={{ color: "var(--sage)" }}>Télécharger</a>
                  ) : (
                    <span style={{ color: "var(--ink-soft)" }}>Lien expiré</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
