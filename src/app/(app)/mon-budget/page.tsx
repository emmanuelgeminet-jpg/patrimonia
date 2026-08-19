import BudgetTabs from "./BudgetTabs";

export default function MonBudgetPage() {
  return (
    <section className="section">
      <div className="crumb">Mon budget</div>
      <h1>Mon budget</h1>
      <div className="pagesub">
        Budget personnel du foyer — import de relevés bancaires, catégorisation automatique, vision 1 mois à 5 ans
      </div>

      <div className="card">
        <h2>Importer un relevé bancaire</h2>
        <div className="card-sub">CSV ou PDF, un par mois — l&apos;IA catégorise chaque ligne automatiquement</div>
        <div style={{ border: "1.5px dashed var(--line)", borderRadius: 6, padding: 24, textAlign: "center", marginTop: 8 }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>📄</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 10 }}>Glisse ton relevé ici, ou</div>
          <span style={{ background: "var(--ink)", color: "#fff", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer" }}>
            Choisir un fichier
          </span>
        </div>
        <table style={{ marginTop: 14 }}>
          <thead><tr><th>Période</th><th>Statut</th><th className="num">Lignes catégorisées</th></tr></thead>
          <tbody>
            <tr><td>21 fév. – 21 mars 2025</td><td><span className="pill ok">Importé</span></td><td className="num">31 / 31</td></tr>
            <tr><td>21 mars – 21 avr. 2025</td><td><span className="pill ok">Importé</span></td><td className="num">28 / 28</td></tr>
            <tr><td>21 avr. – 21 mai 2025</td><td><span className="pill vac">Non importé</span></td><td className="num">—</td></tr>
          </tbody>
        </table>
      </div>

      <BudgetTabs />
    </section>
  );
}
