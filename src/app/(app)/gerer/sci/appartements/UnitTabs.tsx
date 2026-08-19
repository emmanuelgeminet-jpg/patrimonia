"use client";

import { useState } from "react";

const UNITS = ["RDC", "1er étage", "2e étage", "Garage"] as const;
type Unit = (typeof UNITS)[number];

export default function UnitTabs() {
  const [active, setActive] = useState<Unit>("RDC");

  return (
    <>
      <div className="unit-tabs">
        {UNITS.map((u) => (
          <div
            key={u}
            className={`unit-tab${active === u ? " active" : ""}`}
            onClick={() => setActive(u)}
            role="tab"
            aria-selected={active === u}
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setActive(u); }}
          >
            {u}
          </div>
        ))}
      </div>

      {active === "RDC" ? (
        <RdcContent />
      ) : (
        <div className="card">
          <div className="empty">
            <div className="big">Fiche à compléter</div>
            La fiche détaillée de ce lot ({active}) n&apos;a pas encore été saisie — commence par le RDC, déjà entièrement rempli.
          </div>
        </div>
      )}
    </>
  );
}

function RdcContent() {
  return (
    <>
      <div className="grid2">
        <div className="card">
          <h2>RDC — Sophie Noiraud <span className="tag" style={{ cursor: "pointer", color: "var(--brick)" }}>Modifier le locataire</span></h2>
          <table>
            <tbody>
              <tr><td>Loyer HC</td><td className="num">650,00 €</td></tr>
              <tr><td>Charges (provisions)</td><td className="num">20,00 €</td></tr>
              <tr><td><b>Total loyer + charges</b></td><td className="num"><b>670,00 €</b></td></tr>
              <tr><td>Date d&apos;entrée</td><td className="num">24/11/2025</td></tr>
              <tr><td>Dépôt de garantie</td><td className="num">650,00 € — 24/11/2025 — Virement</td></tr>
              <tr><td>Statut décembre</td><td className="num"><span className="pill ok">Payé</span></td></tr>
            </tbody>
          </table>
        </div>
        <div className="card">
          <h2>Quittances — RDC <span className="tag" style={{ color: "var(--sage)", cursor: "pointer" }}>Envoyer celle du mois</span></h2>
          <table>
            <tbody>
              <tr><td>Décembre 2025</td><td className="num"><span className="pill ok">Envoyée le 05/12</span></td></tr>
              <tr><td>Novembre 2025</td><td className="num"><span className="pill ok">Envoyée le 05/11</span></td></tr>
            </tbody>
          </table>
          <div className="placeholder-note">Envoi automatique activé — voir réglage global dans Documents.</div>
        </div>
        <div className="card">
          <h2>Charges récupérables</h2>
          <table>
            <tbody>
              <tr><td>Provisions perçues 2025</td><td className="num">20,00 €</td></tr>
              <tr><td>Quote-part eau/élec réelle (index compteur)</td><td className="num">0,00 €</td></tr>
              <tr><td>Quote-part TEOM</td><td className="num">0,00 €</td></tr>
              <tr><td><b>Solde régularisation</b></td><td className="num"><b>+ 20,00 €</b></td></tr>
            </tbody>
          </table>
          <div className="placeholder-note">Calcul automatique : provisions perçues − charges réelles imputables au lot (au prorata des index et de la quote-part immeuble)</div>
        </div>
      </div>

      <div className="card">
        <h2>Révision annuelle de loyer <span className="tag">IRL</span></h2>
        <table>
          <tbody>
            <tr><td>Loyer actuel</td><td className="num">650,00 €</td></tr>
            <tr><td>Date anniversaire du bail</td><td className="num">24/11</td></tr>
            <tr><td>Indice IRL de référence</td><td className="num">à récupérer en ligne (INSEE)</td></tr>
            <tr><td><b>Nouveau loyer proposé</b></td><td className="num"><b>à calculer</b></td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Squelette — récupération automatique de l&apos;IRL trimestriel INSEE et génération de l&apos;avenant au bail à construire</div>
      </div>

      <div className="card">
        <h2>Documents du logement <span className="tag">RDC</span></h2>
        <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">DPE</div><div className="count">1 fichier</div></div>
        <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">Bail et avenants</div><div className="count">1 fichier</div></div>
        <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">État des lieux</div><div className="count">2 fichiers</div></div>
        <div className="docfolder"><svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z" /><path d="M15 3v4h4" /></svg><div className="name">Assurances &amp; diagnostics (électricité, gaz...)</div><div className="count">0 fichier</div></div>
      </div>

      <div className="card">
        <h2>Historique des travaux <span className="tag">RDC</span></h2>
        <table>
          <thead><tr><th>Date</th><th>Nature</th><th className="num">Montant</th><th>Devis</th><th>Facture</th></tr></thead>
          <tbody>
            <tr><td>07/03/2025</td><td>Rénovation salle de bain — TKT CVLF</td><td className="num">16 960,78 €</td><td><span className="pill ok" style={{ cursor: "pointer" }}>📎 devis.pdf</span></td><td><span className="pill ok" style={{ cursor: "pointer" }}>📎 facture.pdf</span></td></tr>
            <tr><td>19/03/2025</td><td>Suite travaux — TKT CVLF</td><td className="num">8 661,51 €</td><td><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+ ajouter</span></td><td><span className="pill ok" style={{ cursor: "pointer" }}>📎 facture.pdf</span></td></tr>
            <tr><td>21/02/2025</td><td>Petite fourniture / entretien — VDL conseil</td><td className="num">270,00 €</td><td><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+ ajouter</span></td><td><span className="tag" style={{ color: "var(--brick)", cursor: "pointer" }}>+ ajouter</span></td></tr>
          </tbody>
        </table>
        <div className="placeholder-note">Squelette — chaque ligne de travaux se relie à l&apos;écriture correspondante du journal comptable, avec devis et facture attachés directement</div>
      </div>

      <div className="card">
        <h2>Historique de paiement <span className="tag">squelette</span></h2>
        <div className="empty"><div className="big">À détailler</div>Historique mois par mois, index compteur, régularisations charges</div>
      </div>
    </>
  );
}
