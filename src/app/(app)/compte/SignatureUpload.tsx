"use client";

import { useActionState, useRef, useTransition } from "react";
import { uploadSignature, removeSignature, type UploadSignatureState } from "./actions";

const initialState: UploadSignatureState = {};

export default function SignatureUpload({ currentUrl }: { currentUrl: string | null }) {
  const [state, formAction, pending] = useActionState(uploadSignature, initialState);
  const [removePending, startRemove] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div>
      {currentUrl ? (
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <img
            src={currentUrl}
            alt="Signature enregistrée"
            style={{ maxWidth: 200, maxHeight: 70, border: "1px solid var(--line)", borderRadius: 4, background: "#fff", padding: 6 }}
          />
          <span
            style={{ color: "var(--brick)", cursor: "pointer", fontSize: 11.5 }}
            onClick={() => {
              if (!window.confirm("Supprimer la signature enregistrée ?")) return;
              startRemove(() => { removeSignature(); });
            }}
          >
            {removePending ? "Suppression..." : "Supprimer"}
          </span>
        </div>
      ) : (
        <form ref={formRef} action={formAction} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <input type="file" name="file" accept="image/jpeg,.jpg,.jpeg" required style={{ fontSize: 12 }} />
          <button
            type="submit"
            disabled={pending}
            style={{ background: "var(--ink)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: 20, fontSize: 11.5, cursor: "pointer", fontFamily: "inherit" }}
          >
            {pending ? "Envoi..." : "Enregistrer"}
          </button>
        </form>
      )}
      {state.error && <div style={{ color: "var(--brick)", fontSize: 11, marginTop: 6 }}>{state.error}</div>}
    </div>
  );
}
