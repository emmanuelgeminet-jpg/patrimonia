import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'arrivée du lien de confirmation envoyé par email (inscription, réinitialisation
 * de mot de passe...). Sans cette route, le lien de Supabase ramenait sur le site sans jamais
 * établir de session côté serveur (l'appli utilise des cookies via @supabase/ssr, pas le
 * stockage local par défaut) — la personne se retrouvait sur l'écran de connexion, confirmée
 * en base mais pas connectée, d'où l'impression de "connexion impossible".
 *
 * Gère les deux formats que Supabase peut produire ici, sans dépendre du contenu du template
 * d'email (verrouillé sur le plan gratuit tant qu'aucun SMTP personnalisé n'est configuré) :
 * - `code` (flux PKCE, le comportement par défaut d'un projet Supabase récent, y compris avec
 *   le template email non modifié) → exchangeCodeForSession.
 * - `token_hash` + `type` (flux OTP classique, si le template email est un jour personnalisé
 *   pour pointer directement ici) → verifyOtp.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/";
  const supabase = await createClient();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  return NextResponse.redirect(`${origin}/login?error=Lien de confirmation invalide ou expiré`);
}
