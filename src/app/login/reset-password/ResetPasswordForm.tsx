"use client";

import { useActionState } from "react";
import Link from "next/link";
import { sendResetLink, type ResetState } from "./actions";

const initialState: ResetState = {};

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(sendResetLink, initialState);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          PATRIMONIA
          <small>Mot de passe oublié</small>
        </div>

        {state.error && <div className="auth-error">{state.error}</div>}
        {state.sent ? (
          <div className="placeholder-note" style={{ background: "var(--sage-soft)", color: "var(--sage)" }}>
            Si un compte existe avec cette adresse, un email vient d&apos;être envoyé avec un lien pour choisir un nouveau mot de passe.
          </div>
        ) : (
          <form action={formAction}>
            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" placeholder="toi@exemple.fr" required />
            </div>
            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? "..." : "Envoyer le lien"}
            </button>
          </form>
        )}

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--ink-soft)" }}>
          <Link href="/login" style={{ color: "var(--sage)", fontWeight: 500 }}>
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  );
}
