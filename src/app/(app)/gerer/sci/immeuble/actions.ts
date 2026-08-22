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

export async function saveFicheImmeuble(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const bienId = String(formData.get("bien_id") ?? "");
  if (!bienId) return { error: "Bien introuvable." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("biens")
    .update({
      dpe_classe: formData.get("dpe_classe") || null,
      dpe_date: formData.get("dpe_date") || null,
      monopropriete: formData.get("monopropriete") === "oui",
      numero_immatriculation_copropriete: formData.get("numero_immatriculation") || null,
      assurance_pno_compagnie: formData.get("assurance_compagnie") || null,
      assurance_pno_police: formData.get("assurance_police") || null,
      notes: formData.get("notes") || null,
      cle_repartition_defaut: formData.get("cle_repartition_defaut") || "surface",
    })
    .eq("id", bienId);

  if (error) return { error: "Erreur lors de l'enregistrement." };
  revalidatePath("/gerer/sci/immeuble");
  return { success: true };
}
