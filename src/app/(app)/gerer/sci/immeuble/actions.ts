"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

export async function saveCaracteristiques(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const bienId = String(formData.get("bien_id") ?? "");
  if (!bienId) return { error: "Bien introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("biens")
    .update({
      prix_acquisition_cents: toCentsOrNull(formData.get("prix_acquisition")),
      date_acquisition: formData.get("date_acquisition") || null,
    })
    .eq("id", bienId);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/gerer/sci/immeuble");
  return { success: true };
}
