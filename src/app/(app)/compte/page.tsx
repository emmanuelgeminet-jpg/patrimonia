import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import PasswordForm from "./PasswordForm";
import InviteLink from "./InviteLink";

export default async function ComptePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const host = (await headers()).get("host") ?? "";
  const origin = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;

  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, households(name)")
    .eq("id", user!.id)
    .single();

  const householdId = profile?.household_id as string | undefined;
  const householdName = (profile?.households as unknown as { name: string } | null)?.name;

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
      </div>

      <PasswordForm />
    </section>
  );
}
