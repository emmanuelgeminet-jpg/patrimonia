"use client";

import { useMemo, useState, useTransition } from "react";
import { computeRegularisation, type ClefRepartition, type LotRepartitionInput, type OccupationInput, type RegularisationResult } from "@/lib/charges-regularisation";
import { formatEuros } from "@/lib/budget";
import { enregistrerRegularisation } from "./actions";
import type { ChargeLigneAffichage } from "./data";

const CLE_LABELS: Record<ClefRepartition, string> = {
  egale: "Également entre les logements",
  surface: "Selon la surface",
  tantiemes: "Selon les tantièmes de copropriété",
};

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function moisDefaut(offsetMois: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + offsetMois);
  return d.toISOString().slice(0, 10);
}

export default function RegularisationScreen({
  bienId,
  cleRepartitionDefaut,
  lots,
  occupations,
  chargeLignes,
  ecrituresSansPeriodeCount,
  isSci,
}: {
  bienId: string;
  cleRepartitionDefaut: ClefRepartition;
  lots: LotRepartitionInput[];
  occupations: OccupationInput[];
  chargeLignes: ChargeLigneAffichage[];
  ecrituresSansPeriodeCount: number;
  isSci: boolean;
}) {
  const [periodeDebut, setPeriodeDebut] = useState(() => moisDefaut(-12));
  const [periodeFin, setPeriodeFin] = useState(() => moisDefaut(0));
  const [clefRepartition, setClefRepartition] = useState<ClefRepartition>(cleRepartitionDefaut);
  const [categoriesExclues, setCategoriesExclues] = useState<Set<string>>(new Set());
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  const categoriesDisponibles = useMemo(
    () => [...new Set(chargeLignes.map((l) => l.categorie).filter((c): c is string => !!c))].sort(),
    [chargeLignes]
  );

  const chargeLignesFiltrees = useMemo(
    () => chargeLignes.filter((l) => !l.categorie || !categoriesExclues.has(l.categorie)),
    [chargeLignes, categoriesExclues]
  );

  const result: RegularisationResult | null = useMemo(() => {
    if (!periodeDebut || !periodeFin || periodeFin < periodeDebut) return null;
    return computeRegularisation({
      periodeDebut,
      periodeFin,
      clefRepartition,
      chargeLignes: chargeLignesFiltrees.map((l) => ({ id: l.id, montantCents: l.montantCents, lotId: l.lotId, periodeDebut: l.periodeDebut, periodeFin: l.periodeFin })),
      lots,
      occupations,
    });
  }, [periodeDebut, periodeFin, clefRepartition, chargeLignesFiltrees, lots, occupations]);

  const toggleCategorie = (cat: string) => {
    setCategoriesExclues((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const onEnregistrer = () => {
    setError(null);
    setSucces(false);
    startTransition(async () => {
      const res = await enregistrerRegularisation(bienId, periodeDebut, periodeFin, clefRepartition, [...categoriesExclues]);
      if (res.error) {
        setError(res.error);
        return;
      }
      setSucces(true);
    });
  };

  return (
    <div className="card">
      <h2>Calculer une régularisation</h2>
      <div className="card-sub">
        Le total des charges de la période est réparti entre les logements selon la clé choisie, puis entre les
        locataires qui se sont succédé, au prorata de leurs mois d&apos;occupation.
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 10 }}>
        <label style={{ fontSize: 12 }}>Période à régulariser :</label>
        <input type="date" value={periodeDebut} onChange={(e) => setPeriodeDebut(e.target.value)} style={{ maxWidth: 140 }} />
        <span style={{ fontSize: 12 }}>→</span>
        <input type="date" value={periodeFin} onChange={(e) => setPeriodeFin(e.target.value)} style={{ maxWidth: 140 }} />

        <label style={{ fontSize: 12, marginLeft: 10 }}>Clé de répartition :</label>
        <select value={clefRepartition} onChange={(e) => setClefRepartition(e.target.value as ClefRepartition)} style={{ maxWidth: 240 }}>
          {(Object.keys(CLE_LABELS) as ClefRepartition[]).map((k) => (
            <option key={k} value={k}>{CLE_LABELS[k]}</option>
          ))}
        </select>
      </div>

      {categoriesDisponibles.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 11, color: "var(--ink-soft)", marginBottom: 4 }}>
            Postes inclus dans la régularisation (décoche ceux qui ne sont pas récupérables sur le locataire, ex : Prêt) :
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {categoriesDisponibles.map((cat) => (
              <label key={cat} style={{ fontSize: 11.5, display: "flex", gap: 4, alignItems: "center", cursor: "pointer" }}>
                <input type="checkbox" checked={!categoriesExclues.has(cat)} onChange={() => toggleCategorie(cat)} />
                {cat}
              </label>
            ))}
          </div>
        </div>
      )}

      {isSci && ecrituresSansPeriodeCount > 0 && (
        <div className="placeholder-note" style={{ marginTop: 10 }}>
          {ecrituresSansPeriodeCount} écriture{ecrituresSansPeriodeCount > 1 ? "s" : ""} du journal non incluse{ecrituresSansPeriodeCount > 1 ? "s" : ""} —
          période couverte non renseignée. Complète-la sur l&apos;écriture (Journal comptable) si elle doit compter dans une régularisation.
        </div>
      )}

      {result && result.lotsDonneeManquante.length > 0 && (
        <div className="placeholder-note" style={{ marginTop: 10, color: "var(--brick)" }}>
          Pas de {clefRepartition === "surface" ? "surface" : "tantièmes"} renseigné pour : {result.lotsDonneeManquante.join(", ")} —
          ce{result.lotsDonneeManquante.length > 1 ? "s" : ""} logement{result.lotsDonneeManquante.length > 1 ? "s" : ""} compte
          {result.lotsDonneeManquante.length > 1 ? "nt" : ""} pour un poids égal en attendant.
        </div>
      )}

      {result && (
        <>
          <RegularisationResultView result={result} />

          <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center" }}>
            <button
              type="button"
              disabled={pending}
              onClick={onEnregistrer}
              style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "8px 18px", borderRadius: 20, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              {pending ? "Enregistrement..." : "Enregistrer cette régularisation"}
            </button>
            {error && <span style={{ color: "var(--brick)", fontSize: 11.5 }}>{error}</span>}
            {succes && <span style={{ color: "var(--sage)", fontSize: 11.5 }}>Régularisation enregistrée et ajoutée à l&apos;archive ci-dessous.</span>}
          </div>
        </>
      )}
    </div>
  );
}

export function RegularisationResultView({ result }: { result: RegularisationResult }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div className="kpis">
        <div className="kpi">
          <div className="label">Charges totales</div>
          <div className="value">{formatEuros(result.chargesTotalesCents)}</div>
          <div className="sub">{formatDateFr(result.periodeDebut)} → {formatDateFr(result.periodeFin)}</div>
        </div>
        <div className="kpi">
          <div className="label">Non affectées (vacance)</div>
          <div className="value">{formatEuros(result.chargesNonAffecteesTotalCents)}</div>
          <div className="sub">reste à la charge du propriétaire</div>
        </div>
      </div>

      {result.parLot.map((lot) => (
        <div key={lot.lotId} style={{ marginTop: 14 }}>
          <h3 style={{ fontSize: 13, marginBottom: 4 }}>
            {lot.lotNom} <span className="tag">{formatEuros(lot.chargesLotCents)} — provision suggérée {formatEuros(lot.provisionSuggereeMensuelleCents)}/mois</span>
          </h3>
          {lot.parLocataire.length > 0 ? (
            <table>
              <thead>
                <tr><th>Locataire</th><th className="num">Mois occupés</th><th className="num">Provisions collectées</th><th className="num">Part réelle</th><th className="num">Solde</th></tr>
              </thead>
              <tbody>
                {lot.parLocataire.map((loc) => (
                  <tr key={loc.locataireId}>
                    <td>{loc.locataireNom}</td>
                    <td className="num">{loc.moisOccupes}</td>
                    <td className="num">{formatEuros(loc.provisionsCollecteesCents)}</td>
                    <td className="num">{formatEuros(loc.partChargesCents)}</td>
                    <td className="num" style={{ color: loc.soldeCents >= 0 ? "var(--sage)" : "var(--brick)" }}>
                      {loc.soldeCents >= 0 ? `À rembourser : ${formatEuros(loc.soldeCents)}` : `À réclamer : ${formatEuros(-loc.soldeCents)}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty" style={{ padding: "10px 4px" }}>Aucun locataire sur ce logement pour cette période</div>
          )}
          {lot.chargesNonAffecteesCents > 0 && (
            <div className="placeholder-note" style={{ marginTop: 4 }}>
              Dont {formatEuros(lot.chargesNonAffecteesCents)} correspondant aux périodes de vacance du logement.
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
