"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type ResetState = {
  error?: string;
  sent?: boolean;
};

export async function sendResetLink(_prevState: ResetState, formData: FormData): Promise<ResetState> {
  const email = String(formData.get("email") ?? "");
  const headersList = await headers();
  const origin = headersList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/compte`,
  });

  if (error) {
    return { error: "Impossible d'envoyer le lien pour le moment — réessaie dans une minute." };
  }

  return { sent: true };
}
