import { formatEuros } from "@/lib/budget";

function EndettementGauge({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct / 0.5)); // jauge graduée jusqu'à 50%
  const angle = Math.PI * (1 - clamped);
  const x = 70 + 55 * Math.cos(angle);
  const y = 70 - 55 * Math.sin(angle);
  const largeArc = clamped > 0.999 ? 1 : 0;
  const color = pct <= 0.35 ? "#8FB88D" : pct <= 0.4 ? "#E0B15C" : "#D08A6E";
  // Repère à 35% (limite HCSF)
  const hcsfAngle = Math.PI * (1 - Math.min(1, 0.35 / 0.5));
  const hx1 = 70 + 48 * Math.cos(hcsfAngle);
  const hy1 = 70 - 48 * Math.sin(hcsfAngle);
  const hx2 = 70 + 63 * Math.cos(hcsfAngle);
  const hy2 = 70 - 63 * Math.sin(hcsfAngle);

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
      <line x1={hx1} y1={hy1} x2={hx2} y2={hy2} stroke="#E0B15C" strokeWidth="3" strokeLinecap="round" />
      <text x="70" y="66" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="20" fontWeight="600" fill={color}>
        {Math.round(pct * 100)}%
      </text>
    </svg>
  );
}

export default function IndicateursHero({
  tauxEndettement,
  capaciteEpargne,
  resteAVivre,
  patrimoineNet,
  capaciteEmprunt,
  apportMobilisable,
}: {
  tauxEndettement: number;
  capaciteEpargne: number;
  resteAVivre: number;
  patrimoineNet: number;
  capaciteEmprunt: number;
  apportMobilisable: number;
}) {
  return (
    <div className="indic-block">
      <div className="indic-title">Indicateurs calculés</div>
      <div className="indic-note">Recalculés automatiquement à partir de tes vraies données (Mon budget, patrimoine, emprunts)</div>

      <div className="stat-row">
        <div className="gauge-card">
          <EndettementGauge pct={tauxEndettement} />
          <div className="gauge-text">
            <div className="hs-label">Taux d&apos;endettement</div>
            <div className="gauge-foot">
              Limite HCSF <b style={{ color: "#E0B15C" }}>35 %</b> — {tauxEndettement <= 0.35 ? `marge de ${((0.35 - tauxEndettement) * 100).toFixed(0)} points` : "dépassement"}
            </div>
          </div>
        </div>
        <div className="hero-stat">
          <div className="hs-icon">💶</div>
          <div className="hs-label">Capacité d&apos;épargne / mois</div>
          <div className={`hs-value ${capaciteEpargne >= 0 ? "good" : "warn"}`}>
            {capaciteEpargne >= 0 ? "+ " : "− "}{formatEuros(Math.abs(capaciteEpargne))}
          </div>
          <div className="hs-foot">Revenus − dépenses courantes (Mon budget)</div>
        </div>
      </div>

      <div className="stat-row">
        <div className="hero-stat">
          <div className="hs-icon">🏠</div>
          <div className="hs-label">Reste à vivre</div>
          <div className={`hs-value ${resteAVivre >= 0 ? "good" : "warn"}`}>{formatEuros(resteAVivre)}</div>
          <div className="hs-foot">Après charges essentielles</div>
        </div>
        <div className="hero-stat">
          <div className="hs-icon">📊</div>
          <div className="hs-label">Patrimoine net</div>
          <div className="hs-value">{formatEuros(patrimoineNet)}</div>
          <div className="hs-foot">Actif − passif, détail plus bas</div>
        </div>
        <div className={`hero-stat${tauxEndettement > 0.3 ? " warn-border" : ""}`}>
          <div className="hs-icon">🏦</div>
          <div className="hs-label">Capacité d&apos;emprunt résiduelle</div>
          <div className="hs-value warn">≈ {formatEuros(capaciteEmprunt)}</div>
          <div className="hs-foot">À 20 ans, taux estimé 3,8 %</div>
        </div>
        <div className="hero-stat">
          <div className="hs-icon">💰</div>
          <div className="hs-label">Apport mobilisable</div>
          <div className="hs-value">{formatEuros(apportMobilisable)}</div>
          <div className="hs-foot">Épargne dispo hors précaution</div>
        </div>
      </div>
    </div>
  );
}
