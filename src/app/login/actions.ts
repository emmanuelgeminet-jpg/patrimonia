"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  info?: string;
  /** Rempli uniquement quand la connexion échoue parce que l'email n'est pas confirmé —
   *  permet d'afficher un bouton "renvoyer l'email" avec la bonne adresse déjà en main. */
  unconfirmedEmail?: string;
};

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "Ton adresse email n'a pas encore été confirmée.", unconfirmedEmail: email };
    }
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/");
}

export async function resendConfirmation(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  if (!email) return { error: "Email manquant." };

  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });

  if (error) return { error: "Impossible de renvoyer l'email — réessaie dans quelques minutes.", unconfirmedEmail: email };
  return { info: "Email de confirmation renvoyé — pense à vérifier tes indésirables.", unconfirmedEmail: email };
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/confirm`,
      data: {
        display_name: displayName,
        ...(inviteCode ? { invite_household_id: inviteCode } : {}),
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return { info: "Compte créé — vérifie ta boîte mail pour confirmer ton adresse avant de te connecter." };
  }

  redirect("/");
}
