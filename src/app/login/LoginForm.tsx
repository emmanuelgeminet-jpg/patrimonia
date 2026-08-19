"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { signIn, signUp, type AuthState } from "./actions";

const initialState: AuthState = {};

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, initialState);

  const state = mode === "signin" ? signInState : signUpState;
  const pending = mode === "signin" ? signInPending : signUpPending;

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand">
          PATRIMONIA
          <small>{mode === "signin" ? "Connexion" : "Créer un compte"}</small>
        </div>

        {state.error && <div className="auth-error">{state.error}</div>}
        {state.info && <div className="placeholder-note">{state.info}</div>}

        <form action={mode === "signin" ? signInAction : signUpAction}>
          {mode === "signup" && (
            <div className="auth-field">
              <label htmlFor="displayName">Prénom</label>
              <input id="displayName" name="displayName" type="text" placeholder="Emmanuel" required />
            </div>
          )}
          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" placeholder="toi@exemple.fr" required />
          </div>
          <div className="auth-field">
            <label htmlFor="password">Mot de passe</label>
            <input id="password" name="password" type="password" placeholder="••••••••" required minLength={8} />
          </div>
          <button className="auth-submit" type="submit" disabled={pending}>
            {pending ? "..." : mode === "signin" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>

        {mode === "signin" && (
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 12 }}>
            <Link href="/login/reset-password" style={{ color: "var(--ink-soft)" }}>
              Mot de passe oublié ?
            </Link>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--ink-soft)" }}>
          {mode === "signin" ? (
            <>
              Pas encore de compte ?{" "}
              <span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }} onClick={() => setMode("signup")}>
                En créer un
              </span>
            </>
          ) : (
            <>
              Déjà un compte ?{" "}
              <span style={{ color: "var(--sage)", cursor: "pointer", fontWeight: 500 }} onClick={() => setMode("signin")}>
                Se connecter
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
