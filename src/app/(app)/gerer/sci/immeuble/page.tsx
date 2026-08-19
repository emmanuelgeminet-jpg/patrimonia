export default function ImmeublePage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Gérer mon parc › Par immeuble</b></div>
      <h1>13 rue des Cordeliers</h1>
      <div className="pagesub">45130 Meung-sur-Loire — 3 appartements + garage</div>
      <div className="kpis">
        <div className="kpi"><div className="label">Loyers annuels potentiels</div><div className="value">22 320 €</div></div>
        <div className="kpi"><div className="label">Rentabilité brute</div><div className="value">6,8 %</div></div>
        <div className="kpi"><div className="label">Rentabilité nette</div><div className="value">5,3 %</div></div>
        <div className="kpi"><div className="label">Rentabilité net-net</div><div className="value">3,1 %</div></div>
      </div>
      <div className="card">
        <h2>Répartition des charges 2025 <span className="tag">annuelle</span></h2>
        <svg viewBox="0 0 612 150" width="100%" height="145">
          <g fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">
            <rect x="20" y="20" width="500" height="16" fill="#A8523A" /><text x="530" y="32">Prêt — 13 034 €</text>
            <rect x="20" y="44" width="83" height="16" fill="#B98A2E" /><text x="112" y="56">Taxe foncière — 2 153 €</text>
            <rect x="20" y="68" width="137" height="16" fill="#5C7A5B" /><text x="166" y="80">Entretien — 2 025 €</text>
            <rect x="20" y="92" width="137" height="16" fill="#8B876F" /><text x="166" y="104">Eau/élec — 3 559 €</text>
            <rect x="20" y="116" width="19" height="16" fill="#DEDACE" /><text x="48" y="128">Assurance — 494 €</text>
          </g>
        </svg>
        <div className="chart-caption">Barres proportionnelles au montant annuel décaissé, hors travaux exceptionnels</div>
      </div>
      <div className="card">
        <h2>Fiche immeuble <span className="tag">squelette</span></h2>
        <div className="empty">
          <div className="big">À détailler</div>
          Caractéristiques du bien, historique d&apos;acquisition, prêt, travaux réalisés, DPE, copropriété/mono-propriété...
        </div>
      </div>
    </section>
  );
}
