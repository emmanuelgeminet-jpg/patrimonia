import { createClient } from "@/lib/supabase/server";
import ComptesCourantsClient from "./ComptesCourantsClient";

export default async function ComptesCourantsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: associeRow } = await supabase
    .from("sci_associes")
    .select("sci_id")
    .eq("household_id", householdId)
    .limit(1)
    .maybeSingle();
  const sciId = associeRow?.sci_id as string | undefined;

  if (!sciId) {
    return (
      <section className="section">
        <div className="crumb">Gérer <b>› Comptes courants</b></div>
        <h1>Comptes courants associés</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>Ton foyer n&apos;est associé à aucune SCI pour le moment.</div>
      </section>
    );
  }

  const [{ data: associesRows }, { data: mouvementsRows }] = await Promise.all([
    supabase.from("sci_associes").select("household_id, solde_ouverture_cents, households(name)").eq("sci_id", sciId),
    supabase.from("comptes_courants_mouvements").select("*").eq("sci_id", sciId).order("date", { ascending: false }),
  ]);

  const associes = (associesRows ?? []).map((a) => ({
    householdId: a.household_id as string,
    nom: (a.households as unknown as { name: string } | null)?.name ?? "Foyer",
    soldeOuvertureCents: a.solde_ouverture_cents as number,
  }));

  const mouvements = (mouvementsRows ?? []).map((m) => ({
    id: m.id as string,
    householdId: m.household_id as string,
    date: m.date as string,
    type: m.type as "apport" | "avance" | "remboursement",
    montantCents: m.montant_cents as number,
    commentaire: m.commentaire as string | null,
  }));

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Comptes courants</b></div>
      <h1>Comptes courants associés</h1>
      <div className="pagesub">Suivi des apports, avances de frais et remboursements</div>
      <ComptesCourantsClient associes={associes} mouvements={mouvements} />
    </section>
  );
}
