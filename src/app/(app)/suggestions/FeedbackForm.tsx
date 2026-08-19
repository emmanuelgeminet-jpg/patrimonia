"use client";

import { useActionState } from "react";
import { sendFeedback, type SendFeedbackState } from "./actions";

const initialState: SendFeedbackState = {};

export default function FeedbackForm() {
  const [state, formAction, pending] = useActionState(sendFeedback, initialState);

  return (
    <div className="card">
      <h2>Envoyer une idée</h2>
      <div className="card-sub">Ton message part directement dans la boîte à idées de l&apos;équipe qui gère l&apos;application</div>

      {state.error && <div className="auth-error">{state.error}</div>}
      {state.success && (
        <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)" }}>
          Message envoyé, merci !
        </div>
      )}

      <form action={formAction} key={state.success ? "done" : "form"}>
        <textarea
          name="message"
          required
          placeholder="Ce qui te manque, ce qui te gêne, une idée d'écran..."
          rows={4}
          style={{ width: "100%", fontFamily: "inherit", padding: 10, border: "1px solid var(--line)", borderRadius: 3, background: "var(--paper)", fontSize: 12.5, resize: "vertical" }}
        />
        <button
          type="submit"
          disabled={pending}
          style={{ marginTop: 10, background: "var(--ink)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 20, fontSize: 12.5, cursor: "pointer", fontFamily: "inherit" }}
        >
          {pending ? "..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
