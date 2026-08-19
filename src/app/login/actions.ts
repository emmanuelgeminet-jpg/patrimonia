"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  info?: string;
};

export async function signIn(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  redirect("/");
}

export async function signUp(_prevState: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "");
  const inviteCode = String(formData.get("inviteCode") ?? "").trim();

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
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
