"use client";

import { useState } from "react";
import { formatEuros } from "@/lib/budget";

const PALETTE = [
  "#A8523A", "#5C7A5B", "#B98A2E", "#6B7FA3", "#8B6F47",
  "#9B5C6B", "#4F7768", "#B0763F", "#7A6A8A", "#5B7A8C",
];

function polarPoint(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

/** Secteur de donut entre deux angles (radians, 0 = haut, sens horaire). */
function donutSlicePath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number): string {
  const start = startAngle - Math.PI / 2;
  const end = endAngle - Math.PI / 2;
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;

  const p1 = polarPoint(cx, cy, rOuter, start);
  const p2 = polarPoint(cx, cy, rOuter, end);
  const p3 = polarPoint(cx, cy, rInner, end);
  const p4 = polarPoint(cx, cy, rInner, start);

  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export default function BudgetPieChart({ data, total }: { data: { nom: string; cents: number }[]; total: number }) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0 || total <= 0) {
    return <div className="empty" style={{ padding: "20px 4px" }}>Rien à répartir sur cette période</div>;
  }

  const cx = 90;
  const cy = 90;
  const rOuter = 82;
  const rInner = 50;

  const slices = data.reduce<{ nom: string; cents: number; index: number; startAngle: number; endAngle: number }[]>((acc, d, i) => {
    const cursor = acc.length > 0 ? acc[acc.length - 1].endAngle : 0;
    const angle = (d.cents / total) * Math.PI * 2;
    acc.push({ ...d, index: i, startAngle: cursor, endAngle: cursor + angle });
    return acc;
  }, []);

  const center = hovered !== null ? slices[hovered] : null;

  return (
    <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
      <svg viewBox="0 0 180 180" width="180" height="180" style={{ flexShrink: 0 }}>
        {slices.map((s) => (
          <path
            key={s.nom}
            d={donutSlicePath(cx, cy, hovered === s.index ? rOuter + 4 : rOuter, rInner, s.startAngle, s.endAngle)}
            fill={PALETTE[s.index % PALETTE.length]}
            opacity={hovered === null || hovered === s.index ? 1 : 0.45}
            style={{ cursor: "pointer", transition: "opacity .12s ease" }}
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="12" fontWeight="600" fill="var(--ink)">
          {center ? `${((center.cents / total) * 100).toFixed(0)} %` : formatEuros(total)}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontFamily="IBM Plex Sans" fontSize="9" fill="var(--ink-soft)">
          {center ? center.nom.slice(0, 16) : "Total"}
        </text>
      </svg>

      <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 160 }}>
        {slices.map((s) => (
          <div
            key={s.nom}
            onMouseEnter={() => setHovered(s.index)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              fontSize: 11.5,
              cursor: "pointer",
              opacity: hovered === null || hovered === s.index ? 1 : 0.5,
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: 2, background: PALETTE[s.index % PALETTE.length], flexShrink: 0 }} />
            <span style={{ flex: 1 }}>{s.nom}</span>
            <span style={{ fontFamily: "var(--font-plex-mono)", color: "var(--ink-soft)" }}>
              {formatEuros(s.cents)} · {((s.cents / total) * 100).toFixed(0)} %
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
