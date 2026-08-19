"use client";

import { useState, useTransition } from "react";
import { updateTransactionCategory, flipTransactionSign } from "./actions";
import { formatEuros } from "@/lib/budget";
import type { Transaction, Category } from "./page";

type TabKey = "1m" | "6m" | "1a" | "5a";

const TABS: { key: TabKey; label: string }[] = [
  { key: "1m", label: "1 mois" },
  { key: "6m", label: "6 mois" },
  { key: "1a", label: "1 an" },
  { key: "5a", label: "5 ans" },
];

export default function BudgetTabs({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const [active, setActive] = useState<TabKey>("1m");

  const periods = [...new Set(transactions.map((t) => t.mois_import ?? "Sans période"))].sort((a, b) =>
    a < b ? 1 : -1
  );

  if (periods.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="big">Aucune donnée pour l&apos;instant</div>
          Importe un premier relevé bancaire ci-dessus pour voir apparaître ton budget ici.
        </div>
      </div>
    );
  }

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

      {active === "1m" && <PanelUnMois transactions={transactions} categories={categories} period={periods[0]} />}
      {active === "6m" && <PanelTendance transactions={transactions} periods={periods} minPeriods={2} titre="6 mois" />}
      {active === "1a" && <PanelTendance transactions={transactions} periods={periods} minPeriods={6} titre="1 an" />}
      {active === "5a" && <PanelTendance transactions={transactions} periods={periods} minPeriods={24} titre="5 ans" />}
    </>
  );
}

function PanelUnMois({
  transactions,
  categories,
  period,
}: {
  transactions: Transaction[];
  categories: Category[];
  period: string;
}) {
  const monthTx = transactions.filter((t) => (t.mois_import ?? "Sans période") === period);

  const revenus = monthTx.filter((t) => t.montant_cents > 0).reduce((s, t) => s + t.montant_cents, 0);
  const depensesTotal = monthTx.filter((t) => t.montant_cents < 0).reduce((s, t) => s + t.montant_cents, 0);

  const categorieById = new Map(categories.map((c) => [c.id, c]));
  const groupeSums: Record<"besoin" | "envie" | "epargne", number> = { besoin: 0, envie: 0, epargne: 0 };
  for (const t of monthTx) {
    if (t.montant_cents >= 0) continue;
    const cat = t.categorie_id ? categorieById.get(t.categorie_id) : null;
    const groupe = cat?.groupe ?? "envie";
    groupeSums[groupe] += Math.abs(t.montant_cents);
  }
  const totalGroupes = groupeSums.besoin + groupeSums.envie + groupeSums.epargne || 1;

  const reste = revenus + depensesTotal;

  // Détail par catégorie
  const catTotals = new Map<string, number>();
  for (const t of monthTx) {
    if (t.montant_cents >= 0) continue;
    const nom = t.categorie_id ? categorieById.get(t.categorie_id)?.nom ?? "Non catégorisé" : "Non catégorisé";
    catTotals.set(nom, (catTotals.get(nom) ?? 0) + Math.abs(t.montant_cents));
  }
  const catRows = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);
  const totalDepenses = Math.abs(depensesTotal) || 1;

  // Abonnements détectés : même libellé sur au moins 2 périodes différentes
  const byLibelle = new Map<string, { periods: Set<string>; montant_cents: number }>();
  for (const t of transactions) {
    if (t.montant_cents >= 0) continue;
    const entry = byLibelle.get(t.libelle) ?? { periods: new Set(), montant_cents: t.montant_cents };
    entry.periods.add(t.mois_import ?? "");
    byLibelle.set(t.libelle, entry);
  }
  const abonnements = [...byLibelle.entries()].filter(([, v]) => v.periods.size >= 2);

  return (
    <div>
      <div className="pagesub" style={{ marginBottom: 14 }}>{period}</div>

      <div className="kpis">
        <div className="kpi"><div className="label">Revenus du foyer</div><div className="value">{formatEuros(revenus)}</div></div>
        <div className="kpi"><div className="label">Dépenses</div><div className="value">{formatEuros(Math.abs(depensesTotal))}</div></div>
        <div className="kpi"><div className="label">Dont épargne / invest.</div><div className="value">{formatEuros(groupeSums.epargne)}</div></div>
        <div className="kpi accent"><div className="label">Reste</div><div className="value">{formatEuros(reste)}</div></div>
      </div>

      <div className="card">
        <h2>Répartition 50/30/20 <span className="tag">besoins / envies / épargne</span></h2>
        <svg viewBox="0 0 600 60" width="100%" height="56">
          <rect x="0" y="18" width={(600 * groupeSums.besoin) / totalGroupes} height="24" fill="#8B876F" />
          <rect x={(600 * groupeSums.besoin) / totalGroupes} y="18" width={(600 * groupeSums.envie) / totalGroupes} height="24" fill="#C7A98A" />
          <rect
            x={(600 * (groupeSums.besoin + groupeSums.envie)) / totalGroupes}
            y="18"
            width={(600 * groupeSums.epargne) / totalGroupes}
            height="24"
            fill="#5C7A5B"
          />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
          <span>● Besoins — {formatEuros(groupeSums.besoin)} ({((100 * groupeSums.besoin) / totalGroupes).toFixed(1)} %)</span>
          <span>● Envies — {formatEuros(groupeSums.envie)} ({((100 * groupeSums.envie) / totalGroupes).toFixed(1)} %)</span>
          <span>● Épargne / invest. — {formatEuros(groupeSums.epargne)} ({((100 * groupeSums.epargne) / totalGroupes).toFixed(1)} %)</span>
        </div>
      </div>

      <div className="card">
        <h2>Détail par catégorie</h2>
        <table>
          <thead><tr><th>Catégorie</th><th className="num">Montant</th><th className="num">% des dépenses</th></tr></thead>
          <tbody>
            {catRows.map(([nom, cents]) => (
              <tr key={nom}>
                <td>{nom}</td>
                <td className="num">{formatEuros(cents)}</td>
                <td className="num">{((100 * cents) / totalDepenses).toFixed(1)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abonnements.length > 0 && (
        <div className="card">
          <h2>Abonnements détectés <span className="tag">même libellé sur plusieurs mois</span></h2>
          <table>
            <tbody>
              {abonnements.map(([libelle, v]) => (
                <tr key={libelle}>
                  <td>{libelle}</td>
                  <td className="num">{formatEuros(Math.abs(v.montant_cents))}/mois</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card">
        <h2>Transactions — {period} <span className="tag">clique une catégorie pour la modifier</span></h2>
        <table>
          <thead><tr><th>Date</th><th>Libellé</th><th className="num">Montant</th><th></th><th>Catégorie</th></tr></thead>
          <tbody>
            {monthTx.map((t) => (
              <TransactionRow key={t.id} transaction={t} categories={categories} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionRow({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  const [categorieId, setCategorieId] = useState(transaction.categorie_id ?? "");
  const [montantCents, setMontantCents] = useState(transaction.montant_cents);
  const [isPending, startTransition] = useTransition();

  return (
    <tr>
      <td>{new Date(transaction.date).toLocaleDateString("fr-FR")}</td>
      <td>{transaction.libelle}</td>
      <td className="num">{formatEuros(montantCents)}</td>
      <td>
        <span
          title="Inverser dépense / recette"
          style={{ cursor: "pointer", color: "var(--ink-soft)" }}
          onClick={() => {
            const next = -montantCents;
            setMontantCents(next);
            startTransition(() => {
              flipTransactionSign(transaction.id, montantCents);
            });
          }}
        >
          ↕
        </span>
      </td>
      <td>
        <select
          value={categorieId}
          disabled={isPending}
          onChange={(e) => {
            const value = e.target.value;
            setCategorieId(value);
            startTransition(() => {
              updateTransactionCategory(transaction.id, value);
            });
          }}
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </td>
    </tr>
  );
}

function PanelTendance({
  transactions,
  periods,
  minPeriods,
  titre,
}: {
  transactions: Transaction[];
  periods: string[];
  minPeriods: number;
  titre: string;
}) {
  if (periods.length < minPeriods) {
    return (
      <div>
        <div className="pagesub" style={{ marginBottom: 14 }}>Vue &quot;{titre}&quot; — se complète au fil des imports</div>
        <div className="card">
          <div className="empty">
            <div className="big">Historique insuffisant</div>
            {periods.length} période(s) importée(s) sur {minPeriods} nécessaires pour cette vue. Continue à déposer tes relevés au fil du temps.
          </div>
        </div>
      </div>
    );
  }

  const rows = periods
    .slice()
    .reverse()
    .map((period) => {
      const tx = transactions.filter((t) => (t.mois_import ?? "Sans période") === period);
      const revenus = tx.filter((t) => t.montant_cents > 0).reduce((s, t) => s + t.montant_cents, 0);
      const depenses = Math.abs(tx.filter((t) => t.montant_cents < 0).reduce((s, t) => s + t.montant_cents, 0));
      return { period, revenus, depenses };
    });

  return (
    <div>
      <div className="card">
        <h2>Évolution revenus / dépenses <span className="tag">{titre}</span></h2>
        <table>
          <thead><tr><th>Période</th><th className="num">Revenus</th><th className="num">Dépenses</th><th className="num">Solde</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.period}>
                <td>{r.period}</td>
                <td className="num">{formatEuros(r.revenus)}</td>
                <td className="num">{formatEuros(r.depenses)}</td>
                <td className="num">{formatEuros(r.revenus - r.depenses)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
