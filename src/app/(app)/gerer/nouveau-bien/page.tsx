export default function NouveauBienPage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Rentrer un nouveau bien</b></div>
      <h1>Rentrer un nouveau bien</h1>
      <div className="pagesub">Ajouter un immeuble ou un appartement à votre parc géré</div>
      <div className="card">
        <div className="form-row"><label>Type de bien</label>
          <select defaultValue="Immeuble">
            <option>Immeuble</option><option>Maison</option><option>Appartement isolé</option><option>Garage</option><option>Local commercial</option>
          </select>
        </div>
        <div className="form-row"><label>Adresse</label><input placeholder="13 rue des Cordeliers" /></div>
        <div className="form-row"><label>Date d&apos;acquisition</label><input placeholder="jj/mm/aaaa" /></div>
        <div className="form-row"><label>Prix d&apos;acquisition</label><input placeholder="€" /></div>
        <div className="form-row"><label>Nombre de lots</label><input placeholder="3" /></div>
        <div className="form-row"><label>Mode de détention</label>
          <select defaultValue="Bien propre (nom propre)">
            <option>Bien propre (nom propre)</option><option>Nue-propriété / usufruit</option><option>SCI à l&apos;IR</option><option>SCI à l&apos;IS</option>
          </select>
        </div>
        <div className="form-row"><label>Mode de location</label>
          <select defaultValue="Location nue">
            <option>Location nue</option><option>Location meublée</option>
          </select>
        </div>
        <div className="form-row"><label>Régime fiscal</label>
          <select defaultValue="Micro-foncier">
            <option>Micro-foncier</option><option>Réel foncier (formulaire 2044)</option><option>Micro-BIC (LMNP)</option><option>Réel BIC (LMNP/LMP)</option><option>Imposition à l&apos;IS (SCI)</option>
          </select>
        </div>
      </div>

      <div className="card">
        <h2>Repères fiscaux 2026 <span className="tag">à vérifier chaque année</span></h2>
        <table>
          <tbody>
            <tr><td>Micro-foncier (location nue)</td><td className="num">≤ 15 000 €/an — abattement 30 %</td></tr>
            <tr><td>Micro-BIC (location meublée classique)</td><td className="num">≤ 77 700 €/an — abattement 50 %</td></tr>
            <tr><td>Micro-BIC (meublé de tourisme non classé)</td><td className="num">≤ 15 000 €/an — abattement 30 %</td></tr>
            <tr><td>Seuil de bascule LMNP → LMP</td><td className="num">&gt; 23 000 €/an et &gt; autres revenus du foyer</td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Votre SCI est à l&apos;IS : ces seuils micro-foncier/micro-BIC ne s&apos;appliquent pas à vous, ils sont surtout utiles si vous ajoutez un bien détenu en nom propre. Seuils vérifiés en ligne au moment de la maquette — à recontrôler à chaque exercice, la loi de finances les fait bouger chaque année.</div>
      </div>
      <div className="placeholder-note">Squelette — le formulaire complet (financement, travaux prévisionnels, DPE...) reste à détailler</div>
    </section>
  );
}
