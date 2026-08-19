import UnitTabs from "./UnitTabs";

export default function AppartementsPage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Gérer mon parc › Par appartement</b></div>
      <h1>Par appartement</h1>
      <div className="pagesub">Fiche détaillée de chaque lot</div>
      <UnitTabs />
    </section>
  );
}
