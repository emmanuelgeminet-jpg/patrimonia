"use client";

import Link from "next/link";
import { useActionState, useRef, useTransition } from "react";
import { addChargeBienPropre, deleteChargeBienPropre, uploadChargeJustificatif, removeChargeJustificatif, type SaveState } from "./actions";
import { formatEuros } from "@/lib/budget";

export type ChargeItem = {
  id: string;
  date: string;
  montantCents: number;
  categorie: string | null;
  periodeDebut: string;
  periodeFin: string;
  commentaire: string | null;
  justificatifPath: string | null;
  justificatifUrl: string | null;
};

const initialState: SaveState = {};

function formatDateFr(dateStr: string): string {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function ChargesSection({ bienId, lots, charges }: { bienId: string; lots: { id: string; nom: string }[]; charges: ChargeItem[] }) {
  const [state, formAction, pending] = useActionState(addChargeBienPropre, initialState);
  const [, startTransition] = useTransition();

  return (
    <div className="card">
      <h2>Charges détaillées <span className="tag">{charges.length} ligne{charges.length !== 1 ? "s" : ""}</span></h2>
      <div className="card-sub">
        Chaque facture avec la période qu&apos;elle couvre — sert de base à la régularisation des charges par locataire.
      </div>

      {charges.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucune charge détaillée pour l&apos;instant</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Catégorie</th>
              <th>Période couverte</th>
              <th className="num">Montant</th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {charges.map((c) => (
              <tr key={c.id}>
                <td>{formatDateFr(c.date)}</td>
                <td>{c.categorie ?? "—"}</td>
                <td>{formatDateFr(c.periodeDebut)} → {formatDateFr(c.periodeFin)}</td>
                <td className="num">{formatEuros(c.montantCents)}</td>
                <td>
                  {c.justificatifUrl ? (
                    <span style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <a href={c.justificatifUrl} target="_blank" rel="noreferrer" style={{ color: "var(--sage)", fontSize: 11 }}>📎</a>
                      <span
                        style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                        onClick={() => startTransition(() => { removeChargeJustificatif(c.id, c.justificatifPath as string, bienId); })}
                      >
                        ×
                      </span>
                    </span>
                  ) : (
                    <ChargeJustificatifUpload chargeId={c.id} bienId={bienId} />
                  )}
                </td>
                <td>
                  <span
                    style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}
                    onClick={() => {
                      if (!window.confirm("Supprimer cette charge ? Cette action est irréversible.")) return;
                      startTransition(() => { deleteChargeBienPropre(c.id, bienId); });
                    }}
                  >
                    Supprimer
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <form action={formAction} style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginTop: 12 }}>
        <input type="hidden" name="bien_id" value={bienId} />
        <input type="date" name="date" required style={{ maxWidth: 140 }} title="Date de la facture" />
        <input name="montant" placeholder="Montant €" required style={{ maxWidth: 100 }} />
        <select name="categorie" defaultValue="" style={{ maxWidth: 180 }}>
          <option value="">Catégorie (optionnel)</option>
          <option value="Prêt">Prêt</option>
          <option value="Taxe foncière">Taxe foncière</option>
          <option value="Charges copropriété">Charges copropriété</option>
          <option value="Assurance">Assurance</option>
          <option value="Entretien & réparations">Entretien &amp; réparations</option>
          <option value="Eau / Électricité / Gaz">Eau / Électricité / Gaz</option>
          <option value="Honoraires comptables">Honoraires comptables</option>
          <option value="Travaux">Travaux</option>
          <option value="Autre">Autre</option>
        </select>
        {lots.length > 1 && (
          <select name="lot_id" defaultValue="" style={{ maxWidth: 160 }}>
            <option value="">Tout l&apos;immeuble</option>
            {lots.map((l) => <option key={l.id} value={l.id}>{l.nom}</option>)}
          </select>
        )}
        <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <label style={{ fontSize: 10.5, color: "var(--ink-soft)" }}>Période couverte :</label>
          <input type="date" name="periode_debut" required style={{ maxWidth: 130, fontSize: 11 }} />
          <input type="date" name="periode_fin" required style={{ maxWidth: 130, fontSize: 11 }} />
        </span>
        <input name="commentaire" placeholder="Commentaire" style={{ maxWidth: 150 }} />
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          + Ajouter une charge
        </button>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 6 }}>{state.error}</div>}

      <div style={{ marginTop: 12 }}>
        <Link href={`/gerer/charges/${bienId}`} style={{ color: "var(--sage)", fontSize: 12.5 }}>
          Régulariser les charges →
        </Link>
      </div>
    </div>
  );
}

function ChargeJustificatifUpload({ chargeId, bienId }: { chargeId: string; bienId: string }) {
  const [, formAction, pending] = useActionState(uploadChargeJustificatif, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={formAction}>
      <input type="hidden" name="charge_id" value={chargeId} />
      <input type="hidden" name="bien_id" value={bienId} />
      <label style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11 }}>
        {pending ? "..." : "+"}
        <input
          type="file"
          name="file"
          accept="image/*,.pdf,application/pdf"
          capture="environment"
          style={{ display: "none" }}
          onChange={() => formRef.current?.requestSubmit()}
        />
      </label>
    </form>
  );
}
