"use client";

import { useState, useTransition } from "react";
import { updateTransactionCategory, flipTransactionSign } from "./actions";
import { formatEuros, formatMonthLabel } from "@/lib/budget";
import DashboardHero from "./DashboardHero";
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
  const depenses = Math.abs(depensesTotal);

  const categorieById = new Map(categories.map((c) => [c.id, c]));
  const groupeSums: Record<"besoin" | "envie" | "epargne", number> = { besoin: 0, envie: 0, epargne: 0 };
  for (const t of monthTx) {
    if (t.montant_cents >= 0) continue;
    const cat = t.categorie_id ? categorieById.get(t.categorie_id) : null;
    const groupe = cat?.groupe ?? "envie";
    groupeSums[groupe] += Math.abs(t.montant_cents);
  }
  const totalGroupes = groupeSums.besoin + groupeSums.envie + groupeSums.epargne || 1;

  // Détail des dépenses par catégorie
  const catTotals = new Map<string, number>();
  for (const t of monthTx) {
    if (t.montant_cents >= 0) continue;
    const nom = t.categorie_id ? categorieById.get(t.categorie_id)?.nom ?? "Non catégorisé" : "Non catégorisé";
    catTotals.set(nom, (catTotals.get(nom) ?? 0) + Math.abs(t.montant_cents));
  }
  const catRows = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);
  const totalDepenses = depenses || 1;

  // Revenus par source (une source = une catégorie assignée à une ligne positive)
  const revenuTotals = new Map<string, number>();
  for (const t of monthTx) {
    if (t.montant_cents <= 0) continue;
    const nom = t.categorie_id ? categorieById.get(t.categorie_id)?.nom ?? "Non catégorisé" : "Non catégorisé";
    revenuTotals.set(nom, (revenuTotals.get(nom) ?? 0) + t.montant_cents);
  }
  const revenuRows = [...revenuTotals.entries()].sort((a, b) => b[1] - a[1]);
  const totalRevenus = revenus || 1;

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
      <div className="pagesub" style={{ marginBottom: 14 }}>{formatMonthLabel(period)}</div>

      <DashboardHero revenus={revenus} depenses={depenses} epargne={groupeSums.epargne} solde={revenus - depenses} />

      <div className="grid2">
        <div className="card">
          <h2>Revenus par source</h2>
          {revenuRows.length === 0 ? (
            <div className="empty" style={{ padding: "16px 4px" }}>Aucun revenu catégorisé ce mois-ci</div>
          ) : (
            <table>
              <thead><tr><th>Source</th><th className="num">Montant</th><th className="num">%</th></tr></thead>
              <tbody>
                {revenuRows.map(([nom, cents]) => (
                  <tr key={nom}>
                    <td>{nom}</td>
                    <td className="num">{formatEuros(cents)}</td>
                    <td className="num">{((100 * cents) / totalRevenus).toFixed(0)} %</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <h2>Détail par catégorie <span className="tag">dépenses</span></h2>
          <table>
            <thead><tr><th>Catégorie</th><th className="num">Montant</th><th className="num">%</th></tr></thead>
            <tbody>
              {catRows.map(([nom, cents]) => (
                <tr key={nom}>
                  <td>{nom}</td>
                  <td className="num">{formatEuros(cents)}</td>
                  <td className="num">{((100 * cents) / totalDepenses).toFixed(0)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
        <h2>Transactions — {formatMonthLabel(period)} <span className="tag">clique une catégorie pour la modifier</span></h2>
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
        <TrendChart rows={rows} />
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Période</th><th className="num">Revenus</th><th className="num">Dépenses</th><th className="num">Solde</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.period}>
                <td>{formatMonthLabel(r.period)}</td>
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

function TrendChart({ rows }: { rows: { period: string; revenus: number; depenses: number }[] }) {
  const width = 620;
  const height = 190;
  const padLeft = 15;
  const padRight = 15;
  const chartTop = 15;
  const chartBottom = 150;
  const maxValue = Math.max(1, ...rows.map((r) => Math.max(r.revenus, r.depenses)));

  const usableWidth = width - padLeft - padRight;
  const groupWidth = usableWidth / rows.length;
  const barWidth = Math.min(18, groupWidth / 3);

  const scaleY = (v: number) => chartBottom - (v / maxValue) * (chartBottom - chartTop);

  // N'affiche pas plus d'une vingtaine d'étiquettes pour rester lisible
  const labelEvery = Math.max(1, Math.ceil(rows.length / 12));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <line x1={padLeft} y1={chartBottom} x2={width - padRight} y2={chartBottom} stroke="#8B876F" strokeWidth="1" />
      {rows.map((r, i) => {
        const groupX = padLeft + i * groupWidth;
        return (
          <g key={r.period}>
            <rect
              x={groupX + groupWidth / 2 - barWidth - 2}
              y={scaleY(r.revenus)}
              width={barWidth}
              height={chartBottom - scaleY(r.revenus)}
              fill="#5C7A5B"
            />
            <rect
              x={groupX + groupWidth / 2 + 2}
              y={scaleY(r.depenses)}
              width={barWidth}
              height={chartBottom - scaleY(r.depenses)}
              fill="#A8523A"
            />
            {i % labelEvery === 0 && (
              <text
                x={groupX + groupWidth / 2}
                y={168}
                textAnchor="middle"
                fontFamily="IBM Plex Mono"
                fontSize="9"
                fill="#5B5F53"
              >
                {formatMonthLabel(r.period).replace(" ", " ").slice(0, 8)}
              </text>
            )}
          </g>
        );
      })}
      <text x={padLeft} y={10} fontFamily="IBM Plex Mono" fontSize="10" fill="#5C7A5B">● Revenus</text>
      <text x={padLeft + 90} y={10} fontFamily="IBM Plex Mono" fontSize="10" fill="#A8523A">● Dépenses</text>
    </svg>
  );
}
