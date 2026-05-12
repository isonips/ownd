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
          (payload) => {
            const oldRow = payload.old as any;
            const newRow = payload.new as any;
            if (oldRow.owner_id === me && newRow.owner_id && newRow.owner_id !== me) {
              setMsg("STOLEN! Someone took one of your streets.");
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
      className="toast text-white flex items-center gap-2"
      style={{
        background: "linear-gradient(180deg,#FF6A6A,#D43F3F)",
        boxShadow: "0 14px 40px rgba(239,68,68,0.5)",
      }}
    >
      <span>⚠️</span>
      <span>{msg}</span>
    </div>
  );
}
