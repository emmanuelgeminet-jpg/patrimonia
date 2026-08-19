import JournalTabs from "./JournalTabs";

export default function JournalPage() {
  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Journal comptable</b></div>
      <h1>Journal comptable</h1>
      <div className="pagesub">Reprend la structure de ton fichier — mois par mois, avec bilan annuel et bilan global</div>
      <JournalTabs />
    </section>
  );
}
