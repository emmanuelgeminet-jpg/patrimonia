import Link from "next/link";
import { formatEuros, formatMonthLabel } from "@/lib/budget";

type Transaction = { montant_cents: number; categorie_id: string | null; mois_import: string | null };
type Category = { id: string; nom: string; groupe: "besoin" | "envie" | "epargne" | null };

export default function RevenusChargesSummary({
  transactions,
  categories,
}: {
  transactions: Transaction[];
  categories: Category[];
}) {
  const periods = [...new Set(transactions.map((t) => t.mois_import ?? ""))].filter(Boolean).sort().reverse();
  const period = periods[0];
  const monthTx = period ? transactions.filter((t) => t.mois_import === period) : [];
  const categorieById = new Map(categories.map((c) => [c.id, c]));

  const revenuRows = new Map<string, number>();
  const chargeRows = new Map<string, number>();
  for (const t of monthTx) {
    const nom = t.categorie_id ? categorieById.get(t.categorie_id)?.nom ?? "Non catégorisé" : "Non catégorisé";
    if (t.montant_cents > 0) revenuRows.set(nom, (revenuRows.get(nom) ?? 0) + t.montant_cents);
    else chargeRows.set(nom, (chargeRows.get(nom) ?? 0) + Math.abs(t.montant_cents));
  }

  const totalRevenus = [...revenuRows.values()].reduce((s, v) => s + v, 0);
  const totalCharges = [...chargeRows.values()].reduce((s, v) => s + v, 0);

  if (!period) {
    return (
      <div className="card">
        <h2>3-4. Revenus et charges mensuels</h2>
        <div className="empty" style={{ padding: "20px 4px" }}>
          Pas encore de données — importe un relevé dans <Link href="/mon-budget" style={{ color: "var(--sage)" }}>Mon budget</Link> pour que ces chiffres se calculent automatiquement.
        </div>
      </div>
    );
  }

  return (
    <div className="grid2">
      <div className="card">
        <h2>3. Revenus mensuels <span className="tag">{formatMonthLabel(period)}</span></h2>
        <div className="card-sub">
          Calculé depuis <Link href="/mon-budget" style={{ color: "var(--sage)" }}>Mon budget</Link> — catégorise tes virements de salaire là-bas pour affiner ce détail
        </div>
        <table>
          <tbody>
            {[...revenuRows.entries()].sort((a, b) => b[1] - a[1]).map(([nom, cents]) => (
              <tr key={nom}><td>{nom}</td><td className="num">{formatEuros(cents)}</td></tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--ink)" }}>
              <td><b>Total revenus</b></td><td className="num"><b>{formatEuros(totalRevenus)}</b></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>4. Charges mensuelles <span className="tag">{formatMonthLabel(period)}</span></h2>
        <div className="card-sub">Calculé depuis Mon budget, hors épargne/investissement</div>
        <table>
          <tbody>
            {[...chargeRows.entries()].sort((a, b) => b[1] - a[1]).map(([nom, cents]) => (
              <tr key={nom}><td>{nom}</td><td className="num">{formatEuros(cents)}</td></tr>
            ))}
            <tr style={{ borderTop: "1px solid var(--ink)" }}>
              <td><b>Total charges</b></td><td className="num"><b>{formatEuros(totalCharges)}</b></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
