import NouveauBienForm from "./NouveauBienForm";

export default function NouveauBienPage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Rentrer un nouveau bien</b></div>
      <h1>Rentrer un nouveau bien</h1>
      <div className="pagesub">Ajouter un immeuble ou un appartement à votre parc géré</div>

      <NouveauBienForm />

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
        <div className="placeholder-note">Ces seuils micro-foncier/micro-BIC ne s&apos;appliquent pas à un bien détenu via une SCI à l&apos;IS — surtout utiles pour un bien en nom propre. À recontrôler à chaque exercice, la loi de finances les fait bouger chaque année.</div>
      </div>
      <div className="placeholder-note">
        Squelette — le formulaire couvre les infos de base (type, adresse, financement d&apos;acquisition, mode de
        détention et fiscal). Restent à ajouter : DPE, travaux prévisionnels, financement détaillé (taux, durée,
        apport) directement liés au bien une fois créé, et la possibilité de rattacher une analyse déjà faite dans
        &quot;Analyser un bien&quot; plutôt que de ressaisir.
      </div>
    </section>
  );
}
