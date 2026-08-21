import { createClient } from "@/lib/supabase/server";
import DocumentsFolders, { type DocItem } from "./DocumentsFolders";
import QuittancesArchive, { type QuittanceArchiveItem } from "@/components/QuittancesArchive";
import BauxArchive, { type BailArchiveItem } from "@/components/BauxArchive";
import EtatsDesLieuxArchive, { type EtatDesLieuxArchiveItem } from "@/components/EtatsDesLieuxArchive";

const DOSSIERS = ["Statuts", "Assemblées générales", "Baux", "États des lieux", "Factures & justificatifs", "Assurances & diagnostics", "Quittances"];

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

  const { data: quittancesRows } = await supabase
    .from("quittances")
    .select("id, bien_adresse, lot_nom, locataire_nom, mois, loyer_hc_cents, charges_cents, date_paiement, storage_path, created_at")
    .eq("sci_id", sciId);
  const quittances = quittancesRows ?? [];
  const quittancesPaths = quittances.map((q) => q.storage_path as string);
  const { data: quittancesSignedUrls } = quittancesPaths.length
    ? await supabase.storage.from("documents").createSignedUrls(quittancesPaths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const quittancesUrlByPath = new Map((quittancesSignedUrls ?? []).map((s) => [s.path, s.signedUrl]));
  const quittancesItems: QuittanceArchiveItem[] = quittances.map((q) => ({
    id: q.id as string,
    bienAdresse: q.bien_adresse as string,
    lotNom: q.lot_nom as string,
    locataireNom: q.locataire_nom as string,
    mois: q.mois as string,
    loyerHcCents: q.loyer_hc_cents as number,
    chargesCents: q.charges_cents as number,
    dateGeneration: q.created_at as string,
    datePaiement: q.date_paiement as string | null,
    url: quittancesUrlByPath.get(q.storage_path as string) ?? null,
  }));

  const { data: bauxRows } = await supabase
    .from("baux")
    .select("id, bien_adresse, lot_nom, locataire_nom, type_bail, date_prise_effet, duree_mois, loyer_hc_cents, charges_cents, storage_path, created_at")
    .eq("sci_id", sciId);
  const baux = bauxRows ?? [];
  const bauxPaths = baux.map((b) => b.storage_path as string);
  const { data: bauxSignedUrls } = bauxPaths.length
    ? await supabase.storage.from("documents").createSignedUrls(bauxPaths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const bauxUrlByPath = new Map((bauxSignedUrls ?? []).map((s) => [s.path, s.signedUrl]));
  const bauxItems: BailArchiveItem[] = baux.map((b) => ({
    id: b.id as string,
    bienAdresse: b.bien_adresse as string,
    lotNom: b.lot_nom as string,
    locataireNom: b.locataire_nom as string,
    typeBail: b.type_bail as "non_meuble" | "meuble",
    datePriseEffet: b.date_prise_effet as string,
    dureeMois: b.duree_mois as number,
    loyerHcCents: b.loyer_hc_cents as number,
    chargesCents: b.charges_cents as number,
    dateGeneration: b.created_at as string,
    url: bauxUrlByPath.get(b.storage_path as string) ?? null,
  }));

  const { data: edlRows } = await supabase
    .from("etats_des_lieux")
    .select("id, bien_adresse, lot_nom, locataire_nom, type, date_etat_des_lieux, storage_path, created_at")
    .eq("sci_id", sciId);
  const edls = edlRows ?? [];
  const edlPaths = edls.map((e) => e.storage_path as string);
  const { data: edlSignedUrls } = edlPaths.length
    ? await supabase.storage.from("documents").createSignedUrls(edlPaths, 3600)
    : { data: [] as { path: string | null; signedUrl: string }[] };
  const edlUrlByPath = new Map((edlSignedUrls ?? []).map((s) => [s.path, s.signedUrl]));
  const edlItems: EtatDesLieuxArchiveItem[] = edls.map((e) => ({
    id: e.id as string,
    bienAdresse: e.bien_adresse as string,
    lotNom: e.lot_nom as string,
    locataireNom: e.locataire_nom as string,
    type: e.type as "entree" | "sortie",
    dateEtatDesLieux: e.date_etat_des_lieux as string,
    dateGeneration: e.created_at as string,
    url: edlUrlByPath.get(e.storage_path as string) ?? null,
  }));

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Documents</b></div>
      <h1>Documents</h1>
      <div className="pagesub">Un seul espace pour tous les justificatifs et documents de la SCI</div>

      <DocumentsFolders entityType="sci" entityId={sciId} redirectPath="/gerer/sci/documents" dossiers={DOSSIERS} documents={documents} />

      <div className="placeholder-note" style={{ marginTop: 12, marginBottom: 20 }}>
        Le dossier &quot;Quittances&quot; se remplit automatiquement quand tu génères une quittance depuis la fiche
        d&apos;un logement (onglet Par appartement). L&apos;envoi automatique par email au locataire n&apos;est pas
        encore construit — ça demande de choisir un service d&apos;envoi d&apos;email, ce qu&apos;on fera ensemble
        quand tu voudras. En attendant, tu peux télécharger la quittance ici et l&apos;envoyer toi-même.
      </div>

      <QuittancesArchive items={quittancesItems} />

      <BauxArchive items={bauxItems} />

      <EtatsDesLieuxArchive items={edlItems} />
    </section>
  );
}
