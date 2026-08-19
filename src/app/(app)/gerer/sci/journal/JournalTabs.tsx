"use client";

import { useState } from "react";

type TabKey = "mensuel" | "annuel" | "global";

const TABS: { key: TabKey; label: string }[] = [
  { key: "mensuel", label: "Détail mensuel" },
  { key: "annuel", label: "Bilan annuel" },
  { key: "global", label: "Bilan global depuis achat" },
];

export default function JournalTabs() {
  const [active, setActive] = useState<TabKey>("mensuel");

  return (
    <>
      <div className="unit-tabs">
        {TABS.map((t) => (
          <div
            key={t.key}
            className={`unit-tab${active === t.key ? " active" : ""}`}
            onClick={() => setActive(t.key)}
            role="tab"
            aria-selected={active === t.key}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActive(t.key); }}
          >
            {t.label}
          </div>
        ))}
      </div>

      {active === "mensuel" && <PanelMensuel />}
      {active === "annuel" && <PanelAnnuel />}
      {active === "global" && <PanelGlobal />}
    </>
  );
}

function PanelMensuel() {
  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row" style={{ border: "none", padding: 0 }}>
          <label>Mois</label>
          <select defaultValue="Décembre 2025">
            <option>Décembre 2025</option>
            <option>Novembre 2025</option>
            <option>...</option>
            <option>Janvier 2025</option>
          </select>
        </div>
      </div>

      <div className="kpis" style={{ gridTemplateColumns: "repeat(4,1fr)", marginBottom: 14 }}>
        <div className="kpi"><div className="label">Solde au 1er du mois</div><div className="value">3 144,77 €</div></div>
        <div className="kpi"><div className="label">Total encaissé</div><div className="value">650,00 €</div></div>
        <div className="kpi"><div className="label">Total décaissé</div><div className="value">3 011,34 €</div></div>
        <div className="kpi"><div className="label">Solde bancaire fin de mois</div><div className="value">1 166,00 €</div></div>
      </div>

      <div className="card">
        <h2>Écritures — Décembre 2025 <span className="tag">+ nouvelle écriture ci-dessous</span></h2>
        <table>
          <thead>
            <tr>
              <th>Date</th><th>Encaissement</th><th className="num">Montant E</th><th>Décaissement</th>
              <th className="num">Montant D</th><th>Mode</th><th>Bien concerné</th><th>Commentaire</th><th>Justif.</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>05/12</td><td>—</td><td className="num">—</td><td>Taxe foncière</td><td className="num">2 153,00 €</td><td>Banque SCI</td><td>Immeuble</td><td>Avis 2025</td><td><span className="pill ok" style={{ cursor: "pointer" }}>📎</span></td></tr>
            <tr><td>05/12</td><td>—</td><td className="num">—</td><td>Assurance PNO</td><td className="num">46,43 €</td><td>Banque SCI</td><td>Immeuble</td><td>Prélèvement mensuel</td><td><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+</span></td></tr>
            <tr><td>10/12</td><td>—</td><td className="num">—</td><td>Échéance prêt</td><td className="num">811,91 €</td><td>Banque SCI</td><td>Immeuble</td><td>Mensualité</td><td><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+</span></td></tr>
            <tr><td>10/12</td><td>Loyer HC</td><td className="num">650,00 €</td><td>—</td><td className="num">—</td><td>Virement</td><td>RDC</td><td>Noiraud</td><td><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+</span></td></tr>
          </tbody>
          <tfoot>
            <tr style={{ background: "var(--paper)" }}>
              <td colSpan={9} style={{ padding: "10px 6px" }}>
                <span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }}>+ Ajouter une écriture</span>
                <span style={{ color: "var(--ink-soft)", fontSize: 11, marginLeft: 10 }}>Date · Encaissement/Décaissement · Montant · Mode · Bien concerné · Commentaire · Justificatif</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="grid2" style={{ marginTop: 14 }}>
        <div className="card">
          <h2>Flux — Foyer GEMINET</h2>
          <table>
            <tbody>
              <tr><td>Apports du mois</td><td className="num">0,00 €</td></tr>
              <tr><td>Avances de frais</td><td className="num">0,00 €</td></tr>
              <tr><td>Remboursements reçus</td><td className="num">0,00 €</td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Flux — Foyer PAPIN</h2>
          <table>
            <tbody>
              <tr><td>Apports du mois</td><td className="num">0,00 €</td></tr>
              <tr><td>Avances de frais</td><td className="num">0,00 €</td></tr>
              <tr><td>Remboursements reçus</td><td className="num">0,00 €</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PanelAnnuel() {
  return (
    <div>
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="form-row" style={{ border: "none", padding: 0 }}>
          <label>Exercice</label>
          <select defaultValue="2025 (12 mois)">
            <option>2025 (12 mois)</option>
            <option>2024 (6 mois, 1er exercice)</option>
          </select>
        </div>
      </div>

      <div className="pagesub" style={{ marginBottom: 16 }}>
        Données extraites des comptes annuels certifiés par VDL Conseil (exercice 2025, arrêté le 19/05/2026)
      </div>

      <div className="kpis">
        <div className="kpi"><div className="label">Chiffre d&apos;affaires (loyers + charges)</div><div className="value">10 200,16 €</div><div className="sub">2024 : 0 € (pas encore loué)</div></div>
        <div className="kpi accent"><div className="label">Résultat net comptable</div><div className="value">− 17 645,90 €</div><div className="sub">2024 : − 7 423,95 €</div></div>
        <div className="kpi"><div className="label">Total bilan</div><div className="value">282 992,32 €</div><div className="sub">2024 : 244 529,10 €</div></div>
        <div className="kpi"><div className="label">Capitaux propres</div><div className="value">− 24 869,85 €</div><div className="sub">déficit reporté, normal en phase travaux</div></div>
      </div>

      <div className="grid2">
        <div className="card">
          <h2>Produits d&apos;exploitation 2025 <span className="tag">par appartement</span></h2>
          <table>
            <tbody>
              <tr><td>Loyer RDC <span className="tag" style={{ color: "var(--ink-soft)" }}>(entrée nov. 2025)</span></td><td className="num">587,16 €</td></tr>
              <tr><td>Loyer 1er étage</td><td className="num">4 550,00 €</td></tr>
              <tr><td>Loyer 2e étage</td><td className="num">4 060,00 €</td></tr>
              <tr><td>Charges locatives (3 lots)</td><td className="num">1 003,00 €</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Chiffre d&apos;affaires total</b></td><td className="num"><b>10 200,16 €</b></td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Charges d&apos;exploitation 2025 <span className="tag">principales lignes</span></h2>
          <table>
            <tbody>
              <tr><td>EDF</td><td className="num">3 491,30 €</td></tr>
              <tr><td>Entretien et réparations</td><td className="num">5 649,66 €</td></tr>
              <tr><td>Taxe foncière</td><td className="num">2 153,00 €</td></tr>
              <tr><td>Assurances (PNO + emprunt)</td><td className="num">698,96 €</td></tr>
              <tr><td>Honoraires comptables</td><td className="num">1 080,00 €</td></tr>
              <tr><td>Dotations aux amortissements</td><td className="num">8 045,97 €</td></tr>
              <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total charges d&apos;exploitation</b></td><td className="num"><b>17 931,17 €</b></td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2>Évolution du bilan <span className="tag">2024 → 2025</span></h2>
        <svg viewBox="0 0 612 170" width="100%" height="165">
          <g fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">
            <text x="20" y="15">Total bilan (actif)</text>
            <rect x="20" y="20" width="211" height="14" fill="#DEDACE" /><text x="235" y="31">244 529 € (2024)</text>
            <rect x="20" y="38" width="244" height="14" fill="#A8523A" /><text x="268" y="49">282 992 € (2025)</text>

            <text x="20" y="75">Dette bancaire (CRD)</text>
            <rect x="20" y="80" width="198" height="14" fill="#DEDACE" /><text x="222" y="91">229 770 € (2024)</text>
            <rect x="20" y="98" width="229" height="14" fill="#A8523A" /><text x="253" y="109">266 050 € (2025)</text>

            <text x="20" y="135">Comptes courants associés (cumul)</text>
            <rect x="20" y="140" width="180" height="14" fill="#DEDACE" /><text x="204" y="151">20 903 € (2024)</text>
            <rect x="20" y="158" width="345" height="14" fill="#A8523A" /><text x="369" y="169">39 932 € (2025)</text>
          </g>
        </svg>
        <div className="chart-caption">Barres proportionnelles aux montants — la dette bancaire et les comptes courants associés progressent avec la fin des travaux</div>
      </div>

      <div className="card">
        <h2>Situation des comptes courants d&apos;associés au 31/12/2025 <span className="tag">source : bilan passif certifié</span></h2>
        <table>
          <thead><tr><th>Foyer</th><th className="num">Solde au 31/12/2024</th><th className="num">Solde au 31/12/2025</th><th className="num">Variation 2025</th></tr></thead>
          <tbody>
            <tr><td>GEMINET</td><td className="num">10 688,61 €</td><td className="num"><b>19 825,07 €</b></td><td className="num">+ 9 136,46 €</td></tr>
            <tr><td>PAPIN</td><td className="num">10 214,21 €</td><td className="num"><b>20 107,09 €</b></td><td className="num">+ 9 892,88 €</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Total</b></td><td className="num"><b>20 902,82 €</b></td><td className="num"><b>39 932,16 €</b></td><td className="num"><b>+ 19 029,34 €</b></td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">C&apos;est ce que la SCI doit réellement à chaque foyer — la somme cumulée depuis la création, pas seulement les mouvements de l&apos;année.</div>
      </div>
    </div>
  );
}

function PanelGlobal() {
  return (
    <div>
      <div className="pagesub" style={{ marginBottom: 16 }}>
        SCI créée le 28/06/2024 — comptes annuels certifiés par VDL Conseil pour 2024 (6 mois) et 2025 (12 mois)
      </div>
      <div className="kpis">
        <div className="kpi accent"><div className="label">Total bilan au 31/12/2025</div><div className="value">282 992,32 €</div></div>
        <div className="kpi"><div className="label">Résultat cumulé depuis achat</div><div className="value">− 25 069,85 €</div><div className="sub">2024 + 2025</div></div>
        <div className="kpi"><div className="label">Dette bancaire actuelle</div><div className="value">266 050,01 €</div></div>
        <div className="kpi"><div className="label">Dette SCI → associés (cumul)</div><div className="value">39 932,16 €</div></div>
      </div>

      <div className="card">
        <h2>Compte de résultat par exercice</h2>
        <table>
          <thead><tr><th>Exercice</th><th className="num">Chiffre d&apos;affaires</th><th className="num">Charges totales</th><th className="num">Résultat net</th></tr></thead>
          <tbody>
            <tr><td>2024 <span className="tag">(6 mois, 1er exercice)</span></td><td className="num">0,94 €</td><td className="num">7 425,96 €</td><td className="num">− 7 423,95 €</td></tr>
            <tr><td>2025 <span className="tag">(12 mois)</span></td><td className="num">10 200,16 €</td><td className="num">27 846,06 €</td><td className="num">− 17 645,90 €</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Cumul depuis achat</b></td><td className="num"><b>10 201,10 €</b></td><td className="num"><b>35 272,02 €</b></td><td className="num"><b>− 25 069,85 €</b></td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Déficit cumulé normal en phase de travaux : 8 045,97 € de dotations aux amortissements en 2025 (charge comptable, pas une sortie de trésorerie) et 9 914,89 € d&apos;intérêts d&apos;emprunt pèsent lourd tant que l&apos;immeuble n&apos;est pas loué en totalité.</div>
      </div>

      <div className="card">
        <h2>Évolution du résultat net</h2>
        <svg viewBox="0 0 400 160" width="100%" height="155">
          <line x1="20" y1="30" x2="380" y2="30" stroke="#DEDACE" strokeWidth="1" strokeDasharray="3,3" />
          <text x="384" y="34" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">0 €</text>
          <rect x="100" y="30" width="70" height="52" fill="#A8523A" opacity="0.85" />
          <text x="90" y="98" fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">− 7 424 €</text>
          <text x="118" y="112" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">2024</text>
          <rect x="230" y="30" width="70" height="122" fill="#A8523A" />
          <text x="215" y="168" fontFamily="IBM Plex Mono" fontSize="9" fill="#5B5F53">2025</text>
          <text x="212" y="26" fontFamily="IBM Plex Mono" fontSize="10" fill="#22261F">− 17 646 €</text>
        </svg>
        <div className="chart-caption">Le déficit se creuse en 2025 avec la montée en puissance des amortissements et des intérêts d&apos;emprunt — attendu tant que les 3 lots ne sont pas loués toute l&apos;année</div>
      </div>

      <div className="card">
        <h2>Répartition du capital social</h2>
        <table>
          <tbody>
            <tr><td>Pierre PAPIN</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr><td>Marie PAPIN</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr><td>Emmanuel GEMINET</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr><td>Thérèse GEMINET</td><td className="num">25 parts — 25,00 %</td></tr>
            <tr style={{ borderTop: "1px solid var(--ink)" }}><td><b>Capital social</b></td><td className="num"><b>200,00 € — 100 parts</b></td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
