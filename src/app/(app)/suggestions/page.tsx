import { createClient } from "@/lib/supabase/server";
import FeedbackForm from "./FeedbackForm";

export default async function SuggestionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user!.id).single();
  const isAdmin = profile?.is_admin ?? false;

  const { data: messages } = await supabase
    .from("feedback_messages")
    .select("id, message, created_at, profiles(display_name)")
    .order("created_at", { ascending: false });

  const { data: usersRows } = isAdmin
    ? await supabase
        .from("profiles")
        .select("id, display_name, email, created_at, households(name)")
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <section className="section">
      <div className="crumb">Suggestions</div>
      <h1>Suggestions</h1>
      <div className="pagesub">
        {isAdmin
          ? "Boîte à idées — visible uniquement par toi en tant qu'administrateur"
          : "Une idée, une amélioration à proposer ? Envoie un message."}
      </div>

      <FeedbackForm />

      {isAdmin && (
        <div className="card">
          <h2>Utilisateurs inscrits <span className="tag">{usersRows?.length ?? 0}</span></h2>
          {!usersRows || usersRows.length === 0 ? (
            <div className="empty" style={{ padding: "20px 4px" }}>Aucun utilisateur pour l&apos;instant</div>
          ) : (
            <table>
              <thead><tr><th>Foyer</th><th>Nom</th><th>Email</th><th>Inscrit le</th></tr></thead>
              <tbody>
                {usersRows.map((u) => (
                  <tr key={u.id}>
                    <td>{(u.households as unknown as { name: string } | null)?.name ?? "—"}</td>
                    <td>{u.display_name ?? "—"}</td>
                    <td>{u.email ?? "—"}</td>
                    <td>{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="card-sub" style={{ marginTop: 8 }}>
            Visibilité uniquement — pas encore de suspension/suppression de compte depuis cet écran (à voir ensemble
            si le besoin se présente, vu que c&apos;est irréversible).
          </div>
        </div>
      )}

      <div className="card">
        <h2>{isAdmin ? "Tous les messages reçus" : "Tes messages envoyés"}</h2>
        {!messages || messages.length === 0 ? (
          <div className="empty" style={{ padding: "20px 4px" }}>Aucun message pour l&apos;instant</div>
        ) : (
          <table>
            <thead>
              <tr>
                {isAdmin && <th>De</th>}
                <th>Message</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {messages.map((m) => (
                <tr key={m.id}>
                  {isAdmin && <td>{(m.profiles as unknown as { display_name: string } | null)?.display_name ?? "—"}</td>}
                  <td style={{ whiteSpace: "pre-wrap" }}>{m.message}</td>
                  <td className="num">{new Date(m.created_at).toLocaleDateString("fr-FR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
