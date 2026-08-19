export default function AnalyserLeBienPage() {
  return (
    <section className="section">
      <div className="crumb">Analyser un bien <b>› Investir › Analyser le bien</b></div>
      <h1>Analyser le bien</h1>
      <div className="pagesub">Pour un bien à l&apos;étude, avant achat</div>

      <div className="card">
        <h2>Analyse globale du bien</h2>
        <div className="card-sub">Reconstituée à partir de ton fichier &quot;6 ACTIONS GESTION IDR&quot; — scénario réel (TKT CVLF)</div>
        <div className="form-row"><label>Adresse du bien</label><input placeholder="13 rue des Cordeliers, 45130 Meung-sur-Loire" defaultValue="13 rue des Cordeliers, 45130 Meung-sur-Loire" /></div>

        <div className="placeholder-note" style={{ marginBottom: 16 }}>
          Ton fichier compare deux scénarios (rénovation complète &quot;TKT CVLF&quot; vs &quot;sans cuisine&quot;), mais les colonnes sont décalées d&apos;une ligne par rapport aux libellés, ce qui rend la lecture peu fiable par endroits. J&apos;ai reconstitué ci-dessous le scénario réel (celui effectivement réalisé). On détaillera le second scénario une fois la structure clarifiée.
        </div>

        <div className="cat-block"><div className="cat-title">Bien</div>
          <table><tbody>
            <tr><td>Composition</td><td className="num">7 pièces — 150 m²</td></tr>
            <tr><td>Dépendances</td><td className="num">Garage à vélo, grand garage, cour intérieure, 2 rangements (20 m²), cave</td></tr>
            <tr><td>Surface assurable de l&apos;immeuble</td><td className="num">160 m²</td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Prix et négociation</div>
          <table><tbody>
            <tr><td>Prix de l&apos;annonce</td><td className="num">167 680 €</td></tr>
            <tr><td>Montant de l&apos;offre</td><td className="num">117 000 €</td></tr>
            <tr><td><b>Négociation obtenue</b></td><td className="num"><b>− 30,2 %</b></td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Coût total de l&apos;opération</div>
          <table><tbody>
            <tr><td>Montant de l&apos;offre</td><td className="num">117 000 €</td></tr>
            <tr><td>Frais de notaire</td><td className="num">13 579,37 €</td></tr>
            <tr><td>Travaux (rénovation complète)</td><td className="num">158 859,00 €</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total achat</b></td><td className="num"><b>289 438,37 €</b></td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Financement</div>
          <table><tbody>
            <tr><td>Apport (frais de notaire autofinancés)</td><td className="num">13 579,37 €</td></tr>
            <tr><td>Montant emprunté</td><td className="num">275 859,00 €</td></tr>
            <tr><td>Taux</td><td className="num">3,60 %</td></tr>
            <tr><td>Durée</td><td className="num">20 ans</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Mensualité</b></td><td className="num"><b>1 605,82 €</b></td></tr>
          </tbody></table>
        </div>

        <div className="cat-block"><div className="cat-title">Vision banque — capacité d&apos;emprunt</div>
          <table><tbody>
            <tr><td>Loyers HC mensuels (plein)</td><td className="num">2 130 €</td></tr>
            <tr><td>Pondération appliquée par les banques</td><td className="num">70 %</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Loyers retenus dans le calcul d&apos;endettement</b></td><td className="num"><b>1 491 €/mois</b></td></tr>
          </tbody></table>
          <div className="placeholder-note">
            En 2026, la quasi-totalité des banques ne retiennent que <b>70 % des loyers</b> (prévisionnels ou perçus) dans le calcul du taux d&apos;endettement — décote censée couvrir vacance locative, charges et impayés. À l&apos;inverse, 100 % de la nouvelle mensualité (1 606 €) s&apos;ajoute intégralement aux charges du foyer : c&apos;est ce qu&apos;on appelle l&apos;« effet ciseau ». Certaines banques (CIC, Crédit Mutuel, HSBC...) utilisent une méthode différentielle plus favorable pour les multi-biens — à vérifier avec ton courtier au cas par cas.
          </div>
        </div>

        <div className="cat-block"><div className="cat-title">Prix au m² — après achat et rénovation</div>
          <table><tbody>
            <tr><td>Coût total de l&apos;opération</td><td className="num">289 438,37 €</td></tr>
            <tr><td>Surface habitable</td><td className="num">150 m²</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Prix de revient net au m²</b></td><td className="num"><b>1 930 €/m²</b></td></tr>
          </tbody></table>
          <div className="placeholder-note">
            Comparé au marché local (MeilleursAgents, juin 2026) : prix moyen au m² des appartements à Meung-sur-Loire ≈ <b>1 711 €/m²</b> (fourchette 716-2 520 €). Ton prix de revient (1 930 €/m²) est cohérent avec un bien intégralement rénové — logiquement au-dessus de la moyenne brute du marché, mais dans la fourchette haute normale.<br /><br />
            Côté loyers : le marché local affiche un loyer moyen de <b>13,2 €/m²/mois</b> (fourchette 9,5-19,3 €). Ton loyer visé ressort à <b>14,2 €/m²/mois</b> (2 130 € ÷ 150 m²) — légèrement au-dessus de la moyenne, ce qui est cohérent avec un bien remis à neuf, et te donne un repère solide pour fixer ou ajuster tes loyers.
          </div>
        </div>

        <div className="cat-block"><div className="cat-title">Cashflow réel (avec crédit)</div>
          <table><tbody>
            <tr><td>Loyers HC annuels</td><td className="num">25 560 €</td></tr>
            <tr><td>Charges annuelles</td><td className="num">− 6 631 €</td></tr>
            <tr><td>Mensualité de crédit (annuelle)</td><td className="num">− 19 270 €</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Cashflow avant impôt</b></td><td className="num"><b>− 341 €/an</b></td></tr>
          </tbody></table>
          <div className="placeholder-note" style={{ background: "var(--brick-soft)", color: "var(--brick)" }}>
            Avec des charges complètes (gestion + provision travaux ajoutées), le cashflow ressort légèrement négatif — plus réaliste que les + 25 €/an du fichier initial, qui omettait ces deux postes. Ça ne remet pas en cause l&apos;investissement (l&apos;essentiel de l&apos;effort finance le capital, pas une perte), mais ça confirme qu&apos;il ne faut pas compter sur un excédent de trésorerie mensuel tant que le crédit court.
          </div>
        </div>

        <div className="cat-block"><div className="cat-title">Revenus locatifs</div>
          <table><tbody>
            <tr><td>T3 RDC (accès cour)</td><td className="num">650 € HC + 30 € charges</td></tr>
            <tr><td>T3 1er étage (accès cour)</td><td className="num">630 € HC + 30 € charges</td></tr>
            <tr><td>T2 2e étage</td><td className="num">570 € HC + 30 € charges</td></tr>
            <tr><td>Garage</td><td className="num">280 € HC + 20 € charges</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Loyers HC / mois (plein)</b></td><td className="num"><b>2 130 €</b></td></tr>
            <tr><td><b>Loyers HC / an (plein)</b></td><td className="num"><b>25 560 €</b></td></tr>
            <tr><td>Charges locatives récupérables / an</td><td className="num">1 320 €</td></tr>
          </tbody></table>
          <div className="placeholder-note">
            J&apos;ai corrigé une confusion du fichier source : la ligne &quot;TOTAL/AN AVEC CHARGES&quot; (26 880 €) mélangeait loyers HC et charges récupérables — or les charges sont neutres pour la rentabilité (reversées aux fournisseurs), donc le calcul doit se baser sur les <b>loyers HC seuls</b> (25 560 €), pas sur le total charges comprises. Écart avec le loyer réellement perçu en 2025 (9 197 €) : normal, l&apos;immeuble n&apos;était pas encore loué en totalité sur l&apos;exercice.
          </div>
        </div>

        <div className="cat-block"><div className="cat-title">Charges annuelles à la charge du propriétaire</div>
          <table><tbody>
            <tr><td>Taxe foncière</td><td className="num">1 800 €</td></tr>
            <tr><td>Assurance PNO immeuble (160 m² × 3,16 €/m²)</td><td className="num">505 €</td></tr>
            <tr><td>Comptable</td><td className="num">1 100 €</td></tr>
            <tr><td>Frais de gestion locative <span className="tag">estimé 7 % TTC</span></td><td className="num">1 882 €</td></tr>
            <tr><td>Provision entretien / gros travaux <span className="tag">estimé 5 % des loyers</span></td><td className="num">1 344 €</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total charges annuelles</b></td><td className="num"><b>6 631 €</b></td></tr>
          </tbody></table>
          <div className="placeholder-note">
            Le fichier ne renseignait ni frais de gestion ni provision travaux — je les ai estimés à partir des moyennes de marché actuelles (gestion locative : 5-8 % TTC des loyers encaissés selon les agences ; provision entretien/gros travaux : 5 % des loyers est une règle usuelle). À ajuster dès que tu as un vrai devis de gestionnaire. Non inclus dans le calcul principal, à titre de sensibilité : une <b>GLI</b> (garantie loyers impayés) coûterait environ 2 à 4 % des loyers (≈ 672 €/an à 2,5 %), et une <b>vacance locative</b> de 6 % (usuelle hors zone tendue) réduirait les loyers encaissés d&apos;environ 1 534 €/an.
          </div>
        </div>

        <div className="cat-block"><div className="cat-title">Rentabilité — méthodologie</div>
          <div className="placeholder-note" style={{ background: "var(--paper)", color: "var(--ink-soft)", marginBottom: 12 }}>
            <b>Brute</b> = Loyers HC annuels ÷ Prix d&apos;achat total (offre + notaire + travaux) &nbsp;·&nbsp;
            <b>Nette</b> = (Loyers HC − charges annuelles) ÷ Prix d&apos;achat total &nbsp;·&nbsp;
            <b>Net-net</b> = (Loyers HC − charges − IS estimé) ÷ Prix d&apos;achat total. Les intérêts d&apos;emprunt ne sont volontairement pas déduits ici : ils relèvent du financement, pas de la performance intrinsèque du bien (l&apos;effet de levier se lit séparément, via le cashflow).
          </div>
          <table><tbody>
            <tr><td>Prix d&apos;achat total (dénominateur)</td><td className="num">289 438,37 €</td></tr>
            <tr><td>Rentabilité brute</td><td className="num"><b>8,83 %</b></td></tr>
            <tr><td>Rentabilité nette</td><td className="num"><b>6,54 %</b></td></tr>
            <tr><td>IS estimé (taux réduit 15 %, simplifié)</td><td className="num">2 839 €</td></tr>
            <tr><td><b>Rentabilité net-net</b></td><td className="num"><b>5,56 %</b></td></tr>
          </tbody></table>
        </div>

        <div className="cat-block">
          <div className="card-sub" style={{ marginBottom: 8 }}>Brute / nette / net-net</div>
          <svg viewBox="0 0 400 175" width="100%" height="170">
            <line x1="30" y1="145" x2="380" y2="145" stroke="#DEDACE" strokeWidth="1" />
            <g fontFamily="IBM Plex Mono" fontSize="11" fill="#22261F">
              <rect x="55" y="25" width="60" height="120" fill="#A8523A" />
              <text x="60" y="20">8,83 %</text>
              <text x="62" y="160" fontSize="10" fill="#5B5F53">Brute</text>

              <rect x="170" y="56" width="60" height="89" fill="#B98A2E" />
              <text x="175" y="51">6,54 %</text>
              <text x="172" y="160" fontSize="10" fill="#5B5F53">Nette</text>

              <rect x="285" y="69" width="60" height="76" fill="#5C7A5B" />
              <text x="286" y="64">5,56 %</text>
              <text x="272" y="160" fontSize="10" fill="#5B5F53">Net-net</text>
            </g>
          </svg>
          <div className="chart-caption">Écart de 3,3 points entre brut et net-net — cohérent avec les repères de marché (1 à 2,5 pts brut/net pour un immeuble avec charges de copropriété, ici accentué par la gestion déléguée et la provision travaux)</div>
        </div>

        <div className="cat-block">
          <div className="card-sub" style={{ marginBottom: 2 }}>Cashflow annuel — années 1 à 20 (pendant le crédit)</div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8 }}>Loyers indexés IRL (+1,15 %/an) − charges (+2 %/an) − mensualité de crédit constante</div>
          <svg viewBox="0 0 620 190" width="100%" height="185">
            <line x1="15" y1="145" x2="605" y2="145" stroke="#8B876F" strokeWidth="1" />
            <rect x="20" y="145.0" width="24" height="12.3" fill="#A8523A" />
            <rect x="48" y="145.0" width="24" height="6.5" fill="#A8523A" />
            <rect x="76" y="145.0" width="24" height="0.6" fill="#A8523A" />
            <rect x="104" y="139.8" width="24" height="5.2" fill="#5C7A5B" />
            <rect x="132" y="133.9" width="24" height="11.1" fill="#5C7A5B" />
            <rect x="160" y="128.0" width="24" height="17.0" fill="#5C7A5B" />
            <rect x="188" y="122.0" width="24" height="23.0" fill="#5C7A5B" />
            <rect x="216" y="116.1" width="24" height="28.9" fill="#5C7A5B" />
            <rect x="244" y="110.1" width="24" height="34.9" fill="#5C7A5B" />
            <rect x="272" y="104.1" width="24" height="40.9" fill="#5C7A5B" />
            <rect x="300" y="98.1" width="24" height="46.9" fill="#5C7A5B" />
            <rect x="328" y="92.0" width="24" height="53.0" fill="#5C7A5B" />
            <rect x="356" y="86.0" width="24" height="59.0" fill="#5C7A5B" />
            <rect x="384" y="79.9" width="24" height="65.1" fill="#5C7A5B" />
            <rect x="412" y="73.8" width="24" height="71.2" fill="#5C7A5B" />
            <rect x="440" y="67.7" width="24" height="77.3" fill="#5C7A5B" />
            <rect x="468" y="61.5" width="24" height="83.5" fill="#5C7A5B" />
            <rect x="496" y="55.4" width="24" height="89.6" fill="#5C7A5B" />
            <rect x="524" y="49.2" width="24" height="95.8" fill="#5C7A5B" />
            <rect x="552" y="43.0" width="24" height="102.0" fill="#5C7A5B" />
            <g fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">
              <text x="32" y="178" textAnchor="middle">An 1</text>
              <text x="144" y="178" textAnchor="middle">An 5</text>
              <text x="284" y="178" textAnchor="middle">An 10</text>
              <text x="424" y="178" textAnchor="middle">An 15</text>
              <text x="564" y="178" textAnchor="middle">An 20</text>
            </g>
            <text x="20" y="18" fontFamily="IBM Plex Mono" fontSize="10" fill="var(--brick)">− 341 € (an 1)</text>
            <text x="450" y="35" fontFamily="IBM Plex Mono" fontSize="10" fill="var(--sage)">+ 2 832 € (an 20)</text>
          </svg>
          <div className="chart-caption">Le cashflow annuel redevient positif dès l&apos;<b>année 4</b> (+145 €) et croît chaque année ensuite — l&apos;effort d&apos;épargne le plus lourd est concentré sur les 3 premières années</div>
        </div>

        <div className="cat-block">
          <div className="card-sub" style={{ marginBottom: 2 }}>Coût cumulé vs revenu cumulé — sur 25 ans</div>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 8 }}>Ce que le bien te rapporte (loyers cumulés) comparé à ce qu&apos;il te coûte (charges + mensualités cumulées)</div>
          <svg viewBox="0 0 620 195" width="100%" height="190">
            <line x1="15" y1="170" x2="605" y2="170" stroke="#8B876F" strokeWidth="1" />
            <polyline points="20.0,164.9 44.2,159.7 68.3,154.5 92.5,149.2 116.7,143.8 140.8,138.4 165.0,133.0 189.2,127.4 213.3,121.8 237.5,116.2 261.7,110.4 285.8,104.6 310.0,98.8 334.2,92.8 358.3,86.8 382.5,80.8 406.7,74.6 430.8,68.4 455.0,62.1 479.2,55.8 503.3,49.4 527.5,42.9 551.7,36.3 575.8,29.6 600.0,22.9" fill="none" stroke="#5C7A5B" strokeWidth="2.5" />
            <polyline points="20.0,164.8 44.2,159.6 68.3,154.4 92.5,149.1 116.7,143.8 140.8,138.5 165.0,133.2 189.2,127.8 213.3,122.4 237.5,116.9 261.7,111.5 285.8,106.0 310.0,100.4 334.2,94.9 358.3,89.3 382.5,83.6 406.7,77.9 430.8,72.2 455.0,66.5 479.2,60.7 503.3,58.7 527.5,56.7 551.7,54.7 575.8,52.6 600.0,50.4" fill="none" stroke="#A8523A" strokeWidth="2.5" strokeDasharray="5,3" />
            <circle cx="140.8" cy="138.4" r="4" fill="var(--ink)" />
            <text x="148" y="128" fontFamily="IBM Plex Mono" fontSize="10" fill="var(--ink)">An 6 — les courbes se croisent</text>
            <line x1="140.8" y1="20" x2="140.8" y2="170" stroke="var(--ink)" strokeWidth="1" strokeDasharray="2,3" opacity="0.4" />
            <g fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">
              <text x="20" y="183">An 1</text><text x="140" y="183">An 6</text><text x="238" y="183">An 10</text>
              <text x="358" y="183">An 15</text><text x="479" y="183">An 20</text><text x="580" y="183">An 25</text>
            </g>
            <text x="440" y="45" fontFamily="IBM Plex Mono" fontSize="10" fill="#5C7A5B">Loyers cumulés : 735 473 €</text>
            <text x="440" y="90" fontFamily="IBM Plex Mono" fontSize="10" fill="#A8523A">Coûts cumulés : 597 790 €</text>
          </svg>
          <div className="chart-caption">Trait plein vert = loyers cumulés · trait pointillé brique = charges + mensualités cumulées. Le crédit soldé en année 20 fait décrocher les deux courbes : les coûts se stabilisent (plus de mensualité), les loyers continuent de grimper.</div>
        </div>

        <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)" }}>
          <b>Réponse directe à tes questions :</b> l&apos;effort d&apos;épargne dure environ <b>3 ans</b> (le point bas du cumul est en année 3, à − 538 €), le cashflow annuel devient positif dès l&apos;<b>année 4</b>, et l&apos;investissement &quot;rembourse&quot; totalement l&apos;effort cumulé des 3 premières années dès l&apos;<b>année 6</b>. À aucun moment après ça la courbe ne se réinverse — le bien ne redevient jamais plus coûteux qu&apos;il ne rapporte, et l&apos;écart s&apos;accélère nettement après l&apos;année 20 (fin de crédit). Sur 25 ans : + 137 683 € de solde cumulé net.
        </div>

        <div className="cat-block">
          <div className="card-sub" style={{ marginBottom: 8 }}>Évolution des loyers HC annuels — réalisé 2025 puis projection avec indexation IRL (+1,15 %/an, IRL T2 2026)</div>
          <svg viewBox="0 0 460 175" width="100%" height="170">
            <line x1="0" y1="150" x2="460" y2="150" stroke="#DEDACE" strokeWidth="1" />
            <g fontFamily="IBM Plex Mono" fontSize="9.5" fill="#22261F">
              <rect x="20" y="114" width="48" height="36" fill="#DEDACE" /><text x="10" y="110">9 197 €</text><text x="24" y="163" fill="#5B5F53">2025*</text>
              <rect x="90" y="24" width="48" height="126" fill="#A8523A" /><text x="80" y="20">25 560 €</text><text x="98" y="163" fill="#5B5F53">2026</text>
              <rect x="160" y="21" width="48" height="129" fill="#A8523A" opacity="0.85" /><text x="150" y="17">25 867 €</text><text x="168" y="163" fill="#5B5F53">2027</text>
              <rect x="230" y="18" width="48" height="132" fill="#A8523A" opacity="0.85" /><text x="220" y="14">26 178 €</text><text x="238" y="163" fill="#5B5F53">2028</text>
              <rect x="300" y="15" width="48" height="135" fill="#A8523A" opacity="0.7" /><text x="290" y="11">26 492 €</text><text x="308" y="163" fill="#5B5F53">2029</text>
              <rect x="370" y="12" width="48" height="138" fill="#A8523A" opacity="0.7" /><text x="360" y="8">26 810 €</text><text x="378" y="163" fill="#5B5F53">2030</text>
            </g>
          </svg>
          <div className="chart-caption">*2025 : loyers réels, immeuble loué progressivement (RDC entré en novembre) — 2026 : première année pleine, 3 lots + garage loués toute l&apos;année</div>
        </div>
      </div>

      <div className="card">
        <h2>Ce qui manque encore pour une analyse pleinement professionnelle</h2>
        <div className="empty" style={{ textAlign: "left", padding: "10px 4px" }}>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9, fontSize: 12.5, color: "var(--ink)" }}>
            <li>Devis réel de gestionnaire (le 7 % utilisé est une moyenne de marché, pas un tarif négocié)</li>
            <li>Choix définitif sur la GLI (à intégrer ou non selon ta tolérance au risque d&apos;impayé)</li>
            <li>Comparaison au prix du marché local (€/m²) pour objectiver la négociation de 30 %</li>
            <li>Estimation de revalorisation à la revente et TRI (taux de rendement interne) sur la durée de détention</li>
            <li>IS net-net affiné avec l&apos;expert-comptable une fois le résultat fiscal stabilisé hors phase travaux (le taux réduit 15 % suppose un résultat sous 42 500 €)</li>
            <li>Second scénario &quot;sans cuisine&quot; du fichier original, à reprendre une fois la structure des colonnes clarifiée avec toi</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
