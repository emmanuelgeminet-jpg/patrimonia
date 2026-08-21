"use client";

import { useMemo, useState } from "react";
import { formatEuros } from "@/lib/budget";

export type BailArchiveItem = {
  id: string;
  bienAdresse: string;
  lotNom: string;
  locataireNom: string;
  typeBail: "non_meuble" | "meuble";
  datePriseEffet: string;
  dureeMois: number;
  loyerHcCents: number;
  chargesCents: number;
  dateGeneration: string;
  url: string | null;
};

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

/** Archive des baux générés — même principe que QuittancesArchive : filtres calculés depuis
 *  les lignes déjà chargées, pas de requête séparée par filtre. */
export default function BauxArchive({ items }: { items: BailArchiveItem[] }) {
  const [logement, setLogement] = useState("");
  const [locataire, setLocataire] = useState("");

  const logements = useMemo(() => [...new Set(items.map((b) => `${b.bienAdresse} — ${b.lotNom}`))].sort(), [items]);
  const locataires = useMemo(() => [...new Set(items.map((b) => b.locataireNom))].sort(), [items]);

  const filtered = items.filter(
    (b) => (!logement || `${b.bienAdresse} — ${b.lotNom}` === logement) && (!locataire || b.locataireNom === locataire)
  );
  const sorted = [...filtered].sort((a, b) => (a.dateGeneration < b.dateGeneration ? 1 : a.dateGeneration > b.dateGeneration ? -1 : 0));

  return (
    <div className="card">
      <h2>Archive des baux <span className="tag">{sorted.length} bail{sorted.length !== 1 ? "aux" : ""}</span></h2>
      <div className="card-sub">Tous les baux générés depuis l&apos;appli, classés par date d&apos;émission, les plus récents en premier.</div>

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
        <div className="empty" style={{ padding: "16px 4px" }}>Aucun bail généré pour l&apos;instant</div>
      ) : sorted.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucun bail ne correspond à ces filtres</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Logement</th>
              <th>Locataire</th>
              <th>Type</th>
              <th>Prise d&apos;effet</th>
              <th>Durée</th>
              <th className="num">Loyer + charges</th>
              <th>Émis le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((b) => (
              <tr key={b.id}>
                <td>{b.bienAdresse} — {b.lotNom}</td>
                <td>{b.locataireNom}</td>
                <td><span className={`pill ${b.typeBail === "meuble" ? "warn" : "ok"}`}>{b.typeBail === "meuble" ? "Meublé" : "Non meublé"}</span></td>
                <td>{formatDateFr(b.datePriseEffet)}</td>
                <td>{b.dureeMois} mois</td>
                <td className="num">{formatEuros(b.loyerHcCents + b.chargesCents)}</td>
                <td>{formatDateFr(b.dateGeneration)}</td>
                <td>
                  {b.url ? (
                    <a href={b.url} target="_blank" rel="noreferrer" style={{ color: "var(--sage)" }}>Télécharger</a>
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
