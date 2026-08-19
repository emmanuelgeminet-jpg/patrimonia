export default function DocumentsPage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Documents</b></div>
      <h1>Documents</h1>
      <div className="pagesub">Un seul espace pour tous les justificatifs et documents de la SCI</div>
      <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">Statuts</div><div className="count">1 fichier</div></div>
      <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">Assemblées générales</div><div className="count">0 fichier</div></div>
      <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">Factures &amp; justificatifs</div><div className="count">0 fichier</div></div>
      <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">Assurances &amp; diagnostics</div><div className="count">0 fichier</div></div>

      <div className="card" style={{ marginTop: 18 }}>
        <h2>Quittances <span className="tag">historique et envoi</span></h2>
        <div className="form-row" style={{ border: "none", padding: "6px 0 14px" }}>
          <label>Envoi automatique</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 38, height: 20, background: "var(--sage)", borderRadius: 20, position: "relative" }}>
              <div style={{ width: 16, height: 16, background: "#fff", borderRadius: "50%", position: "absolute", top: 2, right: 2 }} />
            </div>
            <span style={{ fontSize: 12, color: "var(--ink-soft)" }}>Activé — envoyée le 5 de chaque mois si le loyer est encaissé</span>
          </div>
        </div>
        <table>
          <thead><tr><th>Mois</th><th>Locataire</th><th>Lot</th><th>Envoi</th><th className="num">Justificatif</th></tr></thead>
          <tbody>
            <tr><td>Décembre 2025</td><td>Sophie Noiraud</td><td>RDC</td><td><span className="pill ok">Envoyée le 05/12</span></td><td className="num"><span className="pill ok" style={{ cursor: "pointer" }}>📎 PDF</span></td></tr>
            <tr><td>Décembre 2025</td><td>Delphine Gruet</td><td>1er étage</td><td><span className="pill warn">En attente (loyer partiel)</span></td><td className="num"><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+ générer</span></td></tr>
            <tr><td>Décembre 2025</td><td>Léa Verdier</td><td>2e étage</td><td><span className="pill due">Non envoyée</span></td><td className="num"><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+ générer</span></td></tr>
            <tr><td>Novembre 2025</td><td>Sophie Noiraud</td><td>RDC</td><td><span className="pill ok">Envoyée le 05/11</span></td><td className="num"><span className="pill ok" style={{ cursor: "pointer" }}>📎 PDF</span></td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Squelette — la génération se fait automatiquement dès que le loyer du mois est pointé &quot;Payé&quot; dans le journal comptable, puis part par email au locataire sans action manuelle si l&apos;envoi automatique est activé.</div>
      </div>
      <div className="placeholder-note">Squelette — upload par glisser-déposer et lien direct depuis chaque écriture du journal à construire</div>
    </section>
  );
}
