"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "#6DD0A9" : "rgba(255,255,255,0.6)";
  const common = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke, strokeWidth: 2.1, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "home":
      return (<svg {...common}><path d="M3 11.5 12 4l9 7.5" /><path d="M5 10v9h14v-9" /></svg>);
    case "map":
      return (<svg {...common}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z" /><path d="M9 4v14M15 6v14" /></svg>);
    case "run":
      return (<svg {...common}><circle cx="13" cy="4.5" r="2" /><path d="M5 20l3-5 4-2-2-4 4 1 2 3 3-1" /></svg>);
    case "board":
      return (<svg {...common}><path d="M6 21V10M12 21V4M18 21v-7" /></svg>);
    case "shop":
      return (<svg {...common}><path d="M4 8h16l-1.5 11a2 2 0 0 1-2 1.7H7.5a2 2 0 0 1-2-1.7L4 8Z" /><path d="M9 8a3 3 0 0 1 6 0" /></svg>);
  }
  return null;
}

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/map", label: "Map", icon: "map" },
  { href: "/run", label: "Run", icon: "run", primary: true },
  { href: "/leaderboard", label: "Board", icon: "board" },
  { href: "/shop", label: "Shop", icon: "shop" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      <ul className="grid grid-cols-5 items-end max-w-md mx-auto">
        {items.map((it) => {
          const active = path === it.href;
          if (it.primary) {
            return (
              <li key={it.href} className="flex justify-center">
                <Link
                  href={it.href}
                  aria-label={it.label}
                  className="-mt-8 grid place-items-center w-16 h-16 rounded-full"
                  style={{
                    background: "linear-gradient(180deg,#7CE6BE 0%,#3DA579 100%)",
                    boxShadow:
                      "0 14px 40px rgba(109,208,169,0.55), inset 0 -3px 0 rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.4)",
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#052016" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13" cy="4.5" r="2" />
                    <path d="M5 20l3-5 4-2-2-4 4 1 2 3 3-1" />
                  </svg>
                </Link>
              </li>
            );
          }
          return (
            <li key={it.href} className="flex justify-center">
              <Link
                href={it.href}
                className="flex flex-col items-center gap-1 py-2 px-3 rounded-2xl"
                aria-label={it.label}
              >
                <Icon name={it.icon} active={active} />
                <span
                  className="text-[10px] font-bold tracking-wide uppercase"
                  style={{ color: active ? "#6DD0A9" : "rgba(255,255,255,0.55)" }}
                >
                  {it.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
