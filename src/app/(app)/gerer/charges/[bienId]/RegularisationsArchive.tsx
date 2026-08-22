"use client";

import { Fragment, useState } from "react";
import { formatEuros } from "@/lib/budget";
import type { ClefRepartition, RegularisationResult } from "@/lib/charges-regularisation";
import { RegularisationResultView } from "./RegularisationScreen";

export type RegularisationArchiveItem = {
  id: string;
  periodeDebut: string;
  periodeFin: string;
  clefRepartition: ClefRepartition;
  chargesTotalesCents: number;
  createdAt: string;
  resultat: RegularisationResult;
};

const CLE_LABELS: Record<ClefRepartition, string> = {
  egale: "Également",
  surface: "Surface",
  tantiemes: "Tantièmes",
};

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function RegularisationsArchive({ items }: { items: RegularisationArchiveItem[] }) {
  const [ouvert, setOuvert] = useState<string | null>(null);

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <h2>Régularisations enregistrées <span className="tag">{items.length}</span></h2>
      <table>
        <thead>
          <tr><th>Période</th><th>Clé</th><th className="num">Charges totales</th><th>Enregistrée le</th><th></th></tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <Fragment key={item.id}>
              <tr>
                <td>{formatDateFr(item.periodeDebut)} → {formatDateFr(item.periodeFin)}</td>
                <td>{CLE_LABELS[item.clefRepartition]}</td>
                <td className="num">{formatEuros(item.chargesTotalesCents)}</td>
                <td>{formatDateFr(item.createdAt.slice(0, 10))}</td>
                <td>
                  <span
                    style={{ color: "var(--sage)", cursor: "pointer", fontSize: 11 }}
                    onClick={() => setOuvert(ouvert === item.id ? null : item.id)}
                  >
                    {ouvert === item.id ? "Masquer" : "Voir le détail"}
                  </span>
                </td>
              </tr>
              {ouvert === item.id && (
                <tr>
                  <td colSpan={5}>
                    <RegularisationResultView result={item.resultat} />
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
