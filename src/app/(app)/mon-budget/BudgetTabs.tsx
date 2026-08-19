"use client";

import { useState } from "react";

type TabKey = "1m" | "6m" | "1a" | "5a";

const TABS: { key: TabKey; label: string }[] = [
  { key: "1m", label: "1 mois" },
  { key: "6m", label: "6 mois" },
  { key: "1a", label: "1 an" },
  { key: "5a", label: "5 ans" },
];

export default function BudgetTabs() {
  const [active, setActive] = useState<TabKey>("1m");

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

      {active === "1m" && <Panel1Mois />}
      {active === "6m" && <Panel6Mois />}
      {active === "1a" && <PanelVide texte="Historique insuffisant" detail="2 mois importés sur 12. Continue à déposer tes relevés chaque mois pour débloquer cette vue — taux d'épargne annuel moyen, mois les plus dépensiers, saisonnalité (vacances, Noël, rentrée scolaire)." sous="Vue annuelle — se complète au fil des imports mensuels" />}
      {active === "5a" && <PanelVide texte="Historique insuffisant" detail="Cette vue prendra tout son sens après plusieurs années d'import : évolution du taux d'épargne, progression du patrimoine financier constitué, comparaison à l'inflation." sous="Vue long terme — évolution du taux d'épargne et constitution de patrimoine" />}
    </>
  );
}

function Panel1Mois() {
  return (
    <div>
      <div className="pagesub" style={{ marginBottom: 14 }}>
        21 février – 21 mars 2025 · reconstitué à partir de ton fichier, corrigé de deux erreurs de formule (détail plus bas)
      </div>

      <div className="kpis">
        <div className="kpi"><div className="label">Revenus du foyer</div><div className="value">3 825 €</div></div>
        <div className="kpi"><div className="label">Dépenses récurrentes</div><div className="value">2 988 €</div></div>
        <div className="kpi"><div className="label">Épargne + investissement</div><div className="value">950 €</div></div>
        <div className="kpi accent"><div className="label">Reste réel (avec exceptionnel)</div><div className="value">− 80 €</div></div>
      </div>

      <div className="placeholder-note" style={{ background: "var(--brick-soft)", color: "var(--brick)" }}>
        <b>Écart trouvé avec ton fichier d&apos;origine :</b> ta formule de &quot;Total dépenses variables&quot; (<code>=SUM(F2:F9)</code>) s&apos;arrêtait avant la ligne &quot;tabac&quot; et &quot;divers imprévus&quot;, qui n&apos;étaient donc jamais comptés. Résultat affiché sur ton fichier : + 38 € de reste en fin de mois. Résultat réel une fois toutes les lignes incluses : <b>− 80 €</b>. C&apos;est exactement le genre d&apos;écart silencieux qu&apos;une catégorisation automatique évite.
      </div>

      <div className="card">
        <h2>Répartition 50/30/20 <span className="tag">besoins / envies / épargne</span></h2>
        <svg viewBox="0 0 600 60" width="100%" height="56">
          <rect x="0" y="18" width="446" height="24" fill="#8B876F" />
          <rect x="446" y="18" width="87" height="24" fill="#C7A98A" />
          <rect x="533" y="18" width="248" height="24" fill="#5C7A5B" />
        </svg>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-soft)", marginTop: 4 }}>
          <span>● Besoins — 1 706 € (44,6 %)</span>
          <span>● Envies — 333 € (8,7 %)</span>
          <span>● Épargne / invest. — 950 € (24,8 %)</span>
        </div>
        <div className="placeholder-note">
          Répartition plus favorable que la référence classique 50/30/20 — vous épargnez plus et dépensez moins en envies que la moyenne. Le vrai point de vigilance n&apos;est pas la structure du budget, c&apos;est le poste &quot;imprévus&quot; (917 € ce mois-ci), qui mérite une provision mensuelle dédiée plutôt que de tomber en une fois.
        </div>
      </div>

      <div className="card">
        <h2>Détail par catégorie</h2>
        <table>
          <thead><tr><th>Catégorie</th><th className="num">Montant</th><th className="num">% du budget</th></tr></thead>
          <tbody>
            <tr><td>Alimentation</td><td className="num">670,82 €</td><td className="num">22,4 %</td></tr>
            <tr><td>Épargne programmée</td><td className="num">450,00 €</td><td className="num">15,1 %</td></tr>
            <tr><td>Investissement SCI</td><td className="num">500,00 €</td><td className="num">16,7 %</td></tr>
            <tr><td>Immobilier locatif (Ormes)</td><td className="num">328,71 €</td><td className="num">11,0 %</td></tr>
            <tr><td>Enfants</td><td className="num">240,00 €</td><td className="num">8,0 %</td></tr>
            <tr><td>Logement principal</td><td className="num">185,50 €</td><td className="num">6,2 %</td></tr>
            <tr><td>Loisirs &amp; plaisirs</td><td className="num">168,34 €</td><td className="num">5,6 %</td></tr>
            <tr><td>Impôts</td><td className="num">107,61 €</td><td className="num">3,6 %</td></tr>
            <tr><td>Assurances</td><td className="num">109,75 €</td><td className="num">3,7 %</td></tr>
            <tr><td>Transport</td><td className="num">96,52 €</td><td className="num">3,2 %</td></tr>
            <tr><td>Abonnements &amp; télécom</td><td className="num">75,46 €</td><td className="num">2,5 %</td></tr>
            <tr><td>Santé</td><td className="num">55,63 €</td><td className="num">1,9 %</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total récurrent</b></td><td className="num"><b>2 988,34 €</b></td><td className="num"><b>100 %</b></td></tr>
            <tr><td>Exceptionnel (LCNAS + imprimante)</td><td className="num">917,23 €</td><td className="num" style={{ color: "var(--brick)" }}>hors récurrent</td></tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2>Abonnements détectés <span className="tag">75,46 €/mois — 905 €/an</span></h2>
        <table>
          <tbody>
            <tr><td>Box internet</td><td className="num">30,99 €/mois</td></tr>
            <tr><td>Forfait mobile — Thérèse</td><td className="num">14,99 €/mois</td></tr>
            <tr><td>Forfait mobile — Emmanuel</td><td className="num">15,99 €/mois</td></tr>
            <tr><td>Netflix</td><td className="num">13,49 €/mois</td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">
          L&apos;IA repère automatiquement les prélèvements récurrents identiques d&apos;un mois sur l&apos;autre pour constituer cette liste — pratique pour repérer un abonnement oublié.
        </div>
      </div>
    </div>
  );
}

function Panel6Mois() {
  return (
    <div>
      <div className="pagesub" style={{ marginBottom: 14 }}>
        Seuls 2 mois sont importés pour l&apos;instant — tendance ci-dessous à titre indicatif, à affiner au fil des imports
      </div>
      <div className="card">
        <h2>Évolution revenus / dépenses</h2>
        <svg viewBox="0 0 500 170" width="100%" height="165">
          <line x1="20" y1="145" x2="480" y2="145" stroke="#DEDACE" />
          <polyline points="40,49 160,88" fill="none" stroke="#5C7A5B" strokeWidth="2.5" />
          <circle cx="40" cy="49" r="4" fill="#5C7A5B" /><circle cx="160" cy="88" r="4" fill="#5C7A5B" />
          <polyline points="40,79 160,120" fill="none" stroke="#A8523A" strokeWidth="2.5" strokeDasharray="5,3" />
          <circle cx="40" cy="79" r="4" fill="#A8523A" /><circle cx="160" cy="120" r="4" fill="#A8523A" />
          <text x="30" y="163" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">Fév-Mars</text>
          <text x="140" y="163" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">Mars-Avr</text>
          <text x="260" y="163" fontFamily="IBM Plex Mono" fontSize="9" fill="#C7C2B0">à venir...</text>
          <text x="350" y="60" fontFamily="IBM Plex Mono" fontSize="10" fill="#5C7A5B">Revenus</text>
          <text x="350" y="110" fontFamily="IBM Plex Mono" fontSize="10" fill="#A8523A">Dépenses</text>
        </svg>
        <div className="chart-caption">
          Baisse de revenu en mars-avril (salaire Manu 2 417 € au lieu de 2 671 €) largement compensée par une chute des dépenses variables — le mois de février-mars portait des imprévus exceptionnels non récurrents
        </div>
      </div>
    </div>
  );
}

function PanelVide({ texte, detail, sous }: { texte: string; detail: string; sous: string }) {
  return (
    <div>
      <div className="pagesub" style={{ marginBottom: 14 }}>{sous}</div>
      <div className="card">
        <div className="empty">
          <div className="big">{texte}</div>
          {detail}
        </div>
      </div>
    </div>
  );
}
