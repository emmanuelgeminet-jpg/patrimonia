import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import PasswordForm from "./PasswordForm";
import InviteLink from "./InviteLink";
import HouseholdNameForm from "./HouseholdNameForm";
import ExportDonneesButton from "./ExportDonneesButton";
import SignatureUpload from "@/components/SignatureUpload";
import { uploadSignature, removeSignature } from "./actions";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, households(name, adresse, signature_path)")
    .eq("id", user!.id)
    .single();

  const householdId = profile?.household_id as string | undefined;
  const household = profile?.households as unknown as { name: string; adresse: string | null; signature_path: string | null } | null;
  const householdName = household?.name;
  const householdAdresse = household?.adresse;

  let signatureUrl: string | null = null;
  if (household?.signature_path) {
    const { data: signed } = await supabase.storage.from("documents").createSignedUrl(household.signature_path, 3600);
    signatureUrl = signed?.signedUrl ?? null;
  }

  return (
    <section className="section">
      <div className="crumb">Mon compte</div>
      <h1>Mon compte</h1>
      <div className="pagesub">Gère ton mot de passe de connexion et ton foyer</div>

      <div className="card">
        <h2>Ton foyer</h2>
        <div className="card-sub">
          {householdName ?? "—"} — inviter quelqu&apos;un lui donne accès à toutes les données de ce foyer
          (budget, SCI, biens...). Ne partage ce lien qu&apos;avec une personne de confiance.
        </div>
        {householdId && <InviteLink link={`${origin}/login?invite=${householdId}`} />}
        <HouseholdNameForm currentName={householdName ?? ""} currentAdresse={householdAdresse} />
      </div>

      <div className="card">
        <h2>Signature pour les quittances</h2>
        <div className="card-sub">
          Une photo ou un scan de ta signature manuscrite (JPEG ou PNG), imprimée sur les quittances des biens en nom
          propre. Attention : c&apos;est purement visuel, ça ne vaut pas une signature électronique certifiée — mieux
          qu&apos;un cadre vide, mais pas une garantie juridique équivalente à une signature manuscrite sur papier.
        </div>
        <SignatureUpload currentUrl={signatureUrl} uploadAction={uploadSignature} onRemove={removeSignature} />
      </div>

      <PasswordForm />

      <div className="card">
        <h2>Sauvegarde de tes données</h2>
        <div className="card-sub">
          Un export complet (foyer, SCI, biens, locataires, comptabilité, baux, quittances...) à garder de ton côté,
          en cas de problème. N&apos;inclut pas le contenu des fichiers PDF/photos déjà déposés — seulement leur nom
          et leur dossier ; télécharge-les séparément depuis les écrans Documents si besoin.
        </div>
        <ExportDonneesButton />
      </div>

      <div className="card">
        <Link href="/quoi-de-neuf" style={{ color: "var(--sage)", fontSize: 13 }}>Quoi de neuf dans l&apos;appli →</Link>
      </div>
    </section>
  );
}
