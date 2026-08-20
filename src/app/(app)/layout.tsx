import { createClient } from "@/lib/supabase/server";
import Sidebar from "./Sidebar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = user?.email ?? "";
  let biensPropresItems: { id: string; label: string }[] = [];
  let sciNom: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, household_id")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name || user.email || "";

    if (profile?.household_id) {
      const [{ data: biensRows }, { data: associe }] = await Promise.all([
        supabase
          .from("biens")
          .select("id, adresse, ville")
          .eq("household_id", profile.household_id)
          .eq("owner_type", "propre"),
        supabase
          .from("sci_associes")
          .select("sci_id")
          .eq("household_id", profile.household_id)
          .limit(1)
          .maybeSingle(),
      ]);

      biensPropresItems = (biensRows ?? []).map((b) => ({
        id: b.id as string,
        label: [b.adresse, b.ville].filter(Boolean).join(", "),
      }));

      if (associe?.sci_id) {
        const { data: sci } = await supabase.from("sci").select("name").eq("id", associe.sci_id).single();
        sciNom = (sci?.name as string | undefined) ?? null;
      }
    }
  }

  return (
    <div className="app">
      <Sidebar displayName={displayName} biensPropresItems={biensPropresItems} sciNom={sciNom} />
      <main>{children}</main>
    </div>
  );
}
