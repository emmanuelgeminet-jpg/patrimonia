"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SaveState = { error?: string; success?: boolean };

function toCentsOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = Math.round(parseFloat(String(value).replace(",", ".")) * 100);
  return Number.isNaN(n) ? null : n;
}

function toIntOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseInt(String(value), 10);
  return Number.isNaN(n) ? null : n;
}

function toNumOrNull(value: FormDataEntryValue | null): number | null {
  if (value === null || value === "") return null;
  const n = parseFloat(String(value).replace(",", "."));
  return Number.isNaN(n) ? null : n;
}

export async function creerSci(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté." };

  const nom = String(formData.get("nom") ?? "").trim();
  if (!nom) return { error: "Le nom de la SCI est obligatoire." };

  const { data, error } = await supabase.rpc("create_sci", {
    p_nom: nom,
    p_siren: formData.get("siren") || null,
    p_capital_social_cents: toCentsOrNull(formData.get("capital_social")),
    p_date_creation: formData.get("date_creation") || null,
    p_regime_fiscal: formData.get("regime_fiscal") || null,
    p_mes_parts: toIntOrNull(formData.get("mes_parts")) ?? 100,
    p_mon_pourcentage: toNumOrNull(formData.get("mon_pourcentage")) ?? 100,
  });

  if (error || !data) return { error: error?.message ?? "Erreur lors de la création." };

  revalidatePath("/", "layout");
  redirect("/gerer/sci/vision-globale");
}
