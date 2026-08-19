import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories } from "@/lib/budget";
import ImportCard from "./ImportCard";
import BudgetTabs from "./BudgetTabs";
import NewCategoryForm from "./NewCategoryForm";
import CategoryExplorer from "./CategoryExplorer";

export type Transaction = {
  id: string;
  date: string;
  libelle: string;
  montant_cents: number;
  categorie_id: string | null;
  mois_import: string | null;
};

export type Category = {
  id: string;
  nom: string;
  groupe: "besoin" | "envie" | "epargne" | null;
};

export default async function MonBudgetPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id")
    .eq("id", user!.id)
    .single();

  const householdId = profile?.household_id;
  if (householdId) await ensureDefaultCategories(supabase, householdId);

  const [{ data: transactions }, { data: categories }] = await Promise.all([
    supabase
      .from("budget_transactions")
      .select("id, date, libelle, montant_cents, categorie_id, mois_import")
      .eq("household_id", householdId)
      .order("date", { ascending: false }),
    supabase.from("budget_categories").select("id, nom, groupe").eq("household_id", householdId),
  ]);

  return (
    <section className="section">
      <div className="crumb">Mon budget</div>
      <h1>Mon budget</h1>
      <div className="pagesub">
        Budget personnel du foyer — import de relevés bancaires, catégorisation, vision 1 mois à 5 ans
      </div>

      <ImportCard transactions={(transactions as Transaction[]) ?? []} />

      <div className="card">
        <h2>Catégories</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
          {(categories as Category[] | null)?.map((c) => (
            <span key={c.id} className="pill" style={{ background: "var(--paper)", color: "var(--ink-soft)" }}>
              {c.nom}
            </span>
          ))}
        </div>
        <NewCategoryForm />
      </div>

      <BudgetTabs
        transactions={(transactions as Transaction[]) ?? []}
        categories={(categories as Category[]) ?? []}
      />

      <CategoryExplorer
        transactions={(transactions as Transaction[]) ?? []}
        categories={(categories as Category[]) ?? []}
      />
    </section>
  );
}
