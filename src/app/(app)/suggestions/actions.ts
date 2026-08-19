"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SendFeedbackState = {
  error?: string;
  success?: boolean;
};

export async function sendFeedback(_prevState: SendFeedbackState, formData: FormData): Promise<SendFeedbackState> {
  const message = String(formData.get("message") ?? "").trim();
  if (!message) {
    return { error: "Écris un message avant d'envoyer." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Non connecté." };
  }

  const { error } = await supabase.from("feedback_messages").insert({ author_id: user.id, message });
  if (error) {
    return { error: "Impossible d'envoyer le message — réessaie." };
  }

  revalidatePath("/suggestions");
  return { success: true };
}
