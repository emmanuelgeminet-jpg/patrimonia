export default function VisionGlobalePage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Gérer mon parc › Vision globale</b></div>
      <h1>Vision globale</h1>
      <div className="pagesub">Tous vos biens — trésorerie, rentabilité, comptes associés</div>

      <div className="kpis">
        <div className="kpi"><div className="label">Solde bancaire SCI</div><div className="value">1 166,00 €</div><div className="sub">au 31 décembre 2025</div></div>
        <div className="kpi"><div className="label">Loyers encaissés</div><div className="value">9 197,16 €</div><div className="sub">exercice 2025, hors charges</div></div>
        <div className="kpi"><div className="label">Charges décaissées</div><div className="value">17 931,17 €</div><div className="sub">exercice 2025</div></div>
        <div className="kpi"><div className="label">Dette SCI → associés</div><div className="value">39 932,16 €</div><div className="sub">GEMINET 19 825 € + PAPIN 20 107 €</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Trésorerie <span className="tag">solde en fin de mois — 2025</span></h2>
          <svg viewBox="0 0 612 155" width="100%" height="150">
            <line x1="0" y1="150" x2="612" y2="150" stroke="#DEDACE" strokeWidth="1" />
            <path d="M20,92.4 L72,84.1 L124,55.8 L176,105.3 L228,23.9 L280,97.4 L332,114.5 L384,133.2 L436,122.7 L488,22.2 L540,98.3 L592,102.6 L592,150 L20,150 Z" fill="#A8523A" opacity="0.08" />
            <polyline points="20,92.4 72,84.1 124,55.8 176,105.3 228,23.9 280,97.4 332,114.5 384,133.2 436,122.7 488,22.2 540,98.3 592,102.6" fill="none" stroke="#A8523A" strokeWidth="2" />
            <g fill="#A8523A">
              <circle cx="20" cy="92.4" r="2.5" /><circle cx="72" cy="84.1" r="2.5" /><circle cx="124" cy="55.8" r="2.5" /><circle cx="176" cy="105.3" r="2.5" />
              <circle cx="228" cy="23.9" r="2.5" /><circle cx="280" cy="97.4" r="2.5" /><circle cx="332" cy="114.5" r="2.5" /><circle cx="384" cy="133.2" r="2.5" />
              <circle cx="436" cy="122.7" r="2.5" /><circle cx="488" cy="22.2" r="2.5" /><circle cx="540" cy="98.3" r="2.5" /><circle cx="592" cy="102.6" r="2.5" />
            </g>
            <g fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">
              <text x="14" y="163">Jan</text><text x="66" y="163">Fév</text><text x="115" y="163">Mar</text><text x="167" y="163">Avr</text>
              <text x="220" y="163">Mai</text><text x="273" y="163">Juin</text><text x="325" y="163">Juil</text><text x="374" y="163">Août</text>
              <text x="425" y="163">Sep</text><text x="478" y="163">Oct</text><text x="530" y="163">Nov</text><text x="580" y="163">Déc</text>
            </g>
          </svg>
          <div className="chart-caption">Données réelles issues du journal 2025 — pic en octobre après déblocages de prêt travaux</div>
        </div>

        <div className="card">
          <h2>Rentabilité nette <span className="tag">par appartement</span></h2>
          <svg viewBox="0 0 260 155" width="100%" height="150">
            <g fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">
              <rect x="20" y="98" width="34" height="52" fill="#5C7A5B" /><text x="20" y="94">6,2%</text><text x="14" y="168" fontSize="9" fill="#5B5F53">RDC</text>
              <rect x="90" y="105" width="34" height="45" fill="#5C7A5B" /><text x="90" y="101">5,8%</text><text x="76" y="168" fontSize="9" fill="#5B5F53">1er ét.</text>
              <rect x="160" y="88" width="34" height="62" fill="#5C7A5B" /><text x="160" y="84">6,9%</text><text x="148" y="168" fontSize="9" fill="#5B5F53">2e ét.</text>
              <rect x="230" y="148" width="34" height="2" fill="#DEDACE" /><text x="222" y="144" fill="#5B5F53">0%</text><text x="212" y="168" fontSize="9" fill="#5B5F53">Garage</text>
            </g>
          </svg>
          <div className="chart-caption">Estimation — à recaler une fois les valeurs vénales des lots renseignées</div>
        </div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Appartements</h2>
          <table>
            <thead><tr><th>Lot</th><th>Locataire</th><th>Statut</th><th className="num">Loyer HC</th></tr></thead>
            <tbody>
              <tr><td>RDC</td><td>Sophie Noiraud</td><td><span className="pill ok">Payé</span></td><td className="num">650,00 €</td></tr>
              <tr><td>1er étage</td><td>Delphine Gruet</td><td><span className="pill warn">Partiel</span></td><td className="num">650,00 €</td></tr>
              <tr><td>2e étage</td><td>Léa Verdier</td><td><span className="pill due">En attente</span></td><td className="num">580,00 €</td></tr>
              <tr><td>Garage</td><td>—</td><td><span className="pill vac">Vacant</span></td><td className="num">—</td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Comptes courants associés</h2>
          <table>
            <tbody>
              <tr><td>Foyer GEMINET</td><td className="num">19 825,07 €</td></tr>
              <tr><td>Foyer PAPIN</td><td className="num">20 107,09 €</td></tr>
            </tbody>
          </table>
          <div className="placeholder-note">Détail apports / avances / remboursements → onglet Comptes courants</div>
        </div>
      </div>
    </section>
  );
}
