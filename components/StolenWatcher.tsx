"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function StolenWatcher() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = supabaseBrowser();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      const { data } = await supabase.auth.getUser();
      const me = data.user?.id;
      if (!me) return;
      channel = supabase
        .channel("territory-changes")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "territory" },
          (payload: any) => {
            const oldRow = payload.old;
            const newRow = payload.new;
            if (oldRow.owner_id === me && newRow.owner_id && newRow.owner_id !== me) {
              setMsg("A street was stolen from you.");
              setTimeout(() => setMsg(null), 4000);
            }
          },
        )
        .subscribe();
    })();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (!msg) return null;
  return (
    <div
      className="toast flex items-center gap-2"
      style={{
        background: "rgba(229,72,77,0.16)",
        borderColor: "rgba(229,72,77,0.45)",
        color: "#FFCFCF",
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: "#FF5757" }}
      />
      <span>{msg}</span>
    </div>
  );
}
