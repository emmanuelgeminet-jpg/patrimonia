"use client";

import { useMemo, useState } from "react";
import { formatEuros, bucketKey, formatBucketLabel, type Granularite } from "@/lib/budget";
import type { Transaction, Category } from "./page";

const GRANULARITES: { key: Granularite; label: string }[] = [
  { key: "semaine", label: "Semaine" },
  { key: "mois", label: "Mois" },
  { key: "annee", label: "Année" },
];

function addMonths(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

export default function CategoryExplorer({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const allDates = transactions.map((t) => t.date).sort();
  const minDate = allDates[0] ?? new Date().toISOString().slice(0, 10);
  const maxDate = allDates[allDates.length - 1] ?? new Date().toISOString().slice(0, 10);

  const expenseCategories = categories.filter((c) => c.groupe !== null);
  const [categorieId, setCategorieId] = useState<string>(expenseCategories[0]?.id ?? "");
  const [granularite, setGranularite] = useState<Granularite>("mois");
  const [fromDate, setFromDate] = useState(() => {
    const twelveMonthsBack = addMonths(maxDate, -12);
    return twelveMonthsBack > minDate ? twelveMonthsBack : minDate;
  });
  const [toDate, setToDate] = useState(maxDate);

  const filtered = useMemo(() => {
    return transactions.filter(
      (t) => t.categorie_id === categorieId && t.date >= fromDate && t.date <= toDate
    );
  }, [transactions, categorieId, fromDate, toDate]);

  const buckets = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of filtered) {
      const key = bucketKey(t.date, granularite);
      map.set(key, (map.get(key) ?? 0) + t.montant_cents);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1));
  }, [filtered, granularite]);

  const total = filtered.reduce((s, t) => s + t.montant_cents, 0);
  const moyenneParBucket = buckets.length > 0 ? total / buckets.length : 0;
  const maxAbs = Math.max(1, ...buckets.map(([, v]) => Math.abs(v)));

  const categorieNom = categories.find((c) => c.id === categorieId)?.nom ?? "—";

  return (
    <div className="card">
      <h2>Explorer une catégorie</h2>
      <div className="card-sub">Choisis une catégorie et une plage de temps pour voir son évolution en détail</div>

      <div className="form-row" style={{ border: "none" }}>
        <label>Catégorie</label>
        <select value={categorieId} onChange={(e) => setCategorieId(e.target.value)}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.nom}</option>
          ))}
        </select>
      </div>

      <div className="form-row" style={{ border: "none" }}>
        <label>Regrouper par</label>
        <div className="unit-tabs" style={{ marginBottom: 0 }}>
          {GRANULARITES.map((g) => (
            <div
              key={g.key}
              className={`unit-tab${granularite === g.key ? " active" : ""}`}
              onClick={() => setGranularite(g.key)}
            >
              {g.label}
            </div>
          ))}
        </div>
      </div>

      <div className="form-row" style={{ border: "none" }}>
        <label>Période</label>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input type="date" value={fromDate} min={minDate} max={toDate} onChange={(e) => setFromDate(e.target.value)} />
          <span style={{ color: "var(--ink-soft)" }}>→</span>
          <input type="date" value={toDate} min={fromDate} max={maxDate} onChange={(e) => setToDate(e.target.value)} />
          <span
            className="pill vac"
            style={{ cursor: "pointer" }}
            onClick={() => { setFromDate(addMonths(maxDate, -3)); setToDate(maxDate); }}
          >
            3 mois
          </span>
          <span
            className="pill vac"
            style={{ cursor: "pointer" }}
            onClick={() => { setFromDate(addMonths(maxDate, -12)); setToDate(maxDate); }}
          >
            12 mois
          </span>
          <span
            className="pill vac"
            style={{ cursor: "pointer" }}
            onClick={() => { setFromDate(`${maxDate.slice(0, 4)}-01-01`); setToDate(maxDate); }}
          >
            Cette année
          </span>
          <span
            className="pill vac"
            style={{ cursor: "pointer" }}
            onClick={() => { setFromDate(minDate); setToDate(maxDate); }}
          >
            Tout
          </span>
        </div>
      </div>

      <div className="kpis" style={{ marginTop: 14 }}>
        <div className="kpi">
          <div className="label">Total — {categorieNom}</div>
          <div className="value">{formatEuros(total)}</div>
        </div>
        <div className="kpi">
          <div className="label">Moyenne par {granularite === "semaine" ? "semaine" : granularite === "mois" ? "mois" : "année"}</div>
          <div className="value">{formatEuros(moyenneParBucket)}</div>
        </div>
        <div className="kpi">
          <div className="label">Nombre de transactions</div>
          <div className="value">{filtered.length}</div>
        </div>
      </div>

      {buckets.length === 0 ? (
        <div className="empty" style={{ padding: "20px 4px" }}>Aucune transaction dans cette catégorie sur la période choisie</div>
      ) : (
        <svg viewBox="0 0 620 190" width="100%" height="185" style={{ marginTop: 8 }}>
          <line x1="15" y1="150" x2="605" y2="150" stroke="#8B876F" strokeWidth="1" />
          {buckets.map(([key, value], i) => {
            const groupWidth = 590 / buckets.length;
            const barWidth = Math.min(28, groupWidth * 0.6);
            const barHeight = (Math.abs(value) / maxAbs) * 120;
            const x = 15 + i * groupWidth + (groupWidth - barWidth) / 2;
            const y = value >= 0 ? 150 - barHeight : 150;
            const labelEvery = Math.max(1, Math.ceil(buckets.length / 14));
            return (
              <g key={key}>
                <rect x={x} y={y} width={barWidth} height={Math.max(1, barHeight)} fill={value >= 0 ? "#5C7A5B" : "#A8523A"} />
                {i % labelEvery === 0 && (
                  <text
                    x={x + barWidth / 2}
                    y={168}
                    textAnchor="middle"
                    fontFamily="IBM Plex Mono"
                    fontSize="9"
                    fill="#5B5F53"
                  >
                    {formatBucketLabel(key, granularite)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
