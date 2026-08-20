import { createClient } from "@/lib/supabase/server";
import CarnetVisite from "./CarnetVisite";
import DocumentsCell, { type DocItem } from "@/app/(app)/investir/profil/DocumentsCell";

export default async function CarnetVisitePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: docsRows } = await supabase
    .from("documents")
    .select("id, nom_fichier, storage_path")
    .eq("entity_type", "household")
    .eq("entity_id", householdId);

  const docs = docsRows ?? [];
  const paths = docs.map((d) => d.storage_path as string);
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from("documents").createSignedUrls(paths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const documents: DocItem[] = docs.map((d) => ({
    id: d.id as string,
    nom_fichier: d.nom_fichier as string,
    url: urlByPath.get(d.storage_path as string) ?? null,
  }));

  return (
    <section className="section">
      <div className="crumb">Analyser un bien <b>› Investir › Carnet de visite</b></div>
      <h1>Carnet de visite</h1>
      <div className="pagesub">Checklist experte — 12 thématiques, à cocher en visite ou contre-visite</div>
      <CarnetVisite />

      <div className="card">
        <h2>Documents de visite <span className="tag">photos, diagnostics, notes...</span></h2>
        <div className="card-sub">Squelette — pas encore lié à une visite précise (ça viendra avec la reprise complète de cet écran), mais tu peux déjà déposer ce que tu ramènes de tes visites</div>
        <DocumentsCell entityType="household" entityId={householdId} documents={documents} />
      </div>
    </section>
  );
}
