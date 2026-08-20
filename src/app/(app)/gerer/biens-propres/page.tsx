import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BiensPropresListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();
  const householdId = profile?.household_id as string;

  const { data: biensRows } = await supabase
    .from("biens")
    .select("id, adresse, ville, type")
    .eq("household_id", householdId)
    .eq("owner_type", "propre")
    .order("created_at");

  return (
    <section className="section">
      <div className="crumb">Gestion immobilière <b>› Biens propres</b></div>
      <h1>Biens propres</h1>
      <div className="pagesub">Tes biens locatifs détenus en nom propre, hors SCI</div>

      <div className="card">
        {(biensRows ?? []).length === 0 ? (
          <div className="empty">
            <div className="big">Aucun bien propre pour l&apos;instant</div>
            Ajoute-en un depuis &quot;Rentrer un nouveau bien&quot; en choisissant &quot;Bien propre&quot; comme mode de détention.
          </div>
        ) : (
          <table>
            <thead><tr><th>Adresse</th><th>Type</th><th></th></tr></thead>
            <tbody>
              {(biensRows ?? []).map((b) => (
                <tr key={b.id as string}>
                  <td>{[b.adresse, b.ville].filter(Boolean).join(", ")}</td>
                  <td>{b.type as string}</td>
                  <td><Link href={`/gerer/biens-propres/${b.id}`} className="tag" style={{ color: "var(--brick)" }}>Ouvrir</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
