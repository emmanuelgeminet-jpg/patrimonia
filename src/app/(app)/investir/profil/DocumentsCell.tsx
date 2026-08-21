"use client";

import { useActionState, useRef, useTransition } from "react";
import { uploadDocument, deleteDocument, type SaveState } from "@/lib/documents-actions";

export type DocItem = { id: string; nom_fichier: string; url: string | null };

const initialState: SaveState = {};

export default function DocumentsCell({
  entityType,
  entityId,
  documents,
}: {
  entityType: string;
  entityId: string;
  documents: DocItem[];
}) {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 110 }}>
      {documents.map((d) => (
        <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
          {d.url ? (
            <a
              href={d.url}
              target="_blank"
              rel="noreferrer"
              title={d.nom_fichier}
              style={{ color: "var(--sage)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}
            >
              📎 {d.nom_fichier}
            </a>
          ) : (
            <span style={{ color: "var(--ink-soft)" }}>📎 {d.nom_fichier}</span>
          )}
          <span
            style={{ color: "var(--brick)", cursor: "pointer", flexShrink: 0 }}
            onClick={() => {
              if (!window.confirm(`Supprimer "${d.nom_fichier}" ? Cette action est irréversible.`)) return;
              startTransition(() => { deleteDocument(d.id); });
            }}
          >
            ×
          </span>
        </div>
      ))}
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="entity_type" value={entityType} />
        <input type="hidden" name="entity_id" value={entityId} />
        <label style={{ fontSize: 10.5, color: "var(--ink-soft)", cursor: "pointer", textDecoration: "underline" }}>
          {pending ? "Envoi..." : "+ document"}
          <input
            type="file"
            name="file"
            style={{ display: "none" }}
            onChange={() => formRef.current?.requestSubmit()}
          />
        </label>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 10 }}>{state.error}</div>}
    </div>
  );
}
