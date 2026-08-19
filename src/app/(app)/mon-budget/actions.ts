"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv, parsePdfText, DEFAULT_CATEGORIES } from "@/lib/budget";

async function getHouseholdId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
  if (!profile) throw new Error("Profil introuvable");
  return { supabase, householdId: profile.household_id as string };
}

async function ensureDefaultCategories(
  supabase: Awaited<ReturnType<typeof createClient>>,
  householdId: string
) {
  const { count } = await supabase
    .from("budget_categories")
    .select("id", { count: "exact", head: true })
    .eq("household_id", householdId);

  if (!count) {
    await supabase
      .from("budget_categories")
      .insert(DEFAULT_CATEGORIES.map((c) => ({ household_id: householdId, nom: c.nom, groupe: c.groupe })));
  }
}

export type ImportState = {
  error?: string;
  success?: string;
};

export async function importCsv(_prevState: ImportState, formData: FormData): Promise<ImportState> {
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Choisis un fichier avant d'importer." };
  }

  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  let transactions;
  let errors: string[];

  if (isPdf) {
    const { PDFParse } = await import("pdf-parse");
    const buffer = new Uint8Array(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText({ cellSeparator: "\t" });
    await parser.destroy();
    ({ transactions, errors } = parsePdfText(result.text));
  } else {
    const content = await file.text();
    ({ transactions, errors } = parseCsv(content));
  }

  if (transactions.length === 0) {
    return { error: errors[0] ?? "Aucune transaction reconnue dans ce fichier." };
  }

  const { supabase, householdId } = await getHouseholdId();
  await ensureDefaultCategories(supabase, householdId);

  const { data: categories } = await supabase
    .from("budget_categories")
    .select("id, nom")
    .eq("household_id", householdId);
  const nonCategorise = categories?.find((c) => c.nom === "Non catégorisé")?.id ?? null;

  const dates = transactions.map((t) => t.date).sort();
  const moisImport = `${dates[0]} – ${dates[dates.length - 1]}`;

  // Réutilise la catégorie déjà choisie pour un libellé identique, sinon "Non catégorisé".
  const libelles = [...new Set(transactions.map((t) => t.libelle))];
  const { data: previous } = await supabase
    .from("budget_transactions")
    .select("libelle, categorie_id")
    .eq("household_id", householdId)
    .in("libelle", libelles)
    .not("categorie_id", "is", null)
    .order("date", { ascending: false });

  const guessByLibelle = new Map<string, string>();
  for (const row of previous ?? []) {
    if (!guessByLibelle.has(row.libelle) && row.categorie_id) {
      guessByLibelle.set(row.libelle, row.categorie_id);
    }
  }

  const rows = transactions.map((t) => ({
    household_id: householdId,
    date: t.date,
    libelle: t.libelle,
    montant_cents: t.montant_cents,
    categorie_id: guessByLibelle.get(t.libelle) ?? nonCategorise,
    mois_import: moisImport,
    source_fichier: file.name,
  }));

  const { error } = await supabase.from("budget_transactions").insert(rows);
  if (error) {
    return { error: "Erreur lors de l'enregistrement — réessaie." };
  }

  revalidatePath("/mon-budget");
  const ignored = errors.length > 0 ? ` (${errors.length} ligne(s) ignorée(s))` : "";
  return { success: `${transactions.length} ligne(s) importée(s)${ignored}.` };
}

export async function updateTransactionCategory(transactionId: string, categorieId: string) {
  const { supabase } = await getHouseholdId();
  await supabase.from("budget_transactions").update({ categorie_id: categorieId }).eq("id", transactionId);
  revalidatePath("/mon-budget");
}

export async function flipTransactionSign(transactionId: string, currentMontantCents: number) {
  const { supabase } = await getHouseholdId();
  await supabase
    .from("budget_transactions")
    .update({ montant_cents: -currentMontantCents })
    .eq("id", transactionId);
  revalidatePath("/mon-budget");
}
