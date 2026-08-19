export default function ComptesCourantsPage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Comptes courants</b></div>
      <h1>Comptes courants associés</h1>
      <div className="pagesub">Suivi des apports, avances de frais et remboursements</div>
      <div className="grid2">
        <div className="card">
          <h2>Foyer GEMINET</h2>
          <table>
            <tbody>
              <tr><td>Solde au 31/12/2024</td><td className="num">10 688,61 €</td></tr>
              <tr><td>Mouvement net 2025 (apports + avances)</td><td className="num">+ 9 136,46 €</td></tr>
              <tr><td><b>Dette SCI → foyer au 31/12/2025</b></td><td className="num"><b>19 825,07 €</b></td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Foyer PAPIN</h2>
          <table>
            <tbody>
              <tr><td>Solde au 31/12/2024</td><td className="num">10 214,21 €</td></tr>
              <tr><td>Mouvement net 2025 (apports + avances)</td><td className="num">+ 9 892,88 €</td></tr>
              <tr><td><b>Dette SCI → foyer au 31/12/2025</b></td><td className="num"><b>20 107,09 €</b></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Suivi détaillé — apports et remboursements 2025</h2>
        <table>
          <thead><tr><th>Date</th><th>Foyer</th><th>Type</th><th className="num">Montant</th></tr></thead>
          <tbody>
            <tr><td>24/01</td><td>GEMINET</td><td>Apport</td><td className="num">+ 500,00 €</td></tr>
            <tr><td>03/02</td><td>PAPIN</td><td>Apport (retard janvier)</td><td className="num">+ 500,00 €</td></tr>
            <tr><td>21/02</td><td>GEMINET</td><td>Avance de frais — VDL conseil</td><td className="num">+ 270,00 €</td></tr>
            <tr><td>07/03</td><td>PAPIN</td><td>Apport</td><td className="num">+ 500,00 €</td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Squelette — vue complète des 12 mois, filtrable par foyer, avec export pour la déclaration fiscale</div>
      </div>
    </section>
  );
}
