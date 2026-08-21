"use client";

import { useState, useTransition } from "react";
import { reviserLoyer } from "@/lib/loyer-revision-actions";
import { formatEuros } from "@/lib/budget";

export type LoyerRevision = {
  id: string;
  dateRevision: string;
  irlReference: number;
  irlNouveau: number;
  ancienLoyerHcCents: number;
  nouveauLoyerHcCents: number;
};

/** Calculatrice + historique de révision de loyer (formule IRL) — un seul composant partagé
 *  SCI/nom propre, la mise à jour ne touche qu'une ligne `locataires`. */
export default function RevisionLoyerForm({
  locataireId,
  loyerActuelCents,
  historique,
}: {
  locataireId: string;
  loyerActuelCents: number;
  historique: LoyerRevision[];
}) {
  const [open, setOpen] = useState(false);
  const [irlReference, setIrlReference] = useState("");
  const [irlNouveau, setIrlNouveau] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [success, setSuccess] = useState<number | null>(null);

  const irlRefNum = parseFloat(irlReference.replace(",", "."));
  const irlNouveauNum = parseFloat(irlNouveau.replace(",", "."));
  const preview = irlRefNum > 0 && irlNouveauNum > 0 ? Math.round(loyerActuelCents * (irlNouveauNum / irlRefNum)) : null;

  const onSubmit = () => {
    setError(null);
    setWarning(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await reviserLoyer(locataireId, irlRefNum, irlNouveauNum);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.warning) setWarning(result.warning);
      if (result.nouveauLoyerCents != null) setSuccess(result.nouveauLoyerCents);
    });
  };

  if (!open) {
    return (
      <span style={{ color: "var(--sage)", cursor: "pointer", fontSize: 11 }} onClick={() => setOpen(true)}>
        Réviser le loyer
      </span>
    );
  }

  return (
    <div style={{ marginTop: 8, padding: 10, border: "1px solid var(--line)", borderRadius: 8, width: "100%" }}>
      <div style={{ fontSize: 11.5, marginBottom: 6 }}>
        Loyer actuel : <b>{formatEuros(loyerActuelCents)}</b> — saisis l&apos;IRL du trimestre de référence (à la signature ou
        dernière révision) et l&apos;IRL du nouveau trimestre (publiés chaque trimestre par l&apos;INSEE — cherche
        &quot;indice de référence des loyers&quot; sur insee.fr).
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <input placeholder="IRL référence" value={irlReference} onChange={(e) => setIrlReference(e.target.value)} style={{ maxWidth: 110 }} />
        <input placeholder="IRL nouveau" value={irlNouveau} onChange={(e) => setIrlNouveau(e.target.value)} style={{ maxWidth: 110 }} />
        {preview != null && (
          <span className="tag" style={{ color: "var(--sage)" }}>
            Nouveau loyer : {formatEuros(preview)}
          </span>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={pending || preview == null}
          style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}
        >
          {pending ? "..." : "Appliquer la révision"}
        </button>
        <span style={{ color: "var(--ink-soft)", cursor: "pointer", fontSize: 11 }} onClick={() => setOpen(false)}>
          Fermer
        </span>
      </div>
      {error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{error}</div>}
      {warning && <div style={{ color: "var(--amber)", fontSize: 11, marginTop: 4 }}>{warning}</div>}
      {success != null && <div style={{ color: "var(--sage)", fontSize: 11, marginTop: 4 }}>Loyer révisé à {formatEuros(success)}.</div>}

      {historique.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".05em", color: "var(--ink-soft)", marginBottom: 4 }}>
            Historique des révisions
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>IRL</th>
                <th className="num">Ancien loyer</th>
                <th className="num">Nouveau loyer</th>
              </tr>
            </thead>
            <tbody>
              {historique.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.dateRevision).toLocaleDateString("fr-FR")}</td>
                  <td>{r.irlReference} → {r.irlNouveau}</td>
                  <td className="num">{formatEuros(r.ancienLoyerHcCents)}</td>
                  <td className="num">{formatEuros(r.nouveauLoyerHcCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
