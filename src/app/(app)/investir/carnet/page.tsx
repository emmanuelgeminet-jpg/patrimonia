import CarnetVisite from "./CarnetVisite";

export default function CarnetVisitePage() {
  return (
    <section className="section">
      <div className="crumb">Analyser un bien <b>› Investir › Carnet de visite</b></div>
      <h1>Carnet de visite</h1>
      <div className="pagesub">Checklist experte — 12 thématiques, à cocher en visite ou contre-visite</div>
      <CarnetVisite />
    </section>
  );
}
