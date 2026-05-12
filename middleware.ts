import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PREMIUM_PATHS = [/^\/leaderboard(\/|$)/, /^\/profile\/[^/]+(\/|$)/];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (toSet) =>
          toSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    },
  );

  // Refresh session
  await supabase.auth.getUser();

  // Note: pages themselves render Paywall for non-premium; middleware just keeps session fresh.
  return res;
}

export const config = {
  matcher: ["/((?!api/stripe/webhook|_next/static|_next/image|favicon.ico).*)"],
};
