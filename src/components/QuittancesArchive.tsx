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
 */
export default function QuittancesArchive({ items }: { items: QuittanceArchiveItem[] }) {
  const sorted = [...items].sort((a, b) => (a.mois < b.mois ? 1 : a.mois > b.mois ? -1 : 0));

  return (
    <div className="card">
      <h2>Archive des quittances <span className="tag">{sorted.length} quittance{sorted.length !== 1 ? "s" : ""}</span></h2>
      <div className="card-sub">
        Toutes les quittances générées depuis l&apos;appli, à conserver en cas de besoin (litige, contrôle...) —
        classées par période, les plus récentes en premier.
      </div>
      {sorted.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucune quittance générée pour l&apos;instant</div>
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
