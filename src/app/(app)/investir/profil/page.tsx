function SousTotalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rentab-row total">
      <div className="lbl">{label}</div>
      <div className="val">{value}</div>
    </div>
  );
}

function CatBlock({
  title,
  rows,
}: {
  title: string;
  rows: { label: string; value: string }[];
}) {
  return (
    <div className="cat-block">
      <div className="cat-title">{title}</div>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td className="num">{r.value}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ background: "var(--paper)" }}>
            <td colSpan={2} style={{ padding: 6 }}>
              <span className="addline">+ Ajouter une ligne</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function ProfilInvestisseurPage() {
  return (
    <section className="section">
      <div className="crumb">Analyser un bien <b>› Profil investisseur</b></div>
      <h1>Profil investisseur</h1>
      <div className="pagesub">Foyer GEMINET (Emmanuel + Thérèse) — communauté d&apos;acquêts</div>

      <div className="indic-block">
        <div className="indic-title">Indicateurs calculés</div>
        <div className="indic-note">Recalculés automatiquement à partir des réponses saisies ci-dessous</div>

        <div className="stat-row">
          <div className="gauge-card">
            <svg className="gauge-svg" viewBox="0 0 140 72">
              <path d="M 15,70 A 55,55 0 0,1 125,70" fill="none" stroke="rgba(255,255,255,.15)" strokeWidth="14" strokeLinecap="round" />
              <path d="M 15,70 A 55,55 0 0,1 87.0,17.7" fill="none" stroke="#8FB88D" strokeWidth="14" strokeLinecap="round" />
              <line x1="114.3" y1="51.6" x2="129.1" y2="45.5" stroke="#E0B15C" strokeWidth="3" strokeLinecap="round" />
              <text x="70" y="66" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="20" fontWeight="600" fill="#8FB88D">24%</text>
            </svg>
            <div className="gauge-text">
              <div className="hs-label">Taux d&apos;endettement</div>
              <div className="gauge-foot">Limite HCSF <b style={{ color: "#E0B15C" }}>35 %</b> — marge de 11 points</div>
            </div>
          </div>

          <div className="hero-stat">
            <div className="hs-icon">💶</div>
            <div className="hs-label">Capacité d&apos;épargne / mois</div>
            <div className="hs-value good">+ 640 €</div>
            <div className="hs-foot">Revenus − charges − mensualités</div>
          </div>
        </div>

        <div className="stat-row">
          <div className="hero-stat">
            <div className="hs-icon">🏠</div>
            <div className="hs-label">Reste à vivre</div>
            <div className="hs-value good">1 480 €</div>
            <div className="hs-foot">Après charges et crédits</div>
          </div>
          <div className="hero-stat">
            <div className="hs-icon">📊</div>
            <div className="hs-label">Patrimoine net</div>
            <div className="hs-value">157 536 €</div>
            <div className="hs-foot">Actif − passif, détail plus bas</div>
          </div>
          <div className="hero-stat warn-border">
            <div className="hs-icon">🏦</div>
            <div className="hs-label">Capacité d&apos;emprunt résiduelle</div>
            <div className="hs-value warn">≈ 96 000 €</div>
            <div className="hs-foot">À 20 ans, taux estimé 3,8 %</div>
          </div>
          <div className="hero-stat">
            <div className="hs-icon">💰</div>
            <div className="hs-label">Apport mobilisable</div>
            <div className="hs-value">18 500 €</div>
            <div className="hs-foot">Épargne dispo hors précaution</div>
          </div>
        </div>

        <div className="pill-row">
          <div className="pill-stat"><span className="ps-dot" /><span className="ps-label">Horizon</span><span className="ps-value">Long terme</span></div>
          <div className="pill-stat warn"><span className="ps-dot" /><span className="ps-label">Appétence au risque</span><span className="ps-value">Équilibrée</span></div>
        </div>

        <div className="synthese">
          <span className="badge">Profil favorable</span>
          <p>Capacité d&apos;épargne positive, endettement maîtrisé avec 11 points de marge sous le seuil HCSF, et un apport mobilisable qui couvre les frais de notaire d&apos;un bien jusqu&apos;à environ 155 000 €.</p>
        </div>
      </div>

      <div className="card">
        <h2>1. Situation du foyer</h2>
        <div className="form-row"><label>Composition du foyer</label>
          <select defaultValue="Couple marié"><option>Couple marié</option><option>Couple pacsé</option><option>Concubinage</option><option>Personne seule</option></select>
        </div>
        <div className="form-row"><label>Régime matrimonial</label>
          <select defaultValue="Communauté d'acquêts"><option>Communauté d&apos;acquêts</option><option>Séparation de biens</option><option>Communauté universelle</option><option>Participation aux acquêts</option></select>
        </div>
        <div className="form-row"><label>Donation entre époux</label>
          <select defaultValue="Oui"><option>Oui</option><option>Non</option></select>
        </div>
        <div className="form-row"><label>Nombre d&apos;enfants à charge</label><input placeholder="0" /></div>
        <div className="form-row"><label>Âge des deux conjoints</label><input placeholder="32 ans / 29 ans" /></div>
        <div className="form-row"><label>Situation professionnelle</label><input placeholder="Gendarme / Secrétaire" /></div>
      </div>

      <div className="card">
        <h2>2. Objectifs et profil d&apos;investisseur</h2>
        <div className="form-row"><label>Horizon d&apos;investissement</label>
          <select defaultValue="Court terme (< 5 ans)"><option>Court terme (&lt; 5 ans)</option><option>Moyen terme (5-10 ans)</option><option>Long terme (10 ans et +)</option></select>
        </div>
        <div className="form-row"><label>Objectif principal</label>
          <select defaultValue="Revenus complémentaires"><option>Revenus complémentaires</option><option>Constitution de patrimoine</option><option>Transmission</option><option>Réduction d&apos;impôt</option><option>Résidence future</option></select>
        </div>
        <div className="form-row"><label>Appétence au risque</label>
          <select defaultValue="Prudente"><option>Prudente</option><option>Équilibrée</option><option>Dynamique</option></select>
        </div>
        <div className="form-row"><label>Capacité à mobiliser un apport</label>
          <select defaultValue="Oui, sans difficulté"><option>Oui, sans difficulté</option><option>Oui, avec effort</option><option>Non, financement 110%</option></select>
        </div>
        <div className="form-row"><label>Épargne de précaution souhaitée</label><input placeholder="6 mois de charges — ex : 5 000 €" /></div>
      </div>

      <div className="card">
        <h2>3. Budget mensuel — Revenus</h2>
        <div className="form-row"><label>Salaire net — Emmanuel</label><input placeholder="1 850 €" /></div>
        <div className="form-row"><label>Salaire net — Thérèse</label><input placeholder="1 800 €" /></div>
        <div className="form-row"><label>Revenus indépendants (BIC/BNC)</label><input placeholder="0 €" /></div>
        <div className="form-row"><label>Revenus fonciers nets (hors SCI)</label><input placeholder="0 €" /></div>
        <div className="form-row"><label>Dividendes / revenus de capitaux</label><input placeholder="0 €" /></div>
        <div className="form-row"><label>Pensions, retraites perçues</label><input placeholder="0 €" /></div>
        <div className="form-row"><label>Prestations familiales (CAF)</label><input placeholder="0 €" /></div>
        <div className="form-row"><label>Autres revenus réguliers</label><input placeholder="0 €" /></div>
      </div>

      <div className="card">
        <h2>4. Budget mensuel — Charges</h2>
        <div className="card-sub">Chaque thématique se détaille en plusieurs lignes (ex : un forfait par personne)</div>

        <CatBlock title="Logement" rows={[
          { label: "Loyer / charges copropriété", value: "0 €" },
          { label: "Assurance habitation", value: "210 €" },
          { label: "Entretien courant", value: "680 €" },
        ]} />
        <SousTotalRow label="Sous-total Logement" value="890 €" />

        <CatBlock title="Alimentation" rows={[
          { label: "Courses", value: "420 €" },
          { label: "Cantine scolaire", value: "30 €" },
        ]} />
        <SousTotalRow label="Sous-total Alimentation" value="450 €" />

        <CatBlock title="Télécommunications" rows={[
          { label: "Box internet", value: "35 €" },
          { label: "Forfait mobile — Thérèse", value: "18 €" },
          { label: "Forfait mobile — Emmanuel", value: "17 €" },
        ]} />
        <SousTotalRow label="Sous-total Télécommunications" value="70 €" />

        <CatBlock title="Santé" rows={[
          { label: "Mutuelle — foyer", value: "75 €" },
          { label: "Frais médicaux non remboursés", value: "15 €" },
        ]} />
        <SousTotalRow label="Sous-total Santé" value="90 €" />

        <CatBlock title="Transport" rows={[
          { label: "Carburant", value: "180 €" },
          { label: "Assurance auto", value: "65 €" },
          { label: "Entretien véhicule", value: "55 €" },
          { label: "Transports en commun", value: "40 €" },
        ]} />
        <SousTotalRow label="Sous-total Transport" value="340 €" />

        <CatBlock title="Enfants" rows={[
          { label: "Scolarité / cantine", value: "120 €" },
          { label: "Activités extrascolaires", value: "80 €" },
          { label: "Garde", value: "80 €" },
        ]} />
        <SousTotalRow label="Sous-total Enfants" value="280 €" />

        <CatBlock title="Loisirs, vacances, restaurants" rows={[
          { label: "Restaurants / sorties", value: "120 €" },
          { label: "Vacances (provision mensuelle)", value: "140 €" },
        ]} />
        <SousTotalRow label="Sous-total Loisirs" value="260 €" />

        <CatBlock title="Vêtements" rows={[{ label: "Foyer", value: "60 €" }]} />
        <SousTotalRow label="Sous-total Vêtements" value="60 €" />

        <CatBlock title="Abonnements divers" rows={[
          { label: "Streaming (vidéo, musique)", value: "18 €" },
          { label: "Salle de sport", value: "12 €" },
        ]} />
        <SousTotalRow label="Sous-total Abonnements" value="30 €" />

        <CatBlock title="Crédits en cours (hors immobilier SCI)" rows={[{ label: "Crédit résidence principale", value: "720 €" }]} />
        <SousTotalRow label="Sous-total Crédits" value="720 €" />

        <CatBlock title="Impôts" rows={[{ label: "Impôt sur le revenu (mensualisé)", value: "310 €" }]} />
        <SousTotalRow label="Sous-total Impôts" value="310 €" />

        <CatBlock title="Assurances vie / prévoyance" rows={[
          { label: "Prévoyance — Emmanuel", value: "25 €" },
          { label: "Prévoyance — Thérèse", value: "20 €" },
        ]} />
        <SousTotalRow label="Sous-total Assurances" value="45 €" />

        <div className="cat-block">
          <div className="cat-title">Pensions versées</div>
          <table>
            <tbody><tr><td colSpan={2} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune pension versée</td></tr></tbody>
            <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={2} style={{ padding: 6 }}><span className="addline">+ Ajouter une ligne</span></td></tr></tfoot>
          </table>
        </div>
        <SousTotalRow label="Sous-total Pensions" value="0 €" />

        <CatBlock title="Épargne régulière déjà en cours" rows={[
          { label: "Virement mensuel Livret A", value: "100 €" },
          { label: "Versement programmé assurance-vie", value: "50 €" },
        ]} />
        <SousTotalRow label="Sous-total Épargne" value="150 €" />

        <div className="cat-block">
          <div className="cat-title">Frais professionnels non remboursés</div>
          <table>
            <tbody><tr><td colSpan={2} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucun frais renseigné</td></tr></tbody>
            <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={2} style={{ padding: 6 }}><span className="addline">+ Ajouter une ligne</span></td></tr></tfoot>
          </table>
        </div>
        <SousTotalRow label="Sous-total Frais pro" value="0 €" />

        <CatBlock title="Cotisations diverses" rows={[{ label: "Association / club", value: "20 €" }]} />
        <SousTotalRow label="Sous-total Cotisations" value="20 €" />

        <div className="cat-block">
          <div className="cat-title">Autres charges</div>
          <table>
            <tbody><tr><td colSpan={2} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucune autre charge</td></tr></tbody>
            <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={2} style={{ padding: 6 }}><span className="addline">+ Ajouter une ligne</span></td></tr></tfoot>
          </table>
        </div>
        <SousTotalRow label="Sous-total Autres" value="0 €" />

        <div className="total-row" style={{ paddingTop: 14, marginTop: 10, borderTop: "1px solid var(--ink)" }}>
          <span>Total charges mensuelles</span>
          <span className="amt neg" style={{ fontSize: 16 }}>3 715 €</span>
        </div>
      </div>

      <div className="card">
        <h2>5. Patrimoine immobilier</h2>
        <div className="form-row"><label>Résidence principale — valeur estimée</label><input placeholder="285 000 €" /></div>
        <div className="form-row"><label>Résidence secondaire — valeur estimée</label><input placeholder="0 €" /></div>
        <div className="form-row"><label>Biens locatifs en nom propre — valeur</label><input placeholder="0 €" /></div>
        <div className="form-row"><label>Parts de SCI — % de détention du foyer</label><input placeholder="50 % (25 % + 25 %)" /></div>
        <div className="form-row"><label>SCPI — valeur estimée</label><input placeholder="22 000 €" /></div>
      </div>

      <div className="card">
        <h2>6. Patrimoine financier</h2>
        <div className="card-sub">Plusieurs lignes possibles par catégorie (ex : assurances-vie dans différents établissements)</div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "14px 0 8px" }}>Livrets</div>
        <table>
          <thead><tr><th>Établissement</th><th>Type</th><th>Titulaire</th><th className="num">Solde</th></tr></thead>
          <tbody>
            <tr><td>Crédit Agricole</td><td>Livret A</td><td>Emmanuel</td><td className="num">5 200 €</td></tr>
            <tr><td>Boursorama</td><td>LDDS</td><td>Thérèse</td><td className="num">2 800 €</td></tr>
          </tbody>
          <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={4} style={{ padding: "8px 6px" }}><span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter un livret</span></td></tr></tfoot>
        </table>
        <div className="rentab-row total" style={{ marginBottom: 14 }}><div className="lbl">Sous-total Livrets</div><div className="val">8 000 €</div></div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "14px 0 8px" }}>PEA</div>
        <table>
          <thead><tr><th>Établissement</th><th>Titulaire</th><th className="num">Valeur</th></tr></thead>
          <tbody><tr><td colSpan={3} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucun PEA renseigné</td></tr></tbody>
          <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={3} style={{ padding: "8px 6px" }}><span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter un PEA</span></td></tr></tfoot>
        </table>
        <div className="rentab-row total" style={{ marginBottom: 14 }}><div className="lbl">Sous-total PEA</div><div className="val">0 €</div></div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "14px 0 8px" }}>Assurances-vie</div>
        <table>
          <thead><tr><th>Assureur</th><th>Contrat</th><th>Titulaire</th><th className="num">Valeur</th></tr></thead>
          <tbody>
            <tr><td>Generali</td><td>Contrat Épargne Avenir</td><td>Emmanuel</td><td className="num">6 500 €</td></tr>
            <tr><td>BNP Paribas Cardif</td><td>Multiplacements</td><td>Thérèse</td><td className="num">4 000 €</td></tr>
          </tbody>
          <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={4} style={{ padding: "8px 6px" }}><span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter une assurance-vie</span></td></tr></tfoot>
        </table>
        <div className="rentab-row total" style={{ marginBottom: 14 }}><div className="lbl">Sous-total Assurances-vie</div><div className="val">10 500 €</div></div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "14px 0 8px" }}>Épargne retraite (PER)</div>
        <table>
          <thead><tr><th>Établissement</th><th>Titulaire</th><th className="num">Valeur</th></tr></thead>
          <tbody><tr><td colSpan={3} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucun PER renseigné</td></tr></tbody>
          <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={3} style={{ padding: "8px 6px" }}><span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter un PER</span></td></tr></tfoot>
        </table>
        <div className="rentab-row total" style={{ marginBottom: 14 }}><div className="lbl">Sous-total PER</div><div className="val">0 €</div></div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "14px 0 8px" }}>Comptes courants d&apos;associé</div>
        <table>
          <thead><tr><th>Société</th><th>Titulaire</th><th className="num">Créance</th></tr></thead>
          <tbody><tr><td>SCI Les Bons Gascons</td><td>Foyer GEMINET</td><td className="num">19 825,07 € <span className="tag" style={{ color: "var(--ink-soft)" }}>(calculé depuis Gérer)</span></td></tr></tbody>
          <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={3} style={{ padding: "8px 6px" }}><span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter une société</span></td></tr></tfoot>
        </table>
        <div className="rentab-row total" style={{ marginBottom: 14 }}><div className="lbl">Sous-total Comptes courants</div><div className="val">19 825 €</div></div>

        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--ink-soft)", fontWeight: 600, margin: "14px 0 8px" }}>Autres placements</div>
        <table>
          <thead><tr><th>Nature</th><th>Établissement</th><th className="num">Valeur</th></tr></thead>
          <tbody><tr><td colSpan={3} style={{ color: "var(--ink-soft)", fontStyle: "italic" }}>Aucun autre placement renseigné</td></tr></tbody>
          <tfoot><tr style={{ background: "var(--paper)" }}><td colSpan={3} style={{ padding: "8px 6px" }}><span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter une ligne</span></td></tr></tfoot>
        </table>
        <div className="rentab-row total" style={{ marginBottom: 4 }}><div className="lbl">Sous-total Autres</div><div className="val">0 €</div></div>

        <div className="total-row" style={{ paddingTop: 14, marginTop: 10, borderTop: "1px solid var(--ink)" }}>
          <span>Total patrimoine financier</span>
          <span className="amt pos" style={{ fontSize: 16 }}>38 325 €</span>
        </div>
      </div>

      <div className="card">
        <h2>7. Emprunts en cours</h2>
        <table>
          <thead><tr><th>Objet</th><th className="num">Capital emprunté</th><th className="num">Taux</th><th>Durée restante</th><th className="num">Mensualité</th><th className="num">CRD</th></tr></thead>
          <tbody>
            <tr><td>Résidence principale</td><td className="num">245 000 €</td><td className="num">1,9 %</td><td>14 ans</td><td className="num">720 €</td><td className="num">198 400 €</td></tr>
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--paper)" }}><td colSpan={6} style={{ padding: "10px 6px" }}><span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter un emprunt</span></td></tr>
          </tfoot>
        </table>
        <div className="placeholder-note">Les emprunts pris par la SCI (visibles dans Gérer) ne se saisissent pas ici — ils sont déjà déduits dans le calcul de la valeur des parts SCI ci-dessous.</div>
      </div>

      <div className="card">
        <h2>Patrimoine actif / passif <span className="tag">calcul automatique</span></h2>
        <div className="card-sub">Inclut la quote-part de SCI et le compte courant d&apos;associé — recalculé depuis &quot;Gérer&quot;</div>
        <div className="grid2" style={{ margin: 0 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--sage)", fontWeight: 600, marginBottom: 10 }}>Actif</div>
            <table>
              <tbody>
                <tr><td className="cat">Résidence principale</td><td className="amt">285 000 €</td></tr>
                <tr><td className="cat">SCPI et placements financiers</td><td className="amt">22 000 €</td></tr>
                <tr><td className="cat">Parts SCI — foyer GEMINET (50 %)</td><td className="amt">41 500 €</td></tr>
                <tr><td className="cat">Compte courant d&apos;associé (créance SCI)</td><td className="amt">19 825 €</td></tr>
                <tr className="total-row"><td>Total actif</td><td className="amt pos">368 325 €</td></tr>
              </tbody>
            </table>
          </div>
          <div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: ".07em", color: "var(--brick)", fontWeight: 600, marginBottom: 10 }}>Passif</div>
            <table>
              <tbody>
                <tr><td className="cat">Crédit résidence principale (CRD)</td><td className="amt">198 400 €</td></tr>
                <tr><td className="cat">Autres crédits personnels</td><td className="amt">0 €</td></tr>
                <tr className="total-row"><td>Total passif</td><td className="amt neg">198 400 €</td></tr>
              </tbody>
            </table>
            <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--paper)", borderRadius: 4, fontSize: 11.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
              Le crédit de la SCI (266 050 € CRD, quote-part 50 % = 133 025 €) n&apos;est pas compté ici : il est déjà déduit dans le calcul de la valeur des parts SCI ci-dessus.
            </div>
          </div>
        </div>
        <div className="total-row" style={{ paddingTop: 16, marginTop: 6, borderTop: "1px solid var(--ink)" }}>
          <span>Patrimoine net</span>
          <span className="amt pos" style={{ fontSize: 16 }}>169 925 €</span>
        </div>
      </div>
    </section>
  );
}
