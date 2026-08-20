import { formatEuros } from "@/lib/budget";
import LoyerViseForm from "./LoyerViseForm";

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

function ObjectifGauge({ pct }: { pct: number }) {
  const clamped = Math.max(0, Math.min(1, pct));
  const angle = Math.PI * (1 - clamped);
  const x = 70 + 55 * Math.cos(angle);
  const y = 70 - 55 * Math.sin(angle);
  const largeArc = clamped > 0.999 ? 1 : 0;
  const color = clamped >= 1 ? "#5C7A5B" : clamped >= 0.5 ? "#8FB88D" : "#B98A2E";

  return (
    <svg className="gauge-svg" viewBox="0 0 140 72">
      <path d="M 15,70 A 55,55 0 0,1 125,70" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="14" strokeLinecap="round" />
      {clamped > 0 && (
        <path
          d={`M 15,70 A 55,55 0 ${largeArc},1 ${x.toFixed(1)},${y.toFixed(1)}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
        />
      )}
      <text x="70" y="66" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="20" fontWeight="600" fill={color}>
        {Math.round(clamped * 100)}%
      </text>
    </svg>
  );
}

export default function IndicateursHero({
  tauxEndettement,
  capaciteEpargne,
  resteAVivre,
  patrimoineNet,
  capaciteEmpruntRP,
  capaciteEmpruntLocatif,
  loyerViseLocatifCents,
  apportMobilisable,
  objectifLibelle,
  objectifMontantCents,
}: {
  tauxEndettement: number;
  capaciteEpargne: number;
  resteAVivre: number;
  patrimoineNet: number;
  capaciteEmpruntRP: number;
  capaciteEmpruntLocatif: number;
  loyerViseLocatifCents: number | null;
  apportMobilisable: number;
  objectifLibelle: string | null;
  objectifMontantCents: number | null;
}) {
  const objectifPct = objectifMontantCents && objectifMontantCents > 0 ? patrimoineNet / objectifMontantCents : null;
  const montantRestant = objectifMontantCents ? Math.max(0, objectifMontantCents - patrimoineNet) : 0;
  const ansEstimes = objectifMontantCents && capaciteEpargne > 0 ? montantRestant / (capaciteEpargne * 12) : null;

  return (
    <div className="indic-block">
      <div className="indic-title">Indicateurs calculés</div>
      <div className="indic-note">Recalculés automatiquement à partir de tes vraies données (Mon budget, patrimoine, emprunts)</div>

      {objectifMontantCents && objectifPct !== null && (
        <div className="stat-row">
          <div className="gauge-card">
            <ObjectifGauge pct={objectifPct} />
            <div className="gauge-text">
              <div className="hs-label">Objectif — {objectifLibelle || "ton rêve"} ({formatEuros(objectifMontantCents)})</div>
              <div className="gauge-foot">
                {objectifPct >= 1
                  ? "Objectif atteint 🎉"
                  : `Encore ${formatEuros(montantRestant)} à constituer${ansEstimes !== null ? ` — environ ${ansEstimes.toFixed(1)} an${ansEstimes >= 2 ? "s" : ""} au rythme d'épargne actuel` : " (renseigne ta capacité d'épargne pour estimer le délai)"}`}
              </div>
            </div>
          </div>
          <div className="hero-stat">
            <div className="hs-icon">📊</div>
            <div className="hs-label">Patrimoine net</div>
            <div className="hs-value" style={{ fontSize: 26 }}>{formatEuros(patrimoineNet)}</div>
            <div className="hs-foot">Actif − passif, détail plus bas</div>
          </div>
        </div>
      )}

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
        {!objectifMontantCents && (
          <div className="hero-stat">
            <div className="hs-icon">📊</div>
            <div className="hs-label">Patrimoine net</div>
            <div className="hs-value" style={{ fontSize: 26 }}>{formatEuros(patrimoineNet)}</div>
            <div className="hs-foot">Actif − passif, détail plus bas</div>
          </div>
        )}
        <div className={`hero-stat${tauxEndettement > 0.3 ? " warn-border" : ""}`}>
          <div className="hs-icon">🏦</div>
          <div className="hs-label">Capacité d&apos;emprunt — résidence principale</div>
          <div className="hs-value warn">≈ {formatEuros(capaciteEmpruntRP)}</div>
          <div className="hs-foot">À 20 ans, taux estimé 3,8 % — sans revenu locatif</div>
        </div>
        <div className={`hero-stat${tauxEndettement > 0.3 ? " warn-border" : ""}`}>
          <div className="hs-icon">🏦</div>
          <div className="hs-label">Capacité d&apos;emprunt — investissement locatif</div>
          <div className="hs-value warn">≈ {formatEuros(capaciteEmpruntLocatif)}</div>
          <div className="hs-foot">
            Idem + 70 % du loyer visé compté en revenus (règle bancaire)
            <LoyerViseForm loyerViseCents={loyerViseLocatifCents} />
          </div>
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
