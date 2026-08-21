import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreerSciForm from "./CreerSciForm";

export default async function CreerSciPage() {
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

  if (associeRow?.sci_id) {
    redirect("/gerer/sci/vision-globale");
  }

  return (
    <section className="section">
      <div className="crumb">Gérer <b>› Créer une SCI</b></div>
      <h1>Créer une SCI</h1>
      <div className="pagesub">Ton foyer n&apos;est associé à aucune SCI pour le moment — crée-en une pour commencer à suivre son journal comptable, ses biens et ses associés.</div>

      <CreerSciForm />
    </section>
  );
}
