import { CHANGELOG } from "@/lib/changelog";

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function QuoiDeNeufPage() {
  return (
    <section className="section">
      <div className="crumb">Quoi de neuf</div>
      <h1>Quoi de neuf</h1>
      <div className="pagesub">Ce qui a changé récemment dans l&apos;appli</div>

      <div className="card">
        {CHANGELOG.map((entry, i) => (
          <div key={i} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < CHANGELOG.length - 1 ? "1px solid var(--line)" : "none" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
              <span className="tag">{formatDateFr(entry.date)}</span>
              <b style={{ fontSize: 14 }}>{entry.title}</b>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 4 }}>{entry.description}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
