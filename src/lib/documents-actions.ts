"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

const ALLOWED_ENTITY_TYPES = ["emprunt", "patrimoine_ligne", "household", "sci", "bien", "lot"] as const;
type EntityType = (typeof ALLOWED_ENTITY_TYPES)[number];

const MAX_SIZE_OCTETS = 15 * 1024 * 1024; // 15 Mo

function isEntityType(value: string): value is EntityType {
  return (ALLOWED_ENTITY_TYPES as readonly string[]).includes(value);
}

export async function uploadDocument(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const entityType = String(formData.get("entity_type") ?? "");
  const entityId = String(formData.get("entity_id") ?? "");
  const file = formData.get("file") as File | null;
  const redirectPath = String(formData.get("redirect_path") ?? "/investir/profil");

  if (!isEntityType(entityType)) return { error: "Type de document invalide." };
  if (!entityId) return { error: "Élément associé introuvable." };
  if (!file || file.size === 0) return { error: "Choisis un fichier." };
  if (file.size > MAX_SIZE_OCTETS) return { error: "Fichier trop volumineux (15 Mo maximum)." };

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) return { error: "Profil introuvable." };

  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  // Les documents liés à une SCI doivent être rangés sous le préfixe "sci/" pour rester
  // visibles par tous les foyers associés (pas seulement celui qui les a envoyés) —
  // voir la policy Storage "documents bucket - acces".
  const storagePath =
    entityType === "sci"
      ? `sci/${entityId}/${Date.now()}_${safeName}`
      : `hh/${profile.household_id}/${entityType}/${entityId}/${Date.now()}_${safeName}`;

  const { error: uploadError } = await supabase.storage.from("documents").upload(storagePath, file, {
    contentType: file.type || undefined,
  });
  if (uploadError) return { error: "Erreur lors de l'envoi du fichier." };

  const dossier = String(formData.get("dossier") ?? "") || entityType;

  const { error: dbError } = await supabase.from("documents").insert({
    entity_type: entityType,
    entity_id: entityId,
    dossier,
    nom_fichier: file.name,
    storage_path: storagePath,
    taille_octets: file.size,
    uploaded_by: user.id,
  });

  if (dbError) {
    await supabase.storage.from("documents").remove([storagePath]);
    return { error: "Erreur lors de l'enregistrement." };
  }

  revalidatePath(redirectPath);
  return { success: true };
}

export async function deleteDocument(id: string, redirectPath = "/investir/profil") {
  const supabase = await createClient();
  const { data: doc } = await supabase.from("documents").select("storage_path").eq("id", id).single();
  if (!doc) return;

  await supabase.storage.from("documents").remove([doc.storage_path]);
  await supabase.from("documents").delete().eq("id", id);
  revalidatePath(redirectPath);
}
