"use client";

import { Fragment, useActionState, useEffect, useMemo, useState } from "react";
import { formatEuros, formatMonthLabel } from "@/lib/budget";
import { preparerEnvoiQuittance, envoyerQuittanceParEmail, type EnvoiQuittanceState } from "./quittance-email-actions";

export type QuittanceArchiveItem = {
  id: string;
  bienAdresse: string;
  lotNom: string;
  locataireNom: string;
  mois: string;
  loyerHcCents: number;
  chargesCents: number;
  dateGeneration: string;
  /** Date réelle d'encaissement (Journal comptable) — absente pour un bien en nom propre. */
  datePaiement: string | null;
  url: string | null;
  emailEnvoyeA: string | null;
  emailEnvoyeLe: string | null;
};

function formatDateFr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR");
}

/**
 * Archive complète des quittances générées — indépendante du dossier "Quittances" de l'écran
 * Documents (qui reste, pour l'upload manuel). Ici, chaque ligne vient de la table `quittances`,
 * remplie automatiquement à chaque génération : logement, locataire, période et montant sont
 * de vraies colonnes, pas des infos à retrouver dans un nom de fichier — pour qu'Emmanuel
 * puisse vraiment retrouver une quittance précise en cas de besoin (litige, contrôle...).
 *
 * Filtres plutôt qu'un espace de stockage séparé par logement : un immeuble avec plusieurs
 * lots partage déjà cette archive, et filtrer permet de croiser logement/locataire/période
 * dans n'importe quel sens (ex. "toutes les quittances de Jean sur 2026", pas seulement
 * "toutes celles du 1er étage") — plus flexible qu'un simple découpage par dossier.
 */
export default function QuittancesArchive({ items }: { items: QuittanceArchiveItem[] }) {
  const [logement, setLogement] = useState("");
  const [locataire, setLocataire] = useState("");
  const [periode, setPeriode] = useState("");
  const [ouvertPourId, setOuvertPourId] = useState<string | null>(null);
  // Mise à jour optimiste après un envoi réussi, sans attendre un rechargement complet de la page.
  const [envoisRecents, setEnvoisRecents] = useState<Record<string, { a: string; le: string }>>({});

  const logements = useMemo(
    () => [...new Set(items.map((q) => `${q.bienAdresse} — ${q.lotNom}`))].sort(),
    [items]
  );
  const locataires = useMemo(() => [...new Set(items.map((q) => q.locataireNom))].sort(), [items]);
  const periodes = useMemo(() => [...new Set(items.map((q) => q.mois))].sort().reverse(), [items]);

  const filtered = items.filter(
    (q) =>
      (!logement || `${q.bienAdresse} — ${q.lotNom}` === logement) &&
      (!locataire || q.locataireNom === locataire) &&
      (!periode || q.mois === periode)
  );
  const sorted = [...filtered].sort((a, b) => (a.mois < b.mois ? 1 : a.mois > b.mois ? -1 : 0));

  return (
    <div className="card">
      <h2>Archive des quittances <span className="tag">{sorted.length} quittance{sorted.length !== 1 ? "s" : ""}</span></h2>
      <div className="card-sub">
        Toutes les quittances générées depuis l&apos;appli, à conserver en cas de besoin (litige, contrôle...) —
        classées par période, les plus récentes en premier.
      </div>

      {items.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <select value={logement} onChange={(e) => setLogement(e.target.value)} style={{ maxWidth: 220 }}>
            <option value="">Tous les logements</option>
            {logements.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={locataire} onChange={(e) => setLocataire(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="">Tous les locataires</option>
            {locataires.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={periode} onChange={(e) => setPeriode(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="">Toutes les périodes</option>
            {periodes.map((m) => <option key={m} value={m}>{formatMonthLabel(m)}</option>)}
          </select>
          {(logement || locataire || periode) && (
            <span
              className="pill"
              style={{ cursor: "pointer", background: "var(--paper)", color: "var(--ink-soft)" }}
              onClick={() => { setLogement(""); setLocataire(""); setPeriode(""); }}
            >
              Réinitialiser
            </span>
          )}
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucune quittance générée pour l&apos;instant</div>
      ) : sorted.length === 0 ? (
        <div className="empty" style={{ padding: "16px 4px" }}>Aucune quittance ne correspond à ces filtres</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th>Logement</th>
              <th>Locataire</th>
              <th className="num">Montant</th>
              <th>Réglé le</th>
              <th>Émise le</th>
              <th></th>
              <th>Email</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((q) => {
              const envoi = envoisRecents[q.id] ?? (q.emailEnvoyeA && q.emailEnvoyeLe ? { a: q.emailEnvoyeA, le: q.emailEnvoyeLe } : null);
              return (
                <Fragment key={q.id}>
                  <tr>
                    <td>{formatMonthLabel(q.mois)}</td>
                    <td>{q.bienAdresse} — {q.lotNom}</td>
                    <td>{q.locataireNom}</td>
                    <td className="num">{formatEuros(q.loyerHcCents + q.chargesCents)}</td>
                    <td>{q.datePaiement ? formatDateFr(q.datePaiement) : "—"}</td>
                    <td>{formatDateFr(q.dateGeneration)}</td>
                    <td>
                      {q.url ? (
                        <a href={q.url} target="_blank" rel="noreferrer" style={{ color: "var(--sage)" }}>Télécharger</a>
                      ) : (
                        <span style={{ color: "var(--ink-soft)" }}>Lien expiré</span>
                      )}
                    </td>
                    <td>
                      {envoi ? (
                        <span style={{ color: "var(--sage)", fontSize: 11 }} title={`Envoyée à ${envoi.a}`}>
                          Envoyée le {formatDateFr(envoi.le)}
                        </span>
                      ) : (
                        <span
                          style={{ color: "var(--sage)", cursor: "pointer", fontSize: 11 }}
                          onClick={() => setOuvertPourId(ouvertPourId === q.id ? null : q.id)}
                        >
                          {ouvertPourId === q.id ? "Fermer" : "Envoyer par email"}
                        </span>
                      )}
                    </td>
                  </tr>
                  {ouvertPourId === q.id && !envoi && (
                    <tr>
                      <td colSpan={8}>
                        <EnvoiEmailForm
                          quittanceId={q.id}
                          onEnvoyee={(a, le) => {
                            setEnvoisRecents((prev) => ({ ...prev, [q.id]: { a, le } }));
                            setOuvertPourId(null);
                          }}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

const initialEnvoiState: EnvoiQuittanceState = {};

function EnvoiEmailForm({ quittanceId, onEnvoyee }: { quittanceId: string; onEnvoyee: (a: string, le: string) => void }) {
  const [apercu, setApercu] = useState<{ toEmail: string; subject: string; message: string; pdfUrl?: string } | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreurApercu, setErreurApercu] = useState<string | null>(null);
  const [toEmail, setToEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [state, formAction, pending] = useActionState(envoyerQuittanceParEmail, initialEnvoiState);

  useEffect(() => {
    let annule = false;
    preparerEnvoiQuittance(quittanceId).then((result) => {
      if (annule) return;
      if (result.error) {
        setErreurApercu(result.error);
      } else {
        setApercu({ toEmail: result.toEmail ?? "", subject: result.subject ?? "", message: result.message ?? "", pdfUrl: result.pdfUrl });
        setToEmail(result.toEmail ?? "");
        setSubject(result.subject ?? "");
        setMessage(result.message ?? "");
      }
      setChargement(false);
    });
    return () => { annule = true; };
  }, [quittanceId]);

  useEffect(() => {
    if (state.success && state.toEmail && state.sentAt) onEnvoyee(state.toEmail, state.sentAt);
  }, [state, onEnvoyee]);

  if (chargement) return <div style={{ padding: "10px 4px", fontSize: 11.5, color: "var(--ink-soft)" }}>Préparation de l&apos;aperçu...</div>;
  if (erreurApercu) return <div style={{ padding: "10px 4px", fontSize: 11.5, color: "var(--brick)" }}>{erreurApercu}</div>;
  if (!apercu) return null;

  return (
    <form action={formAction} style={{ display: "flex", flexDirection: "column", gap: 8, padding: "12px 4px", maxWidth: 520 }}>
      <input type="hidden" name="quittance_id" value={quittanceId} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 10.5, color: "var(--ink-soft)", minWidth: 60 }}>À</label>
        <input
          type="email"
          name="to_email"
          value={toEmail}
          onChange={(e) => setToEmail(e.target.value)}
          placeholder="email du locataire"
          required
          style={{ flex: 1, fontSize: 11.5 }}
        />
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <label style={{ fontSize: 10.5, color: "var(--ink-soft)", minWidth: 60 }}>Objet</label>
        <input name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} required style={{ flex: 1, fontSize: 11.5 }} />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <label style={{ fontSize: 10.5, color: "var(--ink-soft)", minWidth: 60, paddingTop: 6 }}>Message</label>
        <textarea
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          style={{ flex: 1, fontSize: 11.5, fontFamily: "inherit", padding: 6 }}
        />
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {apercu.pdfUrl && (
          <a href={apercu.pdfUrl} target="_blank" rel="noreferrer" style={{ color: "var(--sage)", fontSize: 11.5 }}>
            Relire le PDF avant d&apos;envoyer →
          </a>
        )}
        <button
          type="submit"
          disabled={pending}
          style={{ background: "var(--sage)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          {pending ? "Envoi..." : "Envoyer"}
        </button>
      </div>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11 }}>{state.error}</div>}
    </form>
  );
}
