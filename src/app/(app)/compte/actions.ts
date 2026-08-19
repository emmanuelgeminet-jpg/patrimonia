"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type UpdatePasswordState = {
  error?: string;
  success?: boolean;
};

export type RenameHouseholdState = {
  error?: string;
  success?: boolean;
};

export async function renameHousehold(
  _prevState: RenameHouseholdState,
  formData: FormData
): Promise<RenameHouseholdState> {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Le nom ne peut pas être vide." };
  if (name.length > 100) return { error: "Nom trop long." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) return { error: "Profil introuvable." };

  const { error } = await supabase.from("households").update({ name }).eq("id", profile.household_id);
  if (error) return { error: "Erreur lors de l'enregistrement." };

  revalidatePath("/compte");
  revalidatePath("/gerer/sci/journal");
  revalidatePath("/gerer/sci/comptes-courants");
  return { success: true };
}

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
