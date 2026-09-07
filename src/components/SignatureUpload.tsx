"use client";

import { useActionState, useRef, useTransition } from "react";

export type UploadSignatureState = { error?: string; success?: boolean };

const initialState: UploadSignatureState = {};

/**
 * Composant partagé entre la signature du foyer (biens propres, Mon compte) et celle du gérant
 * de la SCI (Informations de la SCI) — même UI, actions serveur différentes passées en props,
 * pour ne pas maintenir deux copies presque identiques.
 */
export default function SignatureUpload({
  currentUrl,
  uploadAction,
  onRemove,
}: {
  currentUrl: string | null;
  uploadAction: (prevState: UploadSignatureState, formData: FormData) => Promise<UploadSignatureState>;
  onRemove: () => void | Promise<void>;
}) {
  const [state, formAction, pending] = useActionState(uploadAction, initialState);
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
              startRemove(() => { onRemove(); });
            }}
          >
            {removePending ? "Suppression..." : "Supprimer"}
          </span>
        </div>
      ) : (
        <form ref={formRef} action={formAction} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {/* Filtre volontairement large ("toutes les images") plutôt qu'une liste précise de
              types/extensions : certains systèmes appliquent mal un filtre combiné MIME +
              extensions et masquent des fichiers pourtant valides dans la fenêtre "Parcourir"
              (constaté avec un PNG) — la vérification stricte JPEG/PNG se fait de toute façon
              côté serveur (resolveSignatureFile), ce filtre n'est qu'un confort visuel. */}
          <input type="file" name="file" accept="image/*" required style={{ fontSize: 12 }} />
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
