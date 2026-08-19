export default function EstimatifTravauxPage() {
  return (
    <section className="section">
      <div className="crumb">Analyser un bien <b>› Investir › Estimatif des travaux</b></div>
      <h1>Estimatif des travaux</h1>
      <div className="pagesub">Objectif : ne jamais sous-évaluer une rénovation — ça plombe la rentabilité du projet</div>

      <div className="card">
        <h2>Estimatif des travaux <span className="tag">calculateur détaillé</span></h2>
        <div className="card-sub">Grille de prix 2026 construite à partir des données FFB, retours d&apos;artisans et plateformes spécialisées — calcul par pièce × type de travaux, à ajuster selon les devis réels</div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "16px 0 8px" }}>Repère global — prix moyen au m² selon le niveau de rénovation</div>
        <table>
          <thead><tr><th>Niveau</th><th>Contenu</th><th className="num">Prix moyen €/m²</th></tr></thead>
          <tbody>
            <tr><td>Rafraîchissement</td><td>Peinture, sols, petites retouches</td><td className="num">150 - 400 €</td></tr>
            <tr><td>Standard</td><td>+ cuisine, salle de bain, électricité partielle</td><td className="num">600 - 900 €</td></tr>
            <tr><td>Complet</td><td>+ isolation, menuiseries, tous corps d&apos;état</td><td className="num">900 - 1 500 €</td></tr>
            <tr><td>Lourd</td><td>+ reprises de structure, gros œuvre</td><td className="num">1 500 - 2 000 €</td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Île-de-France : +20 à 30 % sur main-d&apos;œuvre et matériaux. Bâti d&apos;avant 1970 : +15 à 25 % (imprévus structurels plus fréquents). Toujours prévoir une marge d&apos;aléas de 15-25 % — c&apos;est le principal facteur de sous-évaluation d&apos;un budget travaux.</div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "20px 0 8px" }}>Grille de prix de référence par type de travaux</div>

        <div className="cat-block"><div className="cat-title">Démolition et gros œuvre</div>
          <table><tbody>
            <tr><td>Dépose de cloison</td><td className="num">15 - 45 €/m²</td></tr>
            <tr><td>Ouverture mur porteur (avec étude IPN)</td><td className="num">2 800 - 5 500 € /forfait</td></tr>
            <tr><td>Évacuation gravats (benne 7 m³)</td><td className="num">350 - 600 € /forfait</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Électricité</div>
          <table><tbody><tr><td>Réfection complète (tableau + appareillage)</td><td className="num">90 - 140 €/m²</td></tr></tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Plomberie</div>
          <table><tbody>
            <tr><td>Réseau neuf, par point d&apos;eau créé</td><td className="num">800 - 1 500 € /point</td></tr>
            <tr><td>VMC double flux (fourniture + pose)</td><td className="num">3 500 - 6 000 € /forfait</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Isolation</div>
          <table><tbody>
            <tr><td>Combles perdus (soufflage)</td><td className="num">20 - 70 €/m²</td></tr>
            <tr><td>Combles aménageables (sous-rampants)</td><td className="num">50 - 250 €/m²</td></tr>
          </tbody></table>
          <div className="placeholder-note">Primes CEE mobilisables (jusqu&apos;à 13 €/m² en 2026) sous condition de recours à un artisan RGE — à déduire du coût réel si tu factures les travaux via la SCI.</div>
        </div>

        <div className="cat-block"><div className="cat-title">Cloisons et plafonds (placo)</div>
          <table><tbody>
            <tr><td>Cloison BA13 standard, tout compris</td><td className="num">20 - 40 €/m²</td></tr>
            <tr><td>Faux plafond</td><td className="num">30 - 70 €/m²</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Sols</div>
          <table><tbody>
            <tr><td>Réagréage (pose comprise)</td><td className="num">15 - 35 €/m²</td></tr>
            <tr><td>Parquet flottant</td><td className="num">45 - 85 €/m²</td></tr>
            <tr><td>Parquet massif</td><td className="num">90 - 160 €/m²</td></tr>
            <tr><td>Carrelage (grès cérame)</td><td className="num">60 - 130 €/m²</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Peinture et finitions</div>
          <table><tbody><tr><td>Peinture murs + plafond, tout compris</td><td className="num">35 - 70 €/m²</td></tr></tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Pièces techniques (forfaits)</div>
          <table><tbody>
            <tr><td>Salle de bain complète</td><td className="num">900 - 2 000 €/m² <span className="tag">soit 4 500-10 000 € pour 5 m²</span></td></tr>
            <tr><td>Cuisine — rafraîchissement</td><td className="num">2 000 - 5 000 € /forfait</td></tr>
            <tr><td>Cuisine — rénovation complète</td><td className="num">8 000 - 18 000 € /forfait</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Main-d&apos;œuvre horaire par corps de métier</div>
          <table><tbody>
            <tr><td>Peintre</td><td className="num">35 - 50 €/h</td></tr>
            <tr><td>Plaquiste</td><td className="num">35 - 60 €/h</td></tr>
            <tr><td>Plombier</td><td className="num">45 - 80 €/h</td></tr>
            <tr><td>Carreleur</td><td className="num">40 - 65 €/h</td></tr>
          </tbody></table>
        </div>

        <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)", marginTop: 6 }}>
          <b>Fonctionnalité prévue :</b> l&apos;appli pourra interroger le web périodiquement pour rafraîchir automatiquement cette grille de référence (prix matériaux, taux horaires artisans par région) plutôt que de rester figée sur les chiffres du jour de sa création — pour que tes estimations restent fiables dans la durée.
        </div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "22px 0 8px" }}>Calculateur — exemple pour un T3 à rénover entièrement</div>
        <table>
          <thead><tr><th>Pièce</th><th>Type de travaux</th><th className="num">Surface</th><th className="num">Prix/m² retenu</th><th className="num">Sous-total</th></tr></thead>
          <tbody>
            <tr><td>Séjour (22 m²)</td><td>Peinture</td><td className="num">22 m²</td><td className="num">50 €</td><td className="num">1 100 €</td></tr>
            <tr><td>Séjour (22 m²)</td><td>Parquet flottant</td><td className="num">22 m²</td><td className="num">65 €</td><td className="num">1 430 €</td></tr>
            <tr><td>Chambre 1 (12 m²)</td><td>Peinture + sol stratifié</td><td className="num">12 m²</td><td className="num">110 €</td><td className="num">1 320 €</td></tr>
            <tr><td>Chambre 2 (10 m²)</td><td>Peinture + sol stratifié</td><td className="num">10 m²</td><td className="num">110 €</td><td className="num">1 100 €</td></tr>
            <tr><td>Salle de bain (5 m²)</td><td>Rénovation complète</td><td className="num">5 m²</td><td className="num">1 400 €</td><td className="num">7 000 €</td></tr>
            <tr><td>Cuisine (9 m²)</td><td>Rénovation complète (forfait)</td><td className="num">—</td><td className="num">—</td><td className="num">12 000 €</td></tr>
            <tr><td>Ensemble du logement (58 m²)</td><td>Électricité — réfection complète</td><td className="num">58 m²</td><td className="num">115 €</td><td className="num">6 670 €</td></tr>
            <tr><td>Grenier (30 m²)</td><td>Isolation combles perdus</td><td className="num">30 m²</td><td className="num">45 €</td><td className="num">1 350 €</td></tr>
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--paper)" }}><td colSpan={5} style={{ padding: "10px 6px" }}><span className="addline">+ Ajouter une ligne (pièce → type de travaux → m²)</span></td></tr>
          </tfoot>
        </table>

        <div className="grid2" style={{ marginTop: 16 }}>
          <div className="card">
            <h2>Répartition par thématique</h2>
            <svg viewBox="0 0 280 175" width="100%" height="170">
              <g fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">
                <rect x="10" y="15" width="230" height="16" fill="#A8523A" /><text x="245" y="27">Cuisine — 12 000 €</text>
                <rect x="10" y="39" width="134" height="16" fill="#B98A2E" /><text x="149" y="51">SDB — 7 000 €</text>
                <rect x="10" y="63" width="128" height="16" fill="#5C7A5B" /><text x="143" y="75">Électricité — 6 670 €</text>
                <rect x="10" y="87" width="63" height="16" fill="#8B876F" /><text x="78" y="99">Sols — 3 300 €</text>
                <rect x="10" y="111" width="42" height="16" fill="#C7A98A" /><text x="57" y="123">Peinture — 2 200 €</text>
                <rect x="10" y="135" width="26" height="16" fill="#DEDACE" /><text x="41" y="147">Isolation — 1 350 €</text>
              </g>
            </svg>
            <div className="chart-caption">Barres proportionnelles au montant de chaque poste</div>
          </div>
          <div className="card">
            <h2>Synthèse</h2>
            <table><tbody>
              <tr><td>Surface totale rénovée</td><td className="num">58 m²</td></tr>
              <tr><td>Montant total travaux</td><td className="num"><b>32 570 €</b></td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Prix moyen de rénovation au m²</b></td><td className="num"><b>561 €/m²</b></td></tr>
            </tbody></table>
            <div className="placeholder-note">Ce niveau (561 €/m²) correspond à une rénovation &quot;standard&quot; selon la grille ci-dessus — cohérent pour un logement sans reprise de structure ni changement de menuiseries. Ajoute une ligne &quot;menuiseries&quot; ou &quot;isolation des murs&quot; si le DPE du bien l&apos;exige.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
