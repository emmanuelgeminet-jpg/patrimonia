import { formatEuros } from "@/lib/budget";

function SavingsGauge({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  const angle = (Math.PI * (1 - clamped)); // 180° (0%) -> 0° (100%), en radians
  const x = 70 + 55 * Math.cos(angle);
  const y = 70 - 55 * Math.sin(angle);
  const largeArc = clamped > 0.999 ? 1 : 0;
  const color = clamped >= 0.2 ? "#8FB88D" : clamped >= 0.1 ? "#E0B15C" : "#D08A6E";

  return (
    <svg className="gauge-svg" viewBox="0 0 140 72">
      <path d="M 15,70 A 55,55 0 0,1 125,70" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="14" strokeLinecap="round" />
      <path
        d={`M 15,70 A 55,55 0 ${largeArc},1 ${x.toFixed(1)},${y.toFixed(1)}`}
        fill="none"
        stroke={color}
        strokeWidth="14"
        strokeLinecap="round"
      />
      <text x="70" y="66" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="20" fontWeight="600" fill={color}>
        {Math.round(clamped * 100)}%
      </text>
    </svg>
  );
}

function BalanceGauge({ revenus, depenses }: { revenus: number; depenses: number }) {
  const total = revenus + depenses || 1;
  const fracRevenus = Math.max(0, Math.min(1, revenus / total));
  const soldeCents = revenus - depenses;
  const color = soldeCents >= 0 ? "#8FB88D" : "#D08A6E";

  const pointAt = (frac: number) => {
    const angle = Math.PI * (1 - frac);
    return { x: 70 + 55 * Math.cos(angle), y: 70 - 55 * Math.sin(angle) };
  };
  const mid = pointAt(fracRevenus);
  const largeArcRevenus = fracRevenus > 0.999 ? 1 : 0;
  const largeArcDepenses = fracRevenus < 0.001 ? 1 : 0;

  return (
    <svg className="gauge-svg" viewBox="0 0 140 72">
      <path
        d={`M 15,70 A 55,55 0 ${largeArcRevenus},1 ${mid.x.toFixed(1)},${mid.y.toFixed(1)}`}
        fill="none"
        stroke="#8FB88D"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <path
        d={`M ${mid.x.toFixed(1)},${mid.y.toFixed(1)} A 55,55 0 ${largeArcDepenses},1 125,70`}
        fill="none"
        stroke="#D08A6E"
        strokeWidth="14"
        strokeLinecap="round"
      />
      <text x="70" y="66" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="14" fontWeight="600" fill={color}>
        {soldeCents >= 0 ? "+ " : "− "}
        {formatEuros(Math.abs(soldeCents))}
      </text>
    </svg>
  );
}

export default function DashboardHero({
  revenus,
  depenses,
  epargne,
  solde,
}: {
  revenus: number;
  depenses: number;
  epargne: number;
  solde: number;
}) {
  const tauxEpargne = revenus > 0 ? epargne / revenus : 0;
  const resteAVivre = revenus - depenses;

  return (
    <div className="indic-block">
      <div className="indic-title">Vue d&apos;ensemble du mois</div>
      <div className="indic-note">Recalculée automatiquement à partir de tes transactions importées</div>

      <div className="stat-row">
        <div className="gauge-card">
          <SavingsGauge pct={tauxEpargne} />
          <div className="gauge-text">
            <div className="hs-label">Taux d&apos;épargne</div>
            <div className="gauge-foot">
              Objectif courant <b style={{ color: "#8FB88D" }}>20 %</b> — {formatEuros(epargne)} mis de côté ce mois-ci
            </div>
          </div>
        </div>

        <div className="gauge-card">
          <BalanceGauge revenus={revenus} depenses={depenses} />
          <div className="gauge-text">
            <div className="hs-label">Balance du mois</div>
            <div className="gauge-foot">
              {solde >= 0 ? "Solde positif" : "Solde négatif"} — {formatEuros(revenus)} de revenus contre{" "}
              {formatEuros(depenses)} de dépenses
            </div>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="hero-stat">
          <div className="hs-icon">📥</div>
          <div className="hs-label">Revenus</div>
          <div className="hs-value good">{formatEuros(revenus)}</div>
          <div className="hs-foot">Tous foyers confondus</div>
        </div>
        <div className="hero-stat">
          <div className="hs-icon">📤</div>
          <div className="hs-label">Dépenses</div>
          <div className="hs-value">{formatEuros(depenses)}</div>
          <div className="hs-foot">Hors épargne / investissement</div>
        </div>
        <div className="hero-stat">
          <div className="hs-icon">🏠</div>
          <div className="hs-label">Reste à vivre</div>
          <div className={`hs-value ${resteAVivre >= 0 ? "good" : "warn"}`}>{formatEuros(resteAVivre)}</div>
          <div className="hs-foot">Revenus − dépenses courantes</div>
        </div>
      </div>
    </div>
  );
}
