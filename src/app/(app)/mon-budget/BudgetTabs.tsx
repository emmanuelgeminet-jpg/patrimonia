"use client";

import { useMemo, useState, useTransition } from "react";
import { updateTransactionCategory, flipTransactionSign, updateTransactionTags } from "./actions";
import { formatEuros, formatMonthLabel, parseTagsInput, bucketKey } from "@/lib/budget";
import DashboardHero from "./DashboardHero";
import BudgetPieChart from "./BudgetPieChart";
import type { Transaction, Category } from "./page";

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function BudgetTabs({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const allDates = transactions.map((t) => t.date).sort();
  const minDate = allDates[0] ?? new Date().toISOString().slice(0, 10);
  const maxDate = allDates[allDates.length - 1] ?? new Date().toISOString().slice(0, 10);

  const clampedBack = (months: number) => {
    const back = addMonths(maxDate, -months);
    return back > minDate ? back : minDate;
  };

  const [debut, setDebut] = useState(() => clampedBack(1));
  const [fin, setFin] = useState(maxDate);

  if (transactions.length === 0) {
    return (
      <div className="card">
        <div className="empty">
          <div className="big">Aucune donnée pour l&apos;instant</div>
          Importe un premier relevé bancaire ci-dessus pour voir apparaître ton budget ici.
        </div>
      </div>
    );
  }

  const presets: { label: string; apply: () => void }[] = [
    { label: "1 mois", apply: () => { setDebut(clampedBack(1)); setFin(maxDate); } },
    { label: "6 mois", apply: () => { setDebut(clampedBack(6)); setFin(maxDate); } },
    { label: "1 an", apply: () => { setDebut(clampedBack(12)); setFin(maxDate); } },
    { label: "5 ans", apply: () => { setDebut(clampedBack(60)); setFin(maxDate); } },
    { label: "Tout", apply: () => { setDebut(minDate); setFin(maxDate); } },
  ];

  return (
    <>
      <div className="card">
        <h2>Période</h2>
        <div className="card-sub">Choisis une durée rapide, ou une période exacte avec les deux dates</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" value={debut} min={minDate} max={fin} onChange={(e) => setDebut(e.target.value)} />
          <span style={{ color: "var(--ink-soft)" }}>→</span>
          <input type="date" value={fin} min={debut} max={maxDate} onChange={(e) => setFin(e.target.value)} />
          {presets.map((p) => (
            <span key={p.label} className="pill vac" style={{ cursor: "pointer" }} onClick={p.apply}>
              {p.label}
            </span>
          ))}
        </div>
      </div>

      <PanelPeriode transactions={transactions} categories={categories} debut={debut} fin={fin} />
    </>
  );
}

function PanelPeriode({
  transactions,
  categories,
  debut,
  fin,
}: {
  transactions: Transaction[];
  categories: Category[];
  debut: string;
  fin: string;
}) {
  const periodTx = useMemo(() => transactions.filter((t) => t.date >= debut && t.date <= fin), [transactions, debut, fin]);

  const trendRows = useMemo(() => {
    const map = new Map<string, { revenus: number; depenses: number }>();
    for (const t of periodTx) {
      const key = bucketKey(t.date, "mois");
      const entry = map.get(key) ?? { revenus: 0, depenses: 0 };
      if (t.montant_cents > 0) entry.revenus += t.montant_cents;
      else entry.depenses += Math.abs(t.montant_cents);
      map.set(key, entry);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([period, v]) => ({ period, ...v }));
  }, [periodTx]);

  const revenus = periodTx.filter((t) => t.montant_cents > 0).reduce((s, t) => s + t.montant_cents, 0);
  const depensesTotal = periodTx.filter((t) => t.montant_cents < 0).reduce((s, t) => s + t.montant_cents, 0);
  const depenses = Math.abs(depensesTotal);

  const categorieById = new Map(categories.map((c) => [c.id, c]));
  const groupeSums: Record<"besoin" | "envie" | "epargne", number> = { besoin: 0, envie: 0, epargne: 0 };
  for (const t of periodTx) {
    if (t.montant_cents >= 0) continue;
    const cat = t.categorie_id ? categorieById.get(t.categorie_id) : null;
    const groupe = cat?.groupe ?? "envie";
    groupeSums[groupe] += Math.abs(t.montant_cents);
  }
  const totalGroupes = groupeSums.besoin + groupeSums.envie + groupeSums.epargne || 1;

  const catTotals = new Map<string, number>();
  for (const t of periodTx) {
    if (t.montant_cents >= 0) continue;
    const nom = t.categorie_id ? categorieById.get(t.categorie_id)?.nom ?? "Non catégorisé" : "Non catégorisé";
    catTotals.set(nom, (catTotals.get(nom) ?? 0) + Math.abs(t.montant_cents));
  }
  const catRows = [...catTotals.entries()].sort((a, b) => b[1] - a[1]);

  const revenuTotals = new Map<string, number>();
  for (const t of periodTx) {
    if (t.montant_cents <= 0) continue;
    const nom = t.categorie_id ? categorieById.get(t.categorie_id)?.nom ?? "Non catégorisé" : "Non catégorisé";
    revenuTotals.set(nom, (revenuTotals.get(nom) ?? 0) + t.montant_cents);
  }
  const revenuRows = [...revenuTotals.entries()].sort((a, b) => b[1] - a[1]);
  const totalRevenus = revenus || 1;

  // Abonnements détectés sur tout l'historique (même libellé sur au moins 2 mois différents) —
  // indépendant de la période affichée, pour repérer un abonnement même hors de la vue actuelle.
  const byLibelle = new Map<string, { periods: Set<string>; montant_cents: number }>();
  for (const t of transactions) {
    if (t.montant_cents >= 0) continue;
    const entry = byLibelle.get(t.libelle) ?? { periods: new Set(), montant_cents: t.montant_cents };
    entry.periods.add(bucketKey(t.date, "mois"));
    byLibelle.set(t.libelle, entry);
  }
  const abonnements = [...byLibelle.entries()].filter(([, v]) => v.periods.size >= 2);

  const periodLabel = `${formatDateFr(debut)} → ${formatDateFr(fin)}`;

  return (
    <div>
      {trendRows.length > 1 && (
        <div className="card">
          <h2>Évolution revenus / dépenses <span className="tag">{trendRows.length} mois</span></h2>
          <TrendChart rows={trendRows} />
        </div>
      )}

      <DashboardHero revenus={revenus} depenses={depenses} epargne={groupeSums.epargne} solde={revenus - depenses} periodLabel={periodLabel} />

      <div className="grid2">
        <div className="card">
          <h2>Revenus par source</h2>
          {revenuRows.length === 0 ? (
            <div className="empty" style={{ padding: "16px 4px" }}>Aucun revenu sur cette période</div>
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
          <h2>Répartition des dépenses <span className="tag">camembert</span></h2>
          <BudgetPieChart data={catRows.map(([nom, cents]) => ({ nom, cents }))} total={depenses} />
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
          <h2>Abonnements détectés <span className="tag">même libellé sur plusieurs mois, tout l&apos;historique</span></h2>
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
        <h2>Transactions — {periodLabel} <span className="tag">{periodTx.length} ligne{periodTx.length > 1 ? "s" : ""}, clique une catégorie pour la modifier</span></h2>
        {periodTx.length === 0 ? (
          <div className="empty" style={{ padding: "16px 4px" }}>Aucune transaction sur cette période</div>
        ) : (
          <table>
            <thead><tr><th>Date</th><th>Libellé</th><th className="num">Montant</th><th></th><th>Catégorie</th><th>Tags</th></tr></thead>
            <tbody>
              {periodTx.map((t) => (
                <TransactionRow key={t.id} transaction={t} categories={categories} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function TransactionRow({ transaction, categories }: { transaction: Transaction; categories: Category[] }) {
  const [categorieId, setCategorieId] = useState(transaction.categorie_id ?? "");
  const [montantCents, setMontantCents] = useState(transaction.montant_cents);
  const [tags, setTags] = useState(transaction.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const saveTags = (next: string[]) => {
    setTags(next);
    startTransition(() => {
      updateTransactionTags(transaction.id, next);
    });
  };
  const addTagsFromInput = () => {
    if (!tagInput.trim()) return;
    const next = [...new Set([...tags, ...parseTagsInput(tagInput)])];
    saveTags(next);
    setTagInput("");
  };

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
      <td>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", minWidth: 140 }}>
          {tags.map((tag) => (
            <span key={tag} className="pill" style={{ background: "var(--paper)", color: "var(--ink-soft)", fontSize: 10.5 }}>
              {tag}{" "}
              <span
                style={{ cursor: "pointer", color: "var(--brick)" }}
                onClick={() => saveTags(tags.filter((t) => t !== tag))}
              >
                ×
              </span>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTagsFromInput(); } }}
            onBlur={addTagsFromInput}
            placeholder="+ tag"
            style={{ maxWidth: 70, fontSize: 10.5, padding: "2px 6px" }}
          />
        </div>
      </td>
    </tr>
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
                {formatMonthLabel(r.period).replace(" ", " ").slice(0, 8)}
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
