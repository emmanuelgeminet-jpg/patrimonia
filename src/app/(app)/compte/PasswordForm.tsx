"use client";

import { useActionState } from "react";
import { updatePassword, type UpdatePasswordState } from "./actions";

const initialState: UpdatePasswordState = {};

export default function PasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, initialState);

  return (
    <div className="card" style={{ maxWidth: 420 }}>
      <h2>Changer mon mot de passe</h2>

      {state.error && <div className="auth-error">{state.error}</div>}
      {state.success && (
        <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)" }}>
          Mot de passe mis à jour.
        </div>
      )}

      <form action={formAction} key={state.success ? "done" : "form"}>
        <div className="auth-field">
          <label htmlFor="password">Nouveau mot de passe</label>
          <input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} />
        </div>
        <div className="auth-field">
          <label htmlFor="confirmation">Confirme-le</label>
          <input id="confirmation" name="confirmation" type="password" placeholder="••••••••" required minLength={8} />
        </div>
        <button className="auth-submit" type="submit" disabled={pending} style={{ width: "auto", padding: "10px 24px" }}>
          {pending ? "..." : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}
