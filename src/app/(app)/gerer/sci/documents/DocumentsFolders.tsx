"use client";

import { useActionState, useRef, useTransition } from "react";
import { uploadDocument, deleteDocument, type SaveState } from "@/lib/documents-actions";

export type DocItem = { id: string; nomFichier: string; url: string | null; dossier: string };

const initialState: SaveState = {};

export default function DocumentsFolders({
  sciId,
  dossiers,
  documents,
}: {
  sciId: string;
  dossiers: string[];
  documents: DocItem[];
}) {
  return (
    <div className="grid2">
      {dossiers.map((d) => (
        <FolderCard key={d} sciId={sciId} dossier={d} documents={documents.filter((doc) => doc.dossier === d)} />
      ))}
    </div>
  );
}

function FolderCard({ sciId, dossier, documents }: { sciId: string; dossier: string; documents: DocItem[] }) {
  const [state, formAction, pending] = useActionState(uploadDocument, initialState);
  const [, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="card">
      <h2>{dossier} <span className="tag">{documents.length} fichier{documents.length !== 1 ? "s" : ""}</span></h2>

      {documents.length === 0 ? (
        <div style={{ color: "var(--ink-soft)", fontStyle: "italic", fontSize: 12 }}>Aucun fichier</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {documents.map((d) => (
            <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              {d.url ? (
                <a href={d.url} target="_blank" rel="noreferrer" style={{ color: "var(--sage)" }}>📎 {d.nomFichier}</a>
              ) : (
                <span style={{ color: "var(--ink-soft)" }}>📎 {d.nomFichier}</span>
              )}
              <span
                style={{ color: "var(--brick)", cursor: "pointer" }}
                onClick={() => startTransition(() => { deleteDocument(d.id, "/gerer/sci/documents"); })}
              >
                ×
              </span>
            </div>
          ))}
        </div>
      )}

      <form ref={formRef} action={formAction} style={{ marginTop: 10 }}>
        <input type="hidden" name="entity_type" value="sci" />
        <input type="hidden" name="entity_id" value={sciId} />
        <input type="hidden" name="dossier" value={dossier} />
        <input type="hidden" name="redirect_path" value="/gerer/sci/documents" />
        <label style={{ fontSize: 11.5, color: "var(--brick)", cursor: "pointer", textDecoration: "underline" }}>
          {pending ? "Envoi..." : "+ ajouter un fichier"}
          <input type="file" name="file" style={{ display: "none" }} onChange={() => formRef.current?.requestSubmit()} />
        </label>
      </form>
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 4 }}>{state.error}</div>}
    </div>
  );
}
