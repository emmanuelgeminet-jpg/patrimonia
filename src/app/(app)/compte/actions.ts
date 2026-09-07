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
  const adresse = String(formData.get("adresse") ?? "").trim();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) return { error: "Profil introuvable." };

  const { error } = await supabase.from("households").update({ name, adresse: adresse || null }).eq("id", profile.household_id);
  if (error) return { error: "Erreur lors de l'enregistrement." };

  revalidatePath("/compte");
  revalidatePath("/gerer/sci/journal");
  revalidatePath("/gerer/sci/comptes-courants");
  return { success: true };
}

export type UploadSignatureState = { error?: string; success?: boolean };
const MAX_SIGNATURE_OCTETS = 5 * 1024 * 1024; // 5 Mo

export async function uploadSignature(_prevState: UploadSignatureState, formData: FormData): Promise<UploadSignatureState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { error: "Choisis un fichier." };
  if (file.type !== "image/jpeg" && !/\.(jpe?g)$/i.test(file.name)) {
    return { error: "Seul le format JPEG est accepté." };
  }
  if (file.size > MAX_SIGNATURE_OCTETS) return { error: "Fichier trop volumineux (5 Mo maximum)." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) return { error: "Profil introuvable." };

  // Toujours le même chemin (une seule signature par foyer) : upsert remplace l'ancienne au
  // lieu d'accumuler des fichiers orphelins à chaque nouvel envoi.
  const storagePath = `hh/${profile.household_id}/signature.jpg`;
  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (uploadError) return { error: "Erreur lors de l'envoi du fichier." };

  const { error: dbError } = await supabase.from("households").update({ signature_path: storagePath }).eq("id", profile.household_id);
  if (dbError) return { error: "Erreur lors de l'enregistrement." };

  revalidatePath("/compte");
  return { success: true };
}

export async function removeSignature() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) return;

  const { data: household } = await supabase.from("households").select("signature_path").eq("id", profile.household_id).single();
  if (household?.signature_path) {
    await supabase.storage.from("documents").remove([household.signature_path as string]);
  }
  await supabase.from("households").update({ signature_path: null }).eq("id", profile.household_id);
  revalidatePath("/compte");
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
