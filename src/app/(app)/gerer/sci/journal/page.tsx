import { createClient } from "@/lib/supabase/server";
import JournalTabs from "./JournalTabs";

export default async function JournalPage() {
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
        <div className="crumb">Gérer <b>› Journal comptable</b></div>
        <h1>Journal comptable</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>Ton foyer n&apos;est associé à aucune SCI pour le moment.</div>
      </section>
    );
  }

  const [
    { data: sci },
    { data: associesRows },
    { data: biensRows },
    { data: ecrituresRows },
    { data: mouvementsRows },
  ] = await Promise.all([
    supabase.from("sci").select("*").eq("id", sciId).single(),
    supabase.from("sci_associes").select("household_id, solde_ouverture_cents, households(name)").eq("sci_id", sciId),
    supabase.from("biens").select("id, adresse, type").eq("sci_id", sciId).eq("owner_type", "sci"),
    supabase.from("journal_ecritures").select("*").eq("sci_id", sciId).order("date", { ascending: false }),
    supabase.from("comptes_courants_mouvements").select("*").eq("sci_id", sciId).order("date", { ascending: false }),
  ]);

  const ecritures = ecrituresRows ?? [];
  const paths = ecritures.map((e) => e.justificatif_path as string | null).filter((p): p is string => !!p);
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from("documents").createSignedUrls(paths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const associes = (associesRows ?? []).map((a) => ({
    householdId: a.household_id as string,
    nom: (a.households as unknown as { name: string } | null)?.name ?? "Foyer",
    soldeOuvertureCents: a.solde_ouverture_cents as number,
  }));

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Journal comptable</b></div>
      <h1>Journal comptable</h1>
      <div className="pagesub">Reprend la structure de ton fichier — mois par mois, avec bilan annuel et bilan global</div>
      <JournalTabs
        sci={{
          id: sci!.id as string,
          soldeOuvertureCents: sci!.solde_ouverture_cents as number,
          soldeOuvertureDate: sci!.solde_ouverture_date as string | null,
        }}
        biens={(biensRows ?? []).map((b) => ({ id: b.id as string, label: b.adresse as string }))}
        ecritures={ecritures.map((e) => ({
          id: e.id as string,
          date: e.date as string,
          type: e.type as "encaissement" | "decaissement",
          montantCents: e.montant_cents as number,
          libelle: e.libelle as string,
          modePaiement: e.mode_paiement as string | null,
          bienId: e.bien_id as string | null,
          commentaire: e.commentaire as string | null,
          justificatifPath: e.justificatif_path as string | null,
          justificatifUrl: e.justificatif_path ? urlByPath.get(e.justificatif_path as string) ?? null : null,
        }))}
        associes={associes}
        mouvements={(mouvementsRows ?? []).map((m) => ({
          id: m.id as string,
          householdId: m.household_id as string,
          date: m.date as string,
          type: m.type as "apport" | "avance" | "remboursement",
          montantCents: m.montant_cents as number,
        }))}
      />
    </section>
  );
}
