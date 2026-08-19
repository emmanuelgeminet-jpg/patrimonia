import { createClient } from "@/lib/supabase/server";
import Sidebar from "./Sidebar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let displayName = user?.email ?? "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    displayName = profile?.display_name || user.email || "";
  }

  return (
    <div className="app">
      <Sidebar displayName={displayName} />
      <main>{children}</main>
    </div>
  );
}
