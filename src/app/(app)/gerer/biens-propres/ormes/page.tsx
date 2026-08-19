export default function BienOrmesPage() {
  return (
    <section className="section">
      <div className="crumb">Gestion immobilière <b>› Biens propres › 14 rue des Ormes St Victor</b></div>
      <h1>14 rue des Ormes Saint Victor</h1>
      <div className="pagesub">Orléans — bien locatif détenu en nom propre (hors SCI)</div>

      <div className="kpis">
        <div className="kpi"><div className="label">Loyer perçu</div><div className="value">395 €/mois</div></div>
        <div className="kpi"><div className="label">Crédit en cours</div><div className="value">317,38 €/mois</div></div>
        <div className="kpi"><div className="label">Assurance</div><div className="value">11,33 €/mois</div></div>
        <div className="kpi accent"><div className="label">Cashflow net</div><div className="value">66,29 €/mois</div></div>
      </div>

      <div className="card">
        <div className="empty">
          <div className="big">À détailler</div>
          Reconstitué à partir des lignes trouvées dans ton budget personnel (loyer, crédit, assurance). Une vraie fiche bien (comme pour la SCI : locataire, bail, documents, historique de travaux, rentabilité) reste à construire — dis-moi quand tu veux qu&apos;on s&apos;y attelle.
        </div>
      </div>
    </section>
  );
}
