import { createClient } from "@/lib/supabase/server";
import { ensureDefaultCategories, fetchAllRows } from "@/lib/budget";
import ImportCard from "./ImportCard";
import BudgetTabs from "./BudgetTabs";
import CategoriesCard from "./CategoriesCard";
import CategoryExplorer from "./CategoryExplorer";

export type Transaction = {
  id: string;
  date: string;
  libelle: string;
  montant_cents: number;
  categorie_id: string | null;
  mois_import: string | null;
  tags: string[];
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

  const [transactions, { data: categories }] = await Promise.all([
    fetchAllRows<Transaction>((from, to) =>
      supabase
        .from("budget_transactions")
        .select("id, date, libelle, montant_cents, categorie_id, mois_import, tags")
        .eq("household_id", householdId)
        .order("date", { ascending: false })
        .order("id", { ascending: true })
        .range(from, to)
    ),
    supabase.from("budget_categories").select("id, nom, groupe").eq("household_id", householdId),
  ]);

  return (
    <section className="section">
      <div className="crumb">Mon budget</div>
      <h1>Mon budget</h1>
      <div className="pagesub">
        Budget personnel du foyer — import de relevés bancaires, catégorisation, vision sur la période de ton choix
      </div>

      <ImportCard transactions={transactions} />

      <CategoriesCard categories={(categories as Category[]) ?? []} transactions={transactions} />

      <BudgetTabs transactions={transactions} categories={(categories as Category[]) ?? []} />

      <CategoryExplorer transactions={transactions} categories={(categories as Category[]) ?? []} />
    </section>
  );
}
