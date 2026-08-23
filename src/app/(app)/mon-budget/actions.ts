"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { parseCsv, parsePdfText, decodeFileContent, ensureDefaultCategories, fetchAllRows } from "@/lib/budget";

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
    const content = decodeFileContent(await file.arrayBuffer());
    ({ transactions, errors } = parseCsv(content));
  }

  if (transactions.length === 0) {
    if (errors.length === 0) return { error: "Aucune transaction reconnue dans ce fichier." };
    const apercu = errors.slice(0, 5).join(" ");
    return { error: `Aucune transaction reconnue. ${apercu}${errors.length > 5 ? ` (+${errors.length - 5} autre(s) problème(s))` : ""}` };
  }

  const { supabase, householdId } = await getHouseholdId();
  await ensureDefaultCategories(supabase, householdId);

  const { data: categories } = await supabase
    .from("budget_categories")
    .select("id, nom")
    .eq("household_id", householdId);
  const nonCategorise = categories?.find((c) => c.nom === "Non catégorisé")?.id ?? null;

  const dates = transactions.map((t) => t.date).sort();

  // Réutilise la catégorie déjà choisie pour un libellé identique, sinon "Non catégorisé".
  // Récupéré par pages de 1000 (fetchAllRows) : un foyer avec beaucoup d'historique peut avoir
  // plus de transactions déjà en base sur cette période que la limite par défaut d'une seule
  // requête Supabase — sans ça, les lignes au-delà de 1000 ne sont jamais reconnues comme déjà
  // présentes et se retrouvent réimportées en double.
  const libelles = [...new Set(transactions.map((t) => t.libelle))];
  const existing = await fetchAllRows<{ id: string; date: string; libelle: string; montant_cents: number; categorie_id: string | null }>(
    (from, to) =>
      supabase
        .from("budget_transactions")
        .select("id, date, libelle, montant_cents, categorie_id")
        .eq("household_id", householdId)
        .gte("date", dates[0])
        .lte("date", dates[dates.length - 1])
        .in("libelle", libelles)
        .order("id", { ascending: true })
        .range(from, to)
  );

  const guessByLibelle = new Map<string, string>();
  for (const row of existing) {
    if (!guessByLibelle.has(row.libelle) && row.categorie_id) {
      guessByLibelle.set(row.libelle, row.categorie_id);
    }
  }

  // Une transaction déjà présente (même date + libellé + montant) est
  // considérée comme un doublon — utile quand un nouvel export recouvre
  // une période déjà importée.
  const existingCounts = new Map<string, number>();
  for (const row of existing) {
    const key = `${row.date}|${row.libelle}|${row.montant_cents}`;
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  const rows: {
    household_id: string;
    date: string;
    libelle: string;
    montant_cents: number;
    categorie_id: string | null;
    mois_import: string;
    source_fichier: string;
  }[] = [];
  let doublons = 0;

  for (const t of transactions) {
    const key = `${t.date}|${t.libelle}|${t.montant_cents}`;
    const remaining = existingCounts.get(key) ?? 0;
    if (remaining > 0) {
      existingCounts.set(key, remaining - 1);
      doublons++;
      continue;
    }
    rows.push({
      household_id: householdId,
      date: t.date,
      libelle: t.libelle,
      montant_cents: t.montant_cents,
      categorie_id: guessByLibelle.get(t.libelle) ?? nonCategorise,
      mois_import: t.date.slice(0, 7),
      source_fichier: file.name,
    });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from("budget_transactions").insert(rows);
    if (error) {
      return { error: "Erreur lors de l'enregistrement — réessaie." };
    }
  }

  revalidatePath("/mon-budget");
  const parts = [`${rows.length} ligne(s) importée(s)`];
  if (doublons > 0) parts.push(`${doublons} déjà présente(s) ignorée(s)`);
  if (errors.length > 0) parts.push(`${errors.length} ligne(s) illisible(s) ignorée(s)`);
  let success = parts.join(" — ") + ".";
  // Le nombre seul ne dit pas à Emmanuel QUELLES lignes ont posé problème — sans ce détail,
  // impossible de vérifier soi-même dans le fichier d'origine si l'écart est normal ou pas.
  if (errors.length > 0) {
    const apercu = errors.slice(0, 5).join(" ");
    success += ` Détail : ${apercu}${errors.length > 5 ? ` (+${errors.length - 5} autre(s))` : ""}`;
  }
  return { success };
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

export async function updateTransactionTags(transactionId: string, tags: string[]) {
  const { supabase } = await getHouseholdId();
  await supabase.from("budget_transactions").update({ tags }).eq("id", transactionId);
  revalidatePath("/mon-budget");
}

export type CreateCategoryState = {
  error?: string;
};

export async function createCategory(_prevState: CreateCategoryState, formData: FormData): Promise<CreateCategoryState> {
  const nom = String(formData.get("nom") ?? "").trim();
  const groupe = String(formData.get("groupe") ?? "");

  if (!nom) {
    return { error: "Donne un nom à la catégorie." };
  }
  if (!["besoin", "envie", "epargne", "revenu"].includes(groupe)) {
    return { error: "Choisis un type de catégorie." };
  }
  // "revenu" n'est pas une vraie valeur de groupe (le 50/30/20 ne porte que sur les
  // dépenses) — c'est le null historique des 5 catégories de revenus par défaut.
  const groupeDb = groupe === "revenu" ? null : groupe;

  const { supabase, householdId } = await getHouseholdId();
  const { error } = await supabase
    .from("budget_categories")
    .insert({ household_id: householdId, nom, groupe: groupeDb });

  if (error) {
    return { error: "Impossible de créer cette catégorie — réessaie." };
  }

  revalidatePath("/mon-budget");
  return {};
}

export type UpdateCategoryState = { error?: string };

export async function updateCategory(_prevState: UpdateCategoryState, formData: FormData): Promise<UpdateCategoryState> {
  const id = String(formData.get("id") ?? "");
  const nom = String(formData.get("nom") ?? "").trim();
  const groupe = String(formData.get("groupe") ?? "");
  if (!id) return { error: "Catégorie introuvable." };
  if (!nom) return { error: "Donne un nom à la catégorie." };
  if (!["besoin", "envie", "epargne", "revenu"].includes(groupe)) {
    return { error: "Choisis un type de catégorie." };
  }
  const groupeDb = groupe === "revenu" ? null : groupe;

  const { supabase, householdId } = await getHouseholdId();
  const { error } = await supabase
    .from("budget_categories")
    .update({ nom, groupe: groupeDb })
    .eq("id", id)
    .eq("household_id", householdId);

  if (error) return { error: "Impossible de modifier cette catégorie — réessaie." };
  revalidatePath("/mon-budget");
  return {};
}

/** Les transactions qui utilisaient cette catégorie repassent en "non catégorisées" (FK on
 *  delete set null) — jamais supprimées, juste détachées. */
export async function deleteCategory(id: string) {
  const { supabase, householdId } = await getHouseholdId();
  await supabase.from("budget_categories").delete().eq("id", id).eq("household_id", householdId);
  revalidatePath("/mon-budget");
}

/** Vide entièrement l'historique de transactions importées du foyer — pas les catégories,
 *  qui restent (configuration, pas donnée importée). Irréversible, confirmé côté UI. */
export async function resetBudgetData() {
  const { supabase, householdId } = await getHouseholdId();
  await supabase.from("budget_transactions").delete().eq("household_id", householdId);
  revalidatePath("/mon-budget");
}
