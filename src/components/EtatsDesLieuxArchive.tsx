"use client";

import { useMemo, useState } from "react";

export type EtatDesLieuxArchiveItem = {
  id: string;
  bienAdresse: string;
  lotNom: string;
  locataireNom: string;
  type: "entree" | "sortie";
  dateEtatDesLieux: string;
  dateGeneration: string;
  url: string | null;
};

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

/** Archive des états des lieux générés — même principe que QuittancesArchive/BauxArchive. */
export default function EtatsDesLieuxArchive({ items }: { items: EtatDesLieuxArchiveItem[] }) {
  const [logement, setLogement] = useState("");
  const [locataire, setLocataire] = useState("");

  const logements = useMemo(() => [...new Set(items.map((e) => `${e.bienAdresse} — ${e.lotNom}`))].sort(), [items]);
  const locataires = useMemo(() => [...new Set(items.map((e) => e.locataireNom))].sort(), [items]);

  const filtered = items.filter(
    (e) => (!logement || `${e.bienAdresse} — ${e.lotNom}` === logement) && (!locataire || e.locataireNom === locataire)
  );
  const sorted = [...filtered].sort((a, b) => (a.dateEtatDesLieux < b.dateEtatDesLieux ? 1 : a.dateEtatDesLieux > b.dateEtatDesLieux ? -1 : 0));

  return (
    <div className="card">
      <h2>Archive des états des lieux <span className="tag">{sorted.length} document{sorted.length !== 1 ? "s" : ""}</span></h2>
      <div className="card-sub">Tous les états des lieux générés depuis l&apos;appli, classés par date, les plus récents en premier.</div>

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
          {(logement || locataire) && (
            <span
              className="pill"
              style={{ cursor: "pointer", background: "var(--paper)", color: "var(--ink-soft)" }}
              onClick={() => { setLogement(""); setLocataire(""); }}
            >
              Réinitialiser
            </span>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucun état des lieux généré pour l&apos;instant</div>
      ) : sorted.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucun document ne correspond à ces filtres</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Logement</th>
              <th>Locataire</th>
              <th>Type</th>
              <th>Date</th>
              <th>Émis le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr key={e.id}>
                <td>{e.bienAdresse} — {e.lotNom}</td>
                <td>{e.locataireNom}</td>
                <td><span className={`pill ${e.type === "entree" ? "ok" : "warn"}`}>{e.type === "entree" ? "Entrée" : "Sortie"}</span></td>
                <td>{formatDateFr(e.dateEtatDesLieux)}</td>
                <td>{formatDateFr(e.dateGeneration)}</td>
                <td>
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noreferrer" style={{ color: "var(--sage)" }}>Télécharger</a>
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
