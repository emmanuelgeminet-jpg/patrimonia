"use client";

import { useState } from "react";
import { visitThemes } from "./visit-data";

export default function CarnetVisite() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="card">
      <div className="card-sub">
        Reconstitué à partir des obligations légales en vigueur et des retours d&apos;experts (notaires, diagnostiqueurs, couvreurs, forums spécialisés)
      </div>

      {visitThemes.map((theme, themeIndex) => (
        <div className="visit-theme" key={theme.title}>
          <div className="visit-theme-title">
            <span className="n">{themeIndex + 1}</span>
            {theme.title}
          </div>
          {theme.items.map((item) => {
            const key = `${theme.title}__${item.label}`;
            const isChecked = checked.has(key);
            return (
              <div className="visit-item" key={key}>
                <div
                  className={`visit-check${isChecked ? " checked" : ""}`}
                  onClick={() => toggle(key)}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(key); } }}
                />
                <div>
                  <div className="visit-label">{item.label}</div>
                  <div className="visit-note">{item.note}</div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)" }}>
        <b>Récapitulatif des diagnostics obligatoires et leur validité</b> — DPE : 10 ans · Amiante : illimité (absence) / 3 ans (présence) · Plomb : illimité (absence) / 1 an (présence, vente) · Termites : 6 mois, zones à arrêté préfectoral uniquement · Électricité/Gaz : 3 ans, si installation &gt; 15 ans · ERP : 6 mois · Assainissement individuel (SPANC) : 3 ans · Mesurage Carrez : illimité (copropriété uniquement, non concerné ici en monopropriété) · Audit énergétique : requis si DPE F ou G.
      </div>
    </div>
  );
}
