"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ name, active }: { name: string; active: boolean }) {
  const stroke = active ? "var(--mint)" : "var(--ink-3)";
  const p = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":
      return (
        <svg {...p}>
          <path d="M3 11.2 12 4l9 7.2" />
          <path d="M5.5 10v9.5h13V10" />
        </svg>
      );
    case "map":
      return (
        <svg {...p}>
          <path d="m9 4-6 2.2v13.6L9 18l6 2 6-2.2V4l-6 2-6-2Z" />
          <path d="M9 4v14" />
          <path d="M15 6v14" />
        </svg>
      );
    case "run":
      return (
        <svg {...p}>
          <circle cx="13" cy="4.5" r="1.6" />
          <path d="M5 20.5 8 15l3.5-1.5L10 10l4.2.7 1.6 2.6 3.2-.9" />
        </svg>
      );
    case "board":
      return (
        <svg {...p}>
          <rect x="4" y="13" width="4" height="8" rx="0.8" />
          <rect x="10" y="8" width="4" height="13" rx="0.8" />
          <rect x="16" y="4" width="4" height="17" rx="0.8" />
        </svg>
      );
    case "shop":
      return (
        <svg {...p}>
          <path d="M5 8h14l-1 11.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5L5 8Z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>
      );
  }
  return null;
}

const items = [
  { href: "/", label: "Home", icon: "home" },
  { href: "/map", label: "Map", icon: "map" },
  { href: "/run", label: "Run", icon: "run" },
  { href: "/leaderboard", label: "Ranks", icon: "board" },
  { href: "/shop", label: "Shop", icon: "shop" },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="bottom-nav">
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {items.map((it) => {
          const active = path === it.href;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className="relative flex flex-col items-center gap-1 py-3"
                aria-label={it.label}
              >
                <Icon name={it.icon} active={active} />
                <span
                  className="text-[10px] font-medium tracking-wide"
                  style={{ color: active ? "var(--mint)" : "var(--ink-3)" }}
                >
                  {it.label}
                </span>
                {active && (
                  <span
                    className="absolute top-1 w-1 h-1 rounded-full"
                    style={{ background: "var(--mint)" }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
