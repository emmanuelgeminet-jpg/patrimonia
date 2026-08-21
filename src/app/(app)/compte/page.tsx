import Link from "next/link";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import PasswordForm from "./PasswordForm";
import InviteLink from "./InviteLink";
import HouseholdNameForm from "./HouseholdNameForm";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, households(name, adresse)")
    .eq("id", user!.id)
    .single();

  const householdId = profile?.household_id as string | undefined;
  const household = profile?.households as unknown as { name: string; adresse: string | null } | null;
  const householdName = household?.name;
  const householdAdresse = household?.adresse;

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

      <PasswordForm />

      <div className="card">
        <Link href="/quoi-de-neuf" style={{ color: "var(--sage)", fontSize: 13 }}>Quoi de neuf dans l&apos;appli →</Link>
      </div>
    </section>
  );
}
