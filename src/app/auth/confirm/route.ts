import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Point d'arrivée du lien de confirmation envoyé par email (inscription, réinitialisation
 * de mot de passe...). Sans cette route, le lien de Supabase ramenait sur le site sans jamais
 * établir de session côté serveur (l'appli utilise des cookies via @supabase/ssr, pas le
 * stockage local par défaut) — la personne se retrouvait sur l'écran de connexion, confirmée
 * en base mais pas connectée, d'où l'impression de "connexion impossible".
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Lien de confirmation invalide ou expiré`);
}
