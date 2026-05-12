import { supabaseServer } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

export async function safeGetUser(): Promise<User | null> {
  try {
    const supabase = supabaseServer();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
