"use server";

import { createClient } from "@/lib/supabase/server";

export type UpdatePasswordState = {
  error?: string;
  success?: boolean;
};

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  if (password.length < 8) {
    return { error: "Le mot de passe doit contenir au moins 8 caractères." };
  }
  if (password !== confirmation) {
    return { error: "Les deux mots de passe ne sont pas identiques." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Impossible de mettre à jour le mot de passe — reconnecte-toi et réessaie." };
  }

  return { success: true };
}
