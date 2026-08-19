import { createClient } from "@/lib/supabase/server";
import UnitTabs from "./UnitTabs";

export default async function AppartementsPage() {
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
        <div className="crumb">Gérer <b>› Gérer mon parc › Par appartement</b></div>
        <h1>Par appartement</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>Ton foyer n&apos;est associé à aucune SCI pour le moment.</div>
      </section>
    );
  }

  const { data: biensRows } = await supabase.from("biens").select("id").eq("sci_id", sciId).eq("owner_type", "sci");
  const bienIds = (biensRows ?? []).map((b) => b.id as string);

  const { data: lotsRows } = bienIds.length
    ? await supabase.from("lots").select("*").in("bien_id", bienIds).order("nom")
    : { data: [] as { id: string; nom: string }[] };

  const lotIds = (lotsRows ?? []).map((l) => l.id as string);

  const { data: locatairesRows } = lotIds.length
    ? await supabase.from("locataires").select("*").in("lot_id", lotIds).order("date_entree", { ascending: false })
    : { data: [] as Record<string, unknown>[] };

  const lots = (lotsRows ?? []).map((l) => ({
    id: l.id as string,
    nom: l.nom as string,
    locataires: (locatairesRows ?? [])
      .filter((loc) => loc.lot_id === l.id)
      .map((loc) => ({
        id: loc.id as string,
        nom: loc.nom as string,
        dateEntree: loc.date_entree as string | null,
        dateSortie: loc.date_sortie as string | null,
        loyerHcCents: loc.loyer_hc_cents as number,
        chargesCents: loc.charges_cents as number,
        depotGarantieCents: loc.depot_garantie_cents as number | null,
        depotGarantieDate: loc.depot_garantie_date as string | null,
        depotGarantieMode: loc.depot_garantie_mode as string | null,
      })),
  }));

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Gérer mon parc › Par appartement</b></div>
      <h1>Par appartement</h1>
      <div className="pagesub">Fiche détaillée de chaque lot</div>
      <UnitTabs lots={lots} />
    </section>
  );
}
