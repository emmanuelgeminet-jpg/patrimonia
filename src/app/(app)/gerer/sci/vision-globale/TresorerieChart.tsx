import { formatEuros } from "@/lib/budget";
import type { PointMensuel } from "@/lib/tresorerie";

const LARGEUR = 612;
const X_DEBUT = 20;
const X_PAS = 52;
const Y_HAUT = 20;
const Y_AXE = 150;
const Y_BAS = 140;

export default function TresorerieChart({ points }: { points: PointMensuel[] }) {
  const soldes = points.map((p) => p.soldeCents);
  const min = Math.min(...soldes, 0);
  const max = Math.max(...soldes, 0);
  const range = max - min || 1;
  const yFor = (v: number) => Y_BAS - ((v - min) / range) * (Y_BAS - Y_HAUT);

  const coords = points.map((p, i) => ({ x: X_DEBUT + i * X_PAS, y: yFor(p.soldeCents), p }));
  const polyline = coords.map((c) => `${c.x},${c.y.toFixed(1)}`).join(" ");
  const aire = `M${coords[0].x},${coords[0].y.toFixed(1)} L${coords
    .map((c) => `${c.x},${c.y.toFixed(1)}`)
    .join(" L")} L${coords[coords.length - 1].x},${Y_AXE} L${coords[0].x},${Y_AXE} Z`;

  const premier = points[0];
  const dernier = points[points.length - 1];

  return (
    <>
      <svg viewBox={`0 0 ${LARGEUR} 155`} width="100%" height="150">
        <line x1="0" y1={Y_AXE} x2={LARGEUR} y2={Y_AXE} stroke="#DEDACE" strokeWidth="1" />
        <path d={aire} fill="#A8523A" opacity="0.08" />
        <polyline points={polyline} fill="none" stroke="#A8523A" strokeWidth="2" />
        <g fill="#A8523A">
          {coords.map((c) => (
            <circle key={c.p.mois} cx={c.x} cy={c.y} r="2.5" />
          ))}
        </g>
        <g fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">
          {coords.map((c) => (
            <text key={c.p.mois} x={c.x - 6} y="163">{c.p.label}</text>
          ))}
        </g>
      </svg>
      <div className="chart-caption">
        De {formatEuros(premier.soldeCents)} ({premier.label}) à {formatEuros(dernier.soldeCents)} ({dernier.label}) — solde bancaire SCI en fin de mois, calculé depuis le journal
      </div>
    </>
  );
}
