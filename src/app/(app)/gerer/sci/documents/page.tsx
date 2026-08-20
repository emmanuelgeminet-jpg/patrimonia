import { createClient } from "@/lib/supabase/server";
import DocumentsFolders, { type DocItem } from "./DocumentsFolders";

const DOSSIERS = ["Statuts", "Assemblées générales", "Factures & justificatifs", "Assurances & diagnostics", "Quittances"];

export default async function DocumentsPage() {
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
        <div className="crumb">Gérer <b>› Documents</b></div>
        <h1>Documents</h1>
        <div className="empty" style={{ padding: "20px 4px" }}>Ton foyer n&apos;est associé à aucune SCI pour le moment.</div>
      </section>
    );
  }

  const { data: docsRows } = await supabase
    .from("documents")
    .select("id, dossier, nom_fichier, storage_path")
    .eq("entity_type", "sci")
    .eq("entity_id", sciId);

  const docs = docsRows ?? [];
  const paths = docs.map((d) => d.storage_path as string);
  const { data: signedUrls } = paths.length
    ? await supabase.storage.from("documents").createSignedUrls(paths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const urlByPath = new Map((signedUrls ?? []).map((s) => [s.path, s.signedUrl]));

  const documents: DocItem[] = docs.map((d) => ({
    id: d.id as string,
    nomFichier: d.nom_fichier as string,
    dossier: DOSSIERS.includes(d.dossier as string) ? (d.dossier as string) : DOSSIERS[DOSSIERS.length - 1],
    url: urlByPath.get(d.storage_path as string) ?? null,
  }));

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Documents</b></div>
      <h1>Documents</h1>
      <div className="pagesub">Un seul espace pour tous les justificatifs et documents de la SCI</div>

      <DocumentsFolders sciId={sciId} dossiers={DOSSIERS} documents={documents} />

      <div className="placeholder-note" style={{ marginTop: 12 }}>
        Le dossier &quot;Quittances&quot; se remplit automatiquement quand tu génères une quittance depuis la fiche
        d&apos;un logement (onglet Par appartement). L&apos;envoi automatique par email au locataire n&apos;est pas
        encore construit — ça demande de choisir un service d&apos;envoi d&apos;email, ce qu&apos;on fera ensemble
        quand tu voudras. En attendant, tu peux télécharger la quittance ici et l&apos;envoyer toi-même.
      </div>
    </section>
  );
}
